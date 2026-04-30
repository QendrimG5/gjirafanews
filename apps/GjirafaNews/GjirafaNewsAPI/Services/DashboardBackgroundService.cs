namespace GjirafaNewsAPI.Services;

// Periodic snapshot push — covers state changes that don't flow through our
// hubs (e.g. articles created via the Next.js content API but persisted to
// the same Postgres). 10 s is a good balance between freshness and DB load.
public class DashboardBackgroundService(IDashboardService dashboard) : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromSeconds(10);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(Interval);
        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            await dashboard.PushSnapshotAsync(stoppingToken);
        }
    }
}
