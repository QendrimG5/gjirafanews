namespace GjirafaNewsAPI.Services;

/// <summary>
/// Bound from the "OpenAI" configuration section — same section as
/// <see cref="OpenAIEmbeddingOptions"/>, so <c>ApiKey</c> and <c>BaseUrl</c>
/// are shared. <c>ChatModel</c> is its own key under the section so it doesn't
/// collide with the embedding model's <c>Model</c>.
/// </summary>
public sealed class OpenAIChatOptions
{
    public const string SectionName = "OpenAI";

    public string ApiKey { get; init; } = string.Empty;
    public string BaseUrl { get; init; } = "https://api.openai.com/v1/";

    /// <summary>Chat completions model id, e.g. "gpt-4o-mini".</summary>
    public string ChatModel { get; init; } = "gpt-4o-mini";

    /// <summary>Upper bound on assistant response length (output tokens).</summary>
    public int MaxTokens { get; init; } = 800;

    /// <summary>Lower temperature = more deterministic; 0.2 is good for grounded RAG.</summary>
    public double Temperature { get; init; } = 0.2;
}
