namespace GjirafaNewsAPI.Services;

public interface IChatCompletionService
{
    /// <summary>
    /// Streams the assistant's reply token-by-token. Each yielded string is a
    /// <c>delta.content</c> chunk from OpenAI's stream — already extracted, no
    /// SSE framing leaks out. Consumers can re-frame these as they see fit
    /// (e.g. wrap in their own SSE events for downstream clients).
    /// </summary>
    IAsyncEnumerable<string> StreamAsync(
        IReadOnlyList<ChatCompletionMessage> messages,
        CancellationToken ct = default);
}

/// <summary>
/// Single message in a chat-completions conversation.
/// <c>Role</c> is one of: <c>"system"</c>, <c>"user"</c>, <c>"assistant"</c>.
/// Named <c>ChatCompletionMessage</c> (not just <c>ChatMessage</c>) to avoid
/// colliding with the live-chat entity in <c>Domain.Entities</c>.
/// </summary>
public sealed record ChatCompletionMessage(string Role, string Content);
