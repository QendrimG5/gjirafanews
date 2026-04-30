using GjirafaNewsAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace GjirafaNewsAPI.Hubs;

// Anonymous-friendly: every snapshot field is already publicly observable
// elsewhere (article list, /api/notifications, chat history), so the dashboard
// is just an aggregate view — no admin gate needed.
[AllowAnonymous]
public class DashboardHub(IDashboardService dashboard) : Hub
{
    public const string Path = "/hubs/dashboard";

    // Each client gets a fresh snapshot at connect time so they don't have to
    // wait for the next event/tick to render numbers.
    public override async Task OnConnectedAsync()
    {
        var snapshot = await dashboard.ComputeSnapshotAsync(Context.ConnectionAborted);
        await Clients.Caller.SendAsync("snapshot", snapshot, Context.ConnectionAborted);
        await base.OnConnectedAsync();
    }
}
