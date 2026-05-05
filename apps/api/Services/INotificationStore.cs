using GjirafaNewsAPI.Models.Dtos;

namespace GjirafaNewsAPI.Services;

public interface INotificationStore
{
    Task AddAsync(NotificationDto notification, CancellationToken ct = default);
    Task<IReadOnlyList<NotificationDto>> GetRecentAsync(int limit, CancellationToken ct = default);
}
