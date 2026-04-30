using GjirafaNewsAPI.Models.Dtos;
using GjirafaNewsAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace GjirafaNewsAPI.Hubs;

// Anonymous-friendly: any client can connect to receive `BroadcastAsync` messages.
// Authenticated admins are added to the `admins` group so `NotifyAdminsAsync`
// reaches only them.
[AllowAnonymous]
public class NotificationsHub(
    OnlineCounter counter,
    IDashboardService dashboard) : Hub
{
    public const string Path = "/hubs/notifications";
    public const string AdminGroup = "admins";

    public override async Task OnConnectedAsync()
    {
        if (Context.User?.Identity?.IsAuthenticated == true &&
            Context.User.IsInRole("admin"))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, AdminGroup);
        }

        var count = counter.IncrementNotifications();
        await Clients.All.SendAsync("presence", count);
        await Clients.All.SendAsync(
            "notification",
            BuildPresenceNotification("Klient u lidh", count));

        _ = dashboard.PushSnapshotAsync();
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var count = counter.DecrementNotifications();
        await Clients.All.SendAsync("presence", count);
        await Clients.All.SendAsync(
            "notification",
            BuildPresenceNotification("Klient u shkeput", count));

        _ = dashboard.PushSnapshotAsync();
        await base.OnDisconnectedAsync(exception);
    }

    private static NotificationDto BuildPresenceNotification(string title, int count) =>
        new(
            Id: Guid.NewGuid(),
            Type: "presence",
            Title: title,
            Message: $"Klientet e lidhur: {count}",
            CreatedAt: DateTime.UtcNow);
}
