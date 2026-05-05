using GjirafaNewsAPI.Hubs;
using GjirafaNewsAPI.Models.Dtos;
using Microsoft.AspNetCore.SignalR;

namespace GjirafaNewsAPI.Services;

public class NotificationService(
    IHubContext<NotificationsHub> hub,
    INotificationStore store,
    IDashboardService dashboard) : INotificationService
{
    private const string ClientMethod = "notification";

    public async Task BroadcastAsync(string title, string message, string type, CancellationToken ct = default)
    {
        var dto = Build(title, message, type);
        // Persist first, then push over the wire. If broadcast fails, the row
        // still lands so a late-joining client picks it up via GET on next load.
        await store.AddAsync(dto, ct);
        await hub.Clients.All.SendAsync(ClientMethod, dto, ct);
        _ = dashboard.PushSnapshotAsync();
    }

    public async Task NotifyAdminsAsync(string title, string message, string type, CancellationToken ct = default)
    {
        var dto = Build(title, message, type);
        await store.AddAsync(dto, ct);
        await hub.Clients.Group(NotificationsHub.AdminGroup).SendAsync(ClientMethod, dto, ct);
        _ = dashboard.PushSnapshotAsync();
    }

    private static NotificationDto Build(string title, string message, string type) =>
        new(Guid.NewGuid(), type, title, message, DateTime.UtcNow);
}
