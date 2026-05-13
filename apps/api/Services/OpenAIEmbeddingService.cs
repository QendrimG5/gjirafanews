using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using GjirafaNewsAPI.Domain.Entities;
using GjirafaNewsAPI.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Pgvector;

namespace GjirafaNewsAPI.Services;

/// <summary>
/// OpenAI-compatible embeddings client. Posts directly to <c>{BaseUrl}embeddings</c>
/// with no SDK dependency, which keeps it swappable to Azure OpenAI / a local
/// proxy / any other OpenAI-API-compatible endpoint by changing
/// <see cref="OpenAIEmbeddingOptions.BaseUrl"/>.
/// </summary>
public sealed class OpenAIEmbeddingService(
    HttpClient http,
    IOptions<OpenAIEmbeddingOptions> options,
    AppDbContext db,
    ILogger<OpenAIEmbeddingService> logger) : IEmbeddingService
{
    // snake_case JSON for both directions — matches OpenAI's wire format
    // (e.g. "encoding_format") without per-property attributes.
    private static readonly JsonSerializerOptions Json = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public async Task<Vector> EmbedAsync(string text, CancellationToken ct = default)
    {
        var result = await EmbedManyAsync(new[] { text }, ct);
        return result[0];
    }

    public async Task<IReadOnlyList<Vector>> EmbedManyAsync(
        IReadOnlyList<string> texts, CancellationToken ct = default)
    {
        if (texts.Count == 0) return Array.Empty<Vector>();

        var opts = options.Value;
        var truncated = new string[texts.Count];
        for (var i = 0; i < texts.Count; i++)
            truncated[i] = Truncate(texts[i], opts.MaxInputCharacters);

        var body = new EmbeddingRequest(
            Model: opts.Model,
            Input: truncated,
            Dimensions: opts.Dimensions,
            EncodingFormat: "float");

        using var resp = await http.PostAsJsonAsync("embeddings", body, Json, ct);
        if (!resp.IsSuccessStatusCode)
        {
            var error = await resp.Content.ReadAsStringAsync(ct);
            throw new HttpRequestException(
                $"OpenAI embeddings API returned {(int)resp.StatusCode}: {error}");
        }

        var parsed = await resp.Content.ReadFromJsonAsync<EmbeddingResponse>(Json, ct)
            ?? throw new InvalidOperationException("OpenAI returned an empty body");

        if (parsed.Data is null || parsed.Data.Length != texts.Count)
            throw new InvalidOperationException(
                $"OpenAI returned {parsed.Data?.Length ?? 0} embeddings for {texts.Count} inputs");

        // The API guarantees order matches input, but sort by Index defensively.
        var ordered = parsed.Data.OrderBy(d => d.Index).ToArray();
        var result = new Vector[ordered.Length];
        for (var i = 0; i < ordered.Length; i++)
            result[i] = new Vector(ordered[i].Embedding);
        return result;
    }

    public async Task<bool> EmbedArticleAsync(int articleId, CancellationToken ct = default)
    {
        var article = await db.Articles.AsNoTracking()
            .Where(a => a.Id == articleId)
            .Select(a => new ArticleInput(a.Id, a.Title, a.Summary, a.Content))
            .FirstOrDefaultAsync(ct);

        if (article is null) return false;

        var input = BuildInput(article);
        if (string.IsNullOrWhiteSpace(input)) return false;

        var vector = await EmbedAsync(input, ct);
        await UpsertEmbeddingAsync(article.Id, vector, ComputeHash(input), ct);
        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<int[]> GetEligibleArticleIdsAsync(int max, CancellationToken ct = default)
    {
        max = Math.Clamp(max, 1, 5000);
        var opts = options.Value;
        return await EligibleQuery(opts.Model)
            .OrderBy(a => a.Id)
            .Select(a => a.Id)
            .Take(max)
            .ToArrayAsync(ct);
    }

    public Task<int> CountEligibleAsync(CancellationToken ct = default) =>
        EligibleQuery(options.Value.Model).CountAsync(ct);

    public async Task<int> EmbedArticleBatchAsync(int[] articleIds, CancellationToken ct = default)
    {
        if (articleIds is null || articleIds.Length == 0) return 0;
        var opts = options.Value;

        // Defensive re-check: drop IDs that already have a matching embedding.
        // Makes the job a no-op when duplicate batches were enqueued (e.g. the
        // user hit /backfill twice while pending jobs hadn't run yet).
        var alreadyDone = await db.ArticleEmbeddings.AsNoTracking()
            .Where(e => articleIds.Contains(e.ArticleId) && e.Model == opts.Model)
            .Select(e => e.ArticleId)
            .ToArrayAsync(ct);
        var stillEligible = articleIds.Except(alreadyDone).ToArray();
        if (stillEligible.Length == 0)
        {
            logger.LogInformation("Embedding batch fully redundant ({Count} ids); skipping API call.",
                articleIds.Length);
            return 0;
        }

        var rows = await db.Articles.AsNoTracking()
            .Where(a => stillEligible.Contains(a.Id))
            .Select(a => new ArticleInput(a.Id, a.Title, a.Summary, a.Content))
            .ToListAsync(ct);

        // Build inputs and prune empties (would 400 from OpenAI).
        var toEmbed = new List<ArticleInput>(rows.Count);
        var inputs = new List<string>(rows.Count);
        foreach (var r in rows)
        {
            var input = BuildInput(r);
            if (string.IsNullOrWhiteSpace(input)) continue;
            toEmbed.Add(r);
            inputs.Add(input);
        }
        if (inputs.Count == 0) return 0;

        IReadOnlyList<Vector> vectors;
        try
        {
            vectors = await EmbedManyAsync(inputs, ct);
        }
        catch (Exception ex)
        {
            // Re-throw so Hangfire records the failure and applies its retry policy.
            logger.LogError(ex,
                "Embedding batch failed for {Count} articles (ids {Ids}). Hangfire will retry.",
                toEmbed.Count, string.Join(",", toEmbed.Select(a => a.Id)));
            throw;
        }

        for (var i = 0; i < toEmbed.Count; i++)
            await UpsertEmbeddingAsync(toEmbed[i].Id, vectors[i], ComputeHash(inputs[i]), ct);

        await db.SaveChangesAsync(ct);
        logger.LogInformation(
            "Embedding batch wrote {Written}/{Requested} (skipped {Redundant} already done, {Empty} empty content).",
            toEmbed.Count, articleIds.Length, alreadyDone.Length, rows.Count - toEmbed.Count);
        return toEmbed.Count;
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private IQueryable<Article> EligibleQuery(string model) =>
        db.Articles.Where(a => a.Embedding == null || a.Embedding.Model != model);

    private async Task UpsertEmbeddingAsync(int articleId, Vector vector, string hash, CancellationToken ct)
    {
        var opts = options.Value;
        var existing = await db.ArticleEmbeddings.FirstOrDefaultAsync(e => e.ArticleId == articleId, ct);
        if (existing is not null)
        {
            existing.Embedding = vector;
            existing.Model = opts.Model;
            existing.ContentHash = hash;
            // UpdatedAt is set by AuditTimestampInterceptor on SaveChanges
        }
        else
        {
            db.ArticleEmbeddings.Add(new ArticleEmbedding
            {
                ArticleId = articleId,
                Embedding = vector,
                Model = opts.Model,
                ContentHash = hash,
            });
        }
    }

    private string BuildInput(ArticleInput a) =>
        Truncate($"{a.Title}\n\n{a.Summary}\n\n{a.Content}", options.Value.MaxInputCharacters);

    private static string Truncate(string s, int max) =>
        string.IsNullOrEmpty(s) ? string.Empty : (s.Length <= max ? s : s[..max]);

    private static string ComputeHash(string s)
    {
        var bytes = Encoding.UTF8.GetBytes(s);
        var hash = SHA256.HashData(bytes);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    // ── Wire DTOs ────────────────────────────────────────────────────────────

    private sealed record ArticleInput(int Id, string Title, string Summary, string Content);

    private sealed record EmbeddingRequest(
        string Model,
        string[] Input,
        int Dimensions,
        string EncodingFormat);

    private sealed record EmbeddingResponse(EmbeddingData[]? Data);

    private sealed record EmbeddingData(float[] Embedding, int Index);
}
