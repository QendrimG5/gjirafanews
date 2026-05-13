using Pgvector;

namespace GjirafaNewsAPI.Services;

public interface IEmbeddingService
{
    /// <summary>Embed a single text. Used by the future search endpoint to embed the query.</summary>
    Task<Vector> EmbedAsync(string text, CancellationToken ct = default);

    /// <summary>
    /// Embed a batch of texts in a single API call (OpenAI's embeddings endpoint
    /// accepts an array input). Result is in the same order as the input.
    /// </summary>
    Task<IReadOnlyList<Vector>> EmbedManyAsync(IReadOnlyList<string> texts, CancellationToken ct = default);

    /// <summary>Generate (or refresh) the embedding for a single article. Synchronous, no queuing.</summary>
    Task<bool> EmbedArticleAsync(int articleId, CancellationToken ct = default);

    /// <summary>
    /// Hangfire entry point. Loads the given articles, embeds them in a single
    /// OpenAI call, and upserts the rows. Defensively re-checks eligibility so
    /// duplicate enqueues (e.g. the user hits backfill twice while jobs are
    /// pending) become no-ops rather than wasted API calls.
    /// <para>
    /// Concrete <c>int[]</c> is chosen over <c>IReadOnlyList&lt;int&gt;</c>
    /// specifically so Hangfire's JSON serializer round-trips it cleanly.
    /// </para>
    /// </summary>
    /// <returns>Number of articles whose embedding was actually written.</returns>
    Task<int> EmbedArticleBatchAsync(int[] articleIds, CancellationToken ct = default);

    /// <summary>
    /// IDs of the next <paramref name="max"/> articles needing an embedding for
    /// the currently configured model. Ordered by Id ASC for deterministic
    /// pagination across repeat calls.
    /// </summary>
    Task<int[]> GetEligibleArticleIdsAsync(int max, CancellationToken ct = default);

    /// <summary>Total articles still needing an embedding for the current model.</summary>
    Task<int> CountEligibleAsync(CancellationToken ct = default);
}
