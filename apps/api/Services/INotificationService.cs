using GjirafaNewsAPI.Models.Dtos;

namespace GjirafaNewsAPI.Services;

public interface INotificationService
{
    Task BroadcastAsync(string title, string message, string type, CancellationToken ct = default);
    Task NotifyAdminsAsync(string title, string message, string type, CancellationToken ct = default);
}
