namespace GjirafaNewsAPI.Services;

public interface IArticleSeederService
{
    /// <summary>
    /// Reads <paramref name="filePath"/> as the seed JSON, upserts any missing
    /// categories / sources / tags from its <c>meta</c> block, then inserts
    /// articles in batches — skipping rows whose <c>slug</c> already exists so
    /// the operation is idempotent.
    /// </summary>
    Task<ArticleSeedResult> SeedFromFileAsync(string filePath, int? max, CancellationToken ct);
}

public sealed record ArticleSeedResult(int Inserted, int Skipped, int Total);
