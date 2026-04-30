namespace GjirafaNewsAPI.Models.Dtos;

public record ChatMessageDto(
    Guid Id,
    string Username,
    string Text,
    DateTime CreatedAt,
    string? ClientId);

public record SendChatMessageRequest(string Username, string Text, string? ClientId);
