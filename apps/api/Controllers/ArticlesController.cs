using GjirafaNewsAPI.Caching;
using GjirafaNewsAPI.Domain.Entities;
using GjirafaNewsAPI.Infrastructure.Persistence;
using GjirafaNewsAPI.Models.Dtos;
using GjirafaNewsAPI.Repositories;
using GjirafaNewsAPI.Services;
using Hangfire;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Pgvector.EntityFrameworkCore;  // CosineDistance LINQ translation

namespace GjirafaNewsAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ArticlesController(
    IArticleRepository repo,
    DapperArticleRepository dapper,
    IRedisService redis,
    INotificationService notifications,
    IOptions<CacheOptions> cacheOptions,
    AppDbContext db) : ControllerBase
{
    private const string CacheHeader = "X-Cache";
    private const int PageSize = 20;

    // GET /api/articles?page=1
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, CancellationToken ct = default)
    {
        var cached = await redis.GetArticleListPageAsync(page, PageSize, ct);
        if (cached is not null)
        {
            Response.Headers[CacheHeader] = "HIT";
            return Ok(cached);
        }

        var max = cacheOptions.Value.ArticleListMaxSize;
        var articles = await repo.GetAllForCacheAsync(max, ct);
        var allDtos = articles.Select(a => a.ToListDto()).ToList();

        await redis.SetArticleListAsync(allDtos, ct);

        var pageDtos = allDtos
            .Skip((page - 1) * PageSize)
            .Take(PageSize)
            .ToList();

        Response.Headers[CacheHeader] = "MISS";
        return Ok(pageDtos);
    }

    // GET /api/articles/5
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct = default)
    {
        var cached = await redis.GetArticleDetailAsync(id, ct);
        if (cached is not null)
        {
            Response.Headers[CacheHeader] = "HIT";
            return Ok(cached);
        }

        var article = await repo.GetByIdAsync(id);
        if (article is null) return NotFound();

        var dto = article.ToDetailDto();
        await redis.SetArticleDetailAsync(id, dto, ct);

        Response.Headers[CacheHeader] = "MISS";
        return Ok(dto);
    }

    // GET /api/articles/stats — verify GroupBy + aggregate (read_time not read_time_minutes)
    [HttpGet("stats")]
    public async Task<IActionResult> Stats() =>
        Ok(await repo.GetCategoryStatsAsync());

    // GET /api/articles/by-category/{categoryId}?page=1&pageSize=20
    // Offset pagination: latest articles in a category, ordered by PublishedAt DESC, Id DESC.
    [HttpGet("by-category/{categoryId:int}")]
    public async Task<IActionResult> GetByCategory(
        int categoryId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = db.Articles.AsNoTracking().Where(a => a.CategoryId == categoryId);
        var total = await query.CountAsync(ct);

        var articles = await query
            .Include(a => a.Category)
            .Include(a => a.Source)
            .Include(a => a.Tags)
            .OrderByDescending(a => a.PublishedAt)
            .ThenByDescending(a => a.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return Ok(new
        {
            items = articles.Select(a => a.ToListDto()),
            page,
            pageSize,
            total,
            totalPages = (int)Math.Ceiling(total / (double)pageSize),
        });
    }

    // GET /api/articles/by-category/{categoryId}/cursor?cursor=<base64>&pageSize=20
    // Keyset pagination ordered by (PublishedAt DESC, Id DESC). Stable under inserts
    // and constant-time at any depth. Cursor is an opaque base64 token; treat as
    // untrusted input.
    [HttpGet("by-category/{categoryId:int}/cursor")]
    public async Task<IActionResult> GetByCategoryCursor(
        int categoryId,
        [FromQuery] string? cursor = null,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);

        DateTime? cursorPublishedAt = null;
        int? cursorId = null;
        if (!string.IsNullOrEmpty(cursor))
        {
            if (!TryDecodeCursor(cursor, out var p, out var i))
                return BadRequest(new { error = "Invalid cursor" });
            cursorPublishedAt = p;
            cursorId = i;
        }

        var query = db.Articles.AsNoTracking().Where(a => a.CategoryId == categoryId);
        if (cursorPublishedAt is { } cp && cursorId is { } ci)
        {
            query = query.Where(a =>
                a.PublishedAt < cp ||
                (a.PublishedAt == cp && a.Id < ci));
        }

        var rows = await query
            .Include(a => a.Category)
            .Include(a => a.Source)
            .Include(a => a.Tags)
            .OrderByDescending(a => a.PublishedAt)
            .ThenByDescending(a => a.Id)
            .Take(pageSize + 1)
            .ToListAsync(ct);

        string? nextCursor = null;
        if (rows.Count > pageSize)
        {
            var last = rows[pageSize - 1];
            nextCursor = EncodeCursor(last.PublishedAt, last.Id);
            rows.RemoveAt(rows.Count - 1);
        }

        return Ok(new
        {
            items = rows.Select(a => a.ToListDto()),
            pageSize,
            nextCursor,
        });
    }

    private static string EncodeCursor(DateTime publishedAt, int id)
    {
        var raw = $"{publishedAt:O}|{id}";
        return Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(raw));
    }

    private static bool TryDecodeCursor(string cursor, out DateTime publishedAt, out int id)
    {
        publishedAt = default;
        id = 0;
        try
        {
            var raw = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(cursor));
            var parts = raw.Split('|', 2);
            if (parts.Length != 2) return false;
            if (!DateTime.TryParse(
                    parts[0],
                    System.Globalization.CultureInfo.InvariantCulture,
                    System.Globalization.DateTimeStyles.RoundtripKind,
                    out publishedAt)) return false;
            if (!int.TryParse(parts[1], out id)) return false;
            return true;
        }
        catch
        {
            return false;
        }
    }

    // POST /api/articles
    [HttpPost]
    //[Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ArticleDetailDto>> Create(
        [FromBody] CreateArticleRequest request,
        CancellationToken ct = default)
    {
        if (!await db.Categories.AnyAsync(c => c.Id == request.CategoryId, ct))
            return BadRequest(new { error = "Invalid categoryId" });
        if (!await db.Sources.AnyAsync(s => s.Id == request.SourceId, ct))
            return BadRequest(new { error = "Invalid sourceId" });

        var slug = await GenerateUniqueSlugAsync(request.Title, ignoreId: null, ct);
        var entity = new Article
        {
            Title = request.Title,
            Slug = slug,
            Summary = request.Summary,
            Content = request.Content,
            ImageUrl = request.ImageUrl ?? "https://picsum.photos/seed/new/800/400",
            ReadTime = request.ReadTime ?? 3,
            PublishedAt = DateTime.UtcNow,
            CategoryId = request.CategoryId,
            SourceId = request.SourceId,
        };
        db.Articles.Add(entity);
        await db.SaveChangesAsync(ct);

        await redis.InvalidateArticleAsync(entity.Id, ct);
        var created = await repo.GetByIdAsync(entity.Id);
        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, created!.ToDetailDto());
    }

    // PUT /api/articles/5
    [HttpPut("{id:int}")]
    //[Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<ArticleDetailDto>> Update(
        int id,
        [FromBody] UpdateArticleRequest request,
        CancellationToken ct = default)
    {
        var entity = await db.Articles.FirstOrDefaultAsync(a => a.Id == id, ct);
        if (entity is null) return NotFound();

        if (!await db.Categories.AnyAsync(c => c.Id == request.CategoryId, ct))
            return BadRequest(new { error = "Invalid categoryId" });
        if (!await db.Sources.AnyAsync(s => s.Id == request.SourceId, ct))
            return BadRequest(new { error = "Invalid sourceId" });

        if (entity.Title != request.Title)
        {
            entity.Slug = await GenerateUniqueSlugAsync(request.Title, ignoreId: id, ct);
        }
        entity.Title = request.Title;
        entity.Summary = request.Summary;
        entity.Content = request.Content;
        entity.ImageUrl = request.ImageUrl ?? entity.ImageUrl;
        entity.CategoryId = request.CategoryId;
        entity.SourceId = request.SourceId;
        entity.ReadTime = request.ReadTime ?? entity.ReadTime;
        await db.SaveChangesAsync(ct);

        await redis.InvalidateArticleAsync(id, ct);
        var updated = await repo.GetByIdAsync(id);
        return Ok(updated!.ToDetailDto());
    }

    // DELETE /api/articles/5 — verify soft delete
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(
        int id,
        [FromServices] IDashboardService dashboard,
        CancellationToken ct = default)
    {
        await repo.DeleteAsync(id);
        await redis.InvalidateArticleAsync(id, ct);
        await notifications.NotifyAdminsAsync(
            title: "Article deleted",
            message: $"Article #{id} was deleted.",
            type: "article.deleted",
            ct);
        _ = dashboard.PushSnapshotAsync();
        return NoContent();
    }

    private async Task<string> GenerateUniqueSlugAsync(string title, int? ignoreId, CancellationToken ct)
    {
        var baseSlug = SlugHelper.Slugify(title);
        if (string.IsNullOrEmpty(baseSlug)) baseSlug = "article";
        var slug = baseSlug;
        var suffix = 2;
        while (await db.Articles.AnyAsync(
                   a => a.Slug == slug && (ignoreId == null || a.Id != ignoreId),
                   ct))
        {
            slug = $"{baseSlug}-{suffix++}";
        }
        return slug;
    }

    // ── Embeddings ────────────────────────────────────────────────────────

    // POST /api/articles/embeddings/backfill?max=500&batchSize=50
    // Enqueues Hangfire jobs to embed up to `max` articles that don't yet have
    // an embedding for the currently configured model. Returns immediately
    // (202 Accepted) with the list of enqueued job IDs.
    //
    // Each Hangfire job processes one chunk of `batchSize` articles in a single
    // OpenAI API call (the embeddings endpoint accepts array input). Splitting
    // into chunks parallelizes across Hangfire workers and gives per-chunk
    // retry semantics — if one batch fails, only its articles get retried, not
    // the whole run.
    //
    // Caps:
    //   max       1..5000   — how many articles to queue in this request
    //   batchSize 1..100    — articles per OpenAI call (and per Hangfire job)
    //
    // Idempotent end-to-end: the job re-checks eligibility, so duplicate
    // enqueues (e.g. hitting this endpoint twice before the first run finishes)
    // become no-ops rather than wasted API calls.
    [HttpPost("embeddings/backfill")]
    public async Task<IActionResult> BackfillEmbeddings(
        [FromServices] IEmbeddingService embeddings,
        [FromServices] IBackgroundJobClient jobs,
        [FromQuery] int max = 500,
        [FromQuery] int batchSize = 50,
        CancellationToken ct = default)
    {
        max = Math.Clamp(max, 1, 5000);
        batchSize = Math.Clamp(batchSize, 1, 100);

        var totalEligibleBefore = await embeddings.CountEligibleAsync(ct);
        var eligibleIds = await embeddings.GetEligibleArticleIdsAsync(max, ct);

        var jobIds = new List<string>(capacity: (eligibleIds.Length + batchSize - 1) / batchSize);
        foreach (var chunk in eligibleIds.Chunk(batchSize))
        {
            // Hangfire serializes the expression tree; the IEmbeddingService is
            // resolved fresh from DI by the worker. `default` for the CT is
            // substituted with Hangfire's own shutdown token at execution.
            var jobId = jobs.Enqueue<IEmbeddingService>(s => s.EmbedArticleBatchAsync(chunk, default));
            jobIds.Add(jobId);
        }

        return Accepted(new
        {
            articlesQueued = eligibleIds.Length,
            batches = jobIds.Count,
            batchSize,
            totalEligibleBefore,
            jobIds,
            dashboard = "/hangfire",
        });
    }

    // POST /api/articles/{id}/embedding — (re)embed a single article synchronously.
    // For ad-hoc re-embedding of one article (e.g. after a content update).
    [HttpPost("{id:int}/embedding")]
    public async Task<IActionResult> EmbedOne(
        int id,
        [FromServices] IEmbeddingService embeddings,
        CancellationToken ct = default)
    {
        var ok = await embeddings.EmbedArticleAsync(id, ct);
        return ok ? NoContent() : NotFound();
    }

    // GET /api/articles/embeddings/status — how many articles still need embedding.
    // Useful during a backfill to know when to stop calling /backfill.
    [HttpGet("embeddings/status")]
    public async Task<IActionResult> EmbeddingStatus(
        [FromServices] IEmbeddingService embeddings,
        CancellationToken ct = default)
    {
        var eligible = await embeddings.CountEligibleAsync(ct);
        var totalArticles = await db.Articles.CountAsync(ct);
        return Ok(new
        {
            eligible,
            embedded = totalArticles - eligible,
            totalArticles,
        });
    }

    // GET /api/articles/search?q=<text>&limit=20
    // Semantic search. Embeds the query with the SAME OpenAI model used to
    // produce the stored embeddings, then runs an ANN scan against
    // article_embeddings ordered by cosine distance (`<=>`), which uses the
    // HNSW + vector_cosine_ops index defined in ArticleEmbeddingConfiguration.
    //
    // Two-query strategy:
    //   1. Vector scan returning (ArticleId, Distance) only — tiny payload,
    //      lets the planner use the HNSW index unencumbered.
    //   2. Load the full Article graph (Category/Source/Tags) for the matched
    //      IDs in one round-trip, then re-order client-side to preserve the
    //      ANN ranking.
    //
    // The Model filter guards against a model swap: stale embeddings produced
    // by a previous model are excluded automatically until they're re-embedded.
    [HttpGet("search")]
    public async Task<IActionResult> Search(
        [FromServices] IEmbeddingService embeddings,
        [FromServices] IOptions<OpenAIEmbeddingOptions> openAIOptions,
        [FromQuery] string? q = null,
        [FromQuery] int limit = 20,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(q))
            return BadRequest(new { error = "Query 'q' is required" });

        limit = Math.Clamp(limit, 1, 100);
        var modelName = openAIOptions.Value.Model;

        // One OpenAI call to embed the query. (Future: Redis cache by SHA-256
        // of the normalized query to avoid repeated paid calls for popular
        // searches — out of scope here.)
        var queryVec = await embeddings.EmbedAsync(q, ct);

        // 1) ANN scan. The OrderBy <=> + Take(limit) is what triggers HNSW use.
        var hits = await db.ArticleEmbeddings.AsNoTracking()
            .Where(e => e.Model == modelName)
            .OrderBy(e => e.Embedding.CosineDistance(queryVec))
            .Take(limit)
            .Select(e => new
            {
                e.ArticleId,
                Distance = e.Embedding.CosineDistance(queryVec),
            })
            .ToListAsync(ct);

        if (hits.Count == 0)
            return Ok(new { query = q, limit, model = modelName, results = Array.Empty<object>() });

        // 2) Hydrate the article rows. The global soft-delete filter on Article
        //    is applied here automatically — if any of the matched articles
        //    have since been soft-deleted, they silently drop out (results
        //    will be < limit; acceptable for a v1 search).
        var ids = hits.Select(h => h.ArticleId).ToArray();
        var distanceById = hits.ToDictionary(h => h.ArticleId, h => h.Distance);

        var articles = await db.Articles.AsNoTracking()
            .Where(a => ids.Contains(a.Id))
            .Include(a => a.Category)
            .Include(a => a.Source)
            .Include(a => a.Tags)
            .ToListAsync(ct);
        var articleById = articles.ToDictionary(a => a.Id);

        // 3) Re-order by ANN ranking and project to the response shape.
        var results = ids
            .Where(articleById.ContainsKey)
            .Select(id =>
            {
                var distance = distanceById[id];
                return new
                {
                    article = articleById[id].ToListDto(),
                    distance,
                    // Cosine distance is in [0, 2]; for L2-normalized embeddings
                    // (which OpenAI's text-embedding-3-* models produce) it sits
                    // in [0, 2] with 0 = identical. similarity = 1 - distance
                    // gives the conventional [-1, 1] cosine-similarity scale,
                    // typically ~[0.2, 1.0] for relevant hits.
                    similarity = 1.0 - distance,
                };
            })
            .ToList();

        return Ok(new
        {
            query = q,
            limit,
            model = modelName,
            results,
        });
    }

    // POST /api/articles/chat
    // RAG: embed the question → ANN search → build a grounded prompt → stream
    // the chat completion back as SSE-framed events. Body: { question, topK? }.
    // Response: text/event-stream with `data: {json}\n\n` frames.
    //
    // Event sequence:
    //   1) { "type": "sources", "articles": [...] }  — emitted before tokens so
    //      the UI can render the citation panel up-front.
    //   2) { "type": "token",   "text": "..."     }  — many of these, one per
    //      OpenAI delta.content chunk.
    //   3) terminator: { "type": "done" }  OR  { "type": "error", "message": "..." }
    [HttpPost("chat")]
    public async Task Chat(
        [FromServices] IEmbeddingService embeddings,
        [FromServices] IChatCompletionService chat,
        [FromServices] IOptions<OpenAIEmbeddingOptions> embeddingOptions,
        [FromBody] ChatRequest request,
        CancellationToken ct)
    {
        // SSE response setup MUST happen before the first write. Disable
        // response buffering so each frame flushes immediately — otherwise
        // Kestrel batches and the "streaming" illusion disappears.
        Response.ContentType = "text/event-stream; charset=utf-8";
        Response.Headers["Cache-Control"] = "no-cache, no-transform";
        Response.Headers["X-Accel-Buffering"] = "no";  // nginx/yarp hint
        var bodyFeature = HttpContext.Features.Get<Microsoft.AspNetCore.Http.Features.IHttpResponseBodyFeature>();
        bodyFeature?.DisableBuffering();

        var jsonOpts = new System.Text.Json.JsonSerializerOptions
        {
            PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase,
        };

        async Task WriteEventAsync(object payload)
        {
            var json = System.Text.Json.JsonSerializer.Serialize(payload, jsonOpts);
            await Response.WriteAsync($"data: {json}\n\n", ct);
            await Response.Body.FlushAsync(ct);
        }

        if (request is null || string.IsNullOrWhiteSpace(request.Question))
        {
            await WriteEventAsync(new { type = "error", message = "Question is required" });
            return;
        }

        var topK = Math.Clamp(request.TopK ?? 5, 1, 20);

        try
        {
            // 1) Retrieve — same pattern as /search above.
            var modelName = embeddingOptions.Value.Model;
            var queryVec = await embeddings.EmbedAsync(request.Question, ct);

            var hits = await db.ArticleEmbeddings.AsNoTracking()
                .Where(e => e.Model == modelName)
                .OrderBy(e => e.Embedding.CosineDistance(queryVec))
                .Take(topK)
                .Select(e => new { e.ArticleId, Distance = e.Embedding.CosineDistance(queryVec) })
                .ToListAsync(ct);

            var ids = hits.Select(h => h.ArticleId).ToArray();
            var articles = await db.Articles.AsNoTracking()
                .Where(a => ids.Contains(a.Id))
                .Include(a => a.Category)
                .Include(a => a.Source)
                .ToListAsync(ct);
            var byId = articles.ToDictionary(a => a.Id);
            var distById = hits.ToDictionary(h => h.ArticleId, h => h.Distance);

            // Preserve ANN ranking order (Dictionary lookup, drop any that were
            // soft-deleted between the embedding query and the article hydration).
            var ordered = ids.Where(byId.ContainsKey).Select(id => byId[id]).ToList();

            // 2) Sources event — fires BEFORE tokens so the UI can render the
            //    "based on these articles" pills up-front while the LLM thinks.
            await WriteEventAsync(new
            {
                type = "sources",
                articles = ordered.Select((a, i) => new
                {
                    rank = i + 1,
                    id = a.Id,
                    title = a.Title,
                    summary = a.Summary,
                    category = a.Category?.Name,
                    source = a.Source?.Name,
                    publishedAt = a.PublishedAt,
                    similarity = 1.0 - distById[a.Id],
                }),
            });

            // 3) Build the grounded prompt. Title + Summary per article is
            //    enough for summarization without blowing the context window.
            //    Numbered context block matches the [1], [2] citation format
            //    the system prompt requests.
            var contextBlock = string.Join("\n\n", ordered.Select((a, i) =>
                $"[{i + 1}] {a.Title}\n{a.Summary}"));

            var messages = new List<ChatCompletionMessage>
            {
                new("system",
                    "You are a helpful news assistant. Answer the user's question using ONLY " +
                    "the provided article snippets. Cite sources inline as [1], [2], etc. matching " +
                    "the numbered context. If the snippets do not contain enough information to " +
                    "answer, say so explicitly — do not invent facts."),
                new("user",
                    $"Question: {request.Question}\n\nContext articles:\n{contextBlock}"),
            };

            // 4) Stream tokens. Each yielded chunk gets wrapped in a "token"
            //    SSE frame. Cancellation flows end-to-end: client disconnect →
            //    ct triggers → StreamAsync cancels its outbound HTTP to OpenAI.
            await foreach (var token in chat.StreamAsync(messages, ct))
            {
                await WriteEventAsync(new { type = "token", text = token });
            }

            await WriteEventAsync(new { type = "done" });
        }
        catch (OperationCanceledException)
        {
            // Client disconnected. Nothing to send — the socket is already gone.
        }
        catch (Exception ex)
        {
            try { await WriteEventAsync(new { type = "error", message = ex.Message }); }
            catch { /* response already closed; swallow */ }
        }
    }

    public sealed record ChatRequest(string Question, int? TopK);

    // ── Dapper endpoints ──────────────────────────────────────────────────

    // GET /api/articles/top?topN=10 — Dapper Pattern 1: typed query
    [HttpGet("top")]
    public async Task<IActionResult> Top([FromQuery] int topN = 10) =>
        Ok(await dapper.GetTopArticlesByReadTimeAsync(topN));

    // GET /api/articles/with-category — Dapper Pattern 2: multi-mapping
    [HttpGet("with-category")]
    public async Task<IActionResult> WithCategory() =>
        Ok(await dapper.GetArticlesWithCategoryAsync());

    // GET /api/articles/source-stats — Dapper Pattern 3: aggregation
    [HttpGet("source-stats")]
    public async Task<IActionResult> SourceStats() =>
        Ok(await dapper.GetSourceStatsAsync());

    // GET /api/articles/trending?days=7&limit=10 — Dapper Pattern 4: stored proc
    [HttpGet("trending")]
    public async Task<IActionResult> Trending([FromQuery] int days = 7, [FromQuery] int limit = 10) =>
        Ok(await dapper.GetTrendingAsync(days, limit));

    // POST /api/articles/{id}/views?count=1000 — Dapper Pattern 5: bulk insert via unnest
    [HttpPost("{id:int}/views")]
    public async Task<IActionResult> RecordViews(int id, [FromQuery] int count = 1)
    {
        var now = DateTime.UtcNow;
        var views = Enumerable.Range(0, count).Select(i => (ArticleId: id, ViewedAt: now.AddSeconds(-i)));
        await dapper.BulkInsertViewsAsync(views);
        return NoContent();
    }

    // POST /api/articles/seed?max=1500 — Dev-only bulk seed from infra/seed/seed-articles.json.
    // Idempotent: skips articles whose slug already exists. Heavy lifting lives in
    // ArticleSeederService; the controller handles env gating, path resolution,
    // and cache invalidation.
    [HttpPost("seed")]
    public async Task<IActionResult> SeedFromFile(
        [FromServices] IArticleSeederService seeder,
        [FromServices] IWebHostEnvironment env,
        [FromQuery] string? filePath = null,
        [FromQuery] int? max = null,
        CancellationToken ct = default)
    {
        if (!env.IsDevelopment())
            return StatusCode(StatusCodes.Status403Forbidden, new { error = "Seeding is only allowed in Development." });

        var resolvedPath = ResolveSeedPath(env, filePath);
        if (resolvedPath is null)
            return NotFound(new { error = "seed-articles.json not found. Pass ?filePath=<absolute path>." });

        ArticleSeedResult result;
        try
        {
            result = await seeder.SeedFromFileAsync(resolvedPath, max, ct);
        }
        catch (InvalidDataException ex)
        {
            return BadRequest(new { error = ex.Message });
        }

        // Flush the cached article list so /api/articles reflects the new rows
        await redis.InvalidateArticleAsync(id: 0, ct);

        return Ok(new
        {
            result.Inserted,
            result.Skipped,
            result.Total,
            filePath = resolvedPath,
        });
    }

    private static string? ResolveSeedPath(IWebHostEnvironment env, string? filePath)
    {
        if (!string.IsNullOrWhiteSpace(filePath) && System.IO.File.Exists(filePath))
            return Path.GetFullPath(filePath);

        var root = env.ContentRootPath;
        string[] candidates =
        {
            Path.Combine(root, "infra", "seed", "seed-articles.json"),
            Path.Combine(root, "..", "..", "infra", "seed", "seed-articles.json"),
            Path.Combine(root, "Infrastructure", "Data", "seed-articles.json"),
        };
        var match = candidates.FirstOrDefault(System.IO.File.Exists);
        return match is null ? null : Path.GetFullPath(match);
    }
}
