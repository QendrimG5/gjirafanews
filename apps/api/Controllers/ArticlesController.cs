using GjirafaNewsAPI.Caching;
using GjirafaNewsAPI.Domain.Entities;
using GjirafaNewsAPI.Infrastructure.Persistence;
using GjirafaNewsAPI.Models.Dtos;
using GjirafaNewsAPI.Repositories;
using GjirafaNewsAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

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

    // POST /api/articles
    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
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
    [Authorize(Policy = "AdminOnly")]
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
}
