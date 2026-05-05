using GjirafaNewsAPI.Hubs;
using GjirafaNewsAPI.Infrastructure.Persistence;
using GjirafaNewsAPI.Models.Dtos;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace GjirafaNewsAPI.Services;

public class DashboardService(
    IServiceScopeFactory scopeFactory,
    OnlineCounter counter,
    IHubContext<DashboardHub> hub,
    ILogger<DashboardService> logger) : IDashboardService
{
    public async Task<DashboardSnapshot> ComputeSnapshotAsync(CancellationToken ct = default)
    {
        // Singleton service — open a per-call scope to grab a fresh DbContext.
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var articlesCount = await db.Articles.CountAsync(ct);
        var notificationsCount = await db.Notifications.CountAsync(ct);
        var chatMessagesCount = await db.ChatMessages.CountAsync(ct);

        var latestNotification = await db.Notifications
            .AsNoTracking()
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new DashboardLatest(n.Title, n.CreatedAt))
            .FirstOrDefaultAsync(ct);

        var latestArticle = await db.Articles
            .AsNoTracking()
            .OrderByDescending(a => a.PublishedAt)
            .Select(a => new DashboardLatestArticle(a.Id, a.Title, a.PublishedAt))
            .FirstOrDefaultAsync(ct);

        return new DashboardSnapshot(
            RealtimeUsers: counter.Notifications,
            ChatUsers: counter.Chat,
            ArticlesCount: articlesCount,
            NotificationsCount: notificationsCount,
            ChatMessagesCount: chatMessagesCount,
            LatestNotification: latestNotification,
            LatestArticle: latestArticle,
            GeneratedAt: DateTime.UtcNow);
    }

    public async Task PushSnapshotAsync(CancellationToken ct = default)
    {
        try
        {
            var snapshot = await ComputeSnapshotAsync(ct);
            await hub.Clients.All.SendAsync("snapshot", snapshot, ct);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            // Don't let a transient DB blip take down the caller (a hub method
            // or background tick). Log and move on; the next push retries.
            logger.LogWarning(ex, "Failed to push dashboard snapshot");
        }
    }
}
