using GjirafaNewsAPI.Domain.Entities;
using GjirafaNewsAPI.Infrastructure.Persistence;
using GjirafaNewsAPI.Models.Dtos;
using GjirafaNewsAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace GjirafaNewsAPI.Hubs;

[AllowAnonymous]
public class ChatHub(
    AppDbContext db,
    OnlineCounter counter,
    IDashboardService dashboard) : Hub
{
    public const string Path = "/hubs/chat";

    private const int MaxTextLength = 500;
    private const string ChatEvent = "chat";
    private const string OnlineEvent = "online";

    public override async Task OnConnectedAsync()
    {
        var count = counter.IncrementChat();
        await Clients.All.SendAsync(OnlineEvent, count);
        _ = dashboard.PushSnapshotAsync();
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var count = counter.DecrementChat();
        await Clients.All.SendAsync(OnlineEvent, count);
        _ = dashboard.PushSnapshotAsync();
        await base.OnDisconnectedAsync(exception);
    }

    // Invoked by clients via `connection.invoke("Send", request)`.
    public async Task<ChatMessageDto> Send(SendChatMessageRequest request)
    {
        if (request is null)
            throw new HubException("Request body is required.");

        var username = (request.Username ?? string.Empty).Trim();
        var text = (request.Text ?? string.Empty).Trim();

        if (string.IsNullOrEmpty(username))
            throw new HubException("Username is required.");
        if (string.IsNullOrEmpty(text))
            throw new HubException("Message text is required.");
        if (text.Length > MaxTextLength)
            throw new HubException($"Message exceeds {MaxTextLength} characters.");

        text = SanitizeLinks(text);

        var entity = new ChatMessage
        {
            Id = Guid.NewGuid(),
            Username = username,
            Text = text,
            CreatedAt = DateTime.UtcNow,
        };

        db.ChatMessages.Add(entity);
        await db.SaveChangesAsync(Context.ConnectionAborted);

        var dto = new ChatMessageDto(
            entity.Id,
            entity.Username,
            entity.Text,
            entity.CreatedAt,
            request.ClientId);

        await Clients.All.SendAsync(ChatEvent, dto, Context.ConnectionAborted);
        _ = dashboard.PushSnapshotAsync();
        return dto;
    }

    // External chat URLs are stripped to discourage spam; gjirafanews.com links pass through.
    private const string AllowedHost = "gjirafanews.com";
    private static readonly System.Text.RegularExpressions.Regex UrlRegex =
        new(@"https?://[^\s]+",
            System.Text.RegularExpressions.RegexOptions.Compiled |
            System.Text.RegularExpressions.RegexOptions.IgnoreCase);

    private static string SanitizeLinks(string input) =>
        UrlRegex.Replace(input, match =>
        {
            if (Uri.TryCreate(match.Value, UriKind.Absolute, out var uri))
            {
                var host = uri.Host;
                if (host.Equals(AllowedHost, StringComparison.OrdinalIgnoreCase) ||
                    host.EndsWith("." + AllowedHost, StringComparison.OrdinalIgnoreCase))
                {
                    return match.Value;
                }
            }
            return "[link removed]";
        });
}
