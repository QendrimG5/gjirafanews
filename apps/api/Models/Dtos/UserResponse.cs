namespace GjirafaNewsAPI.Models.Dtos
{
    public record UserResponse(Guid Id, string Name, string Email, DateTime CreatedAt);
}
