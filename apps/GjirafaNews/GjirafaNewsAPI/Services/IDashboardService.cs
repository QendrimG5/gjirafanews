using GjirafaNewsAPI.Models.Dtos;

namespace GjirafaNewsAPI.Services;

public interface IDashboardService
{
    Task<DashboardSnapshot> ComputeSnapshotAsync(CancellationToken ct = default);
    Task PushSnapshotAsync(CancellationToken ct = default);
}
