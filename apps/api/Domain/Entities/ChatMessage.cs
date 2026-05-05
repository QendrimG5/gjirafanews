namespace GjirafaNewsAPI.Domain.Entities;

public class ChatMessage
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
