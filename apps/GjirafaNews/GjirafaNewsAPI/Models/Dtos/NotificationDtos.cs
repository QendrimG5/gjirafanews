namespace GjirafaNewsAPI.Models.Dtos;

public record NotificationDto(
    Guid Id,
    string Type,
    string Title,
    string Message,
    DateTime CreatedAt);

public record BroadcastNotificationRequest(string Title, string Message, string? Type);
