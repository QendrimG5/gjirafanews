using System.Net.Http.Json;
using System.Runtime.CompilerServices;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;

namespace GjirafaNewsAPI.Services;

/// <summary>
/// OpenAI-compatible chat completions client with streaming support. POSTs to
/// <c>{BaseUrl}chat/completions</c> with <c>stream: true</c>, then parses the
/// SSE-framed response and yields each <c>delta.content</c> chunk as it
/// arrives. No SDK dependency — swappable to Azure OpenAI or a local proxy by
/// changing <see cref="OpenAIChatOptions.BaseUrl"/>.
/// </summary>
public sealed class OpenAIChatCompletionService(
    HttpClient http,
    IOptions<OpenAIChatOptions> options,
    ILogger<OpenAIChatCompletionService> logger) : IChatCompletionService
{
    // snake_case for the wire format (matches OpenAI fields like finish_reason,
    // max_tokens, etc. without per-property attributes).
    private static readonly JsonSerializerOptions Json = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public async IAsyncEnumerable<string> StreamAsync(
        IReadOnlyList<ChatCompletionMessage> messages,
        [EnumeratorCancellation] CancellationToken ct = default)
    {
        var opts = options.Value;

        var body = new ChatCompletionRequest(
            Model: opts.ChatModel,
            // OpenAI expects lowercase role values; rely on caller to pass them.
            Messages: messages.Select(m => new ApiMessage(m.Role, m.Content)).ToArray(),
            Stream: true,
            Temperature: opts.Temperature,
            MaxTokens: opts.MaxTokens);

        using var request = new HttpRequestMessage(HttpMethod.Post, "chat/completions")
        {
            Content = JsonContent.Create(body, options: Json),
        };

        // ResponseHeadersRead so we don't buffer the whole body — we want to
        // start reading deltas as soon as headers come back.
        using var response = await http.SendAsync(
            request, HttpCompletionOption.ResponseHeadersRead, ct);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync(ct);
            logger.LogError("OpenAI chat completions returned {Status}: {Body}",
                (int)response.StatusCode, error);
            throw new HttpRequestException(
                $"OpenAI chat completions returned {(int)response.StatusCode}: {error}");
        }

        await using var stream = await response.Content.ReadAsStreamAsync(ct);
        using var reader = new StreamReader(stream);

        // SSE protocol: lines separated by \n; events terminated by blank line;
        // each event has one or more `field: value` lines. OpenAI uses only
        // `data: <json>` lines and the sentinel `data: [DONE]` at the end.
        // ReadLineAsync returns null at EOF — that's the async-safe end check
        // (don't use reader.EndOfStream here, it's a sync blocking read).
        while (true)
        {
            ct.ThrowIfCancellationRequested();
            var line = await reader.ReadLineAsync(ct);
            if (line is null) yield break;                       // EOF
            if (string.IsNullOrEmpty(line)) continue;            // blank = event boundary, ignore
            if (!line.StartsWith("data: ", StringComparison.Ordinal)) continue;

            var payload = line.AsSpan(6).ToString().Trim();
            if (payload == "[DONE]") yield break;

            ChatCompletionChunk? chunk;
            try
            {
                chunk = JsonSerializer.Deserialize<ChatCompletionChunk>(payload, Json);
            }
            catch (JsonException ex)
            {
                logger.LogWarning(ex, "Skipping malformed SSE chunk: {Payload}", payload);
                continue;
            }

            var content = chunk?.Choices?.FirstOrDefault()?.Delta?.Content;
            if (!string.IsNullOrEmpty(content))
                yield return content;
        }
    }

    // ── Wire DTOs ────────────────────────────────────────────────────────────

    private sealed record ChatCompletionRequest(
        string Model,
        ApiMessage[] Messages,
        bool Stream,
        double Temperature,
        int MaxTokens);

    private sealed record ApiMessage(string Role, string Content);

    private sealed record ChatCompletionChunk(ChunkChoice[]? Choices);

    private sealed record ChunkChoice(ChunkDelta? Delta, string? FinishReason);

    private sealed record ChunkDelta(string? Role, string? Content);
}
