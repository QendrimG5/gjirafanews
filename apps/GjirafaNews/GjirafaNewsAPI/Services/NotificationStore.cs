using GjirafaNewsAPI.Domain.Entities;
using GjirafaNewsAPI.Infrastructure.Persistence;
using GjirafaNewsAPI.Models.Dtos;
using Microsoft.EntityFrameworkCore;

namespace GjirafaNewsAPI.Services;

public class NotificationStore(AppDbContext db) : INotificationStore
{
    public async Task AddAsync(NotificationDto dto, CancellationToken ct = default)
    {
        db.Notifications.Add(new Notification
        {
            Id = dto.Id,
            Type = dto.Type,
            Title = dto.Title,
            Message = dto.Message,
            CreatedAt = dto.CreatedAt,
        });
        await db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<NotificationDto>> GetRecentAsync(
        int limit, CancellationToken ct = default)
    {
        if (limit <= 0) return Array.Empty<NotificationDto>();

        return await db.Notifications
            .AsNoTracking()
            .OrderByDescending(n => n.CreatedAt)
            .Take(limit)
            .Select(n => new NotificationDto(n.Id, n.Type, n.Title, n.Message, n.CreatedAt))
            .ToListAsync(ct);
    }
}
