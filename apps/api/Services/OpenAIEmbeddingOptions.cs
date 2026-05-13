namespace GjirafaNewsAPI.Services;

/// <summary>
/// Bound from the "OpenAI" configuration section. <see cref="Dimensions"/> MUST
/// match the column type declared in <c>ArticleEmbeddingConfiguration</c> —
/// changing one without the other will cause INSERT to fail with a dimension
/// mismatch error from pgvector.
/// </summary>
public sealed class OpenAIEmbeddingOptions
{
    public const string SectionName = "OpenAI";

    /// <summary>Bearer token. Leave empty in source; supply via env / secrets.</summary>
    public string ApiKey { get; init; } = string.Empty;

    /// <summary>Base URL of the OpenAI-compatible endpoint. Trailing slash is fine.</summary>
    public string BaseUrl { get; init; } = "https://api.openai.com/v1/";

    /// <summary>Embedding model id, e.g. "text-embedding-3-small".</summary>
    public string Model { get; init; } = "text-embedding-3-small";

    /// <summary>
    /// Requested embedding dimensionality. Models in the 3-series accept this
    /// parameter and return a truncated (Matryoshka) embedding.
    /// </summary>
    public int Dimensions { get; init; } = 1024;

    /// <summary>
    /// Hard cap on per-article input length before sending to the API.
    /// text-embedding-3-small's context is ~8K tokens; 8000 chars is a safe
    /// conservative bound that avoids tokenizer-level token counting.
    /// </summary>
    public int MaxInputCharacters { get; init; } = 8000;
}
