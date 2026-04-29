namespace GjirafaNewsAPI.Models.Dtos
{
    public record CurrentUserResponse(
        string UserId,
        string Email,
        string Name,
        IReadOnlyList<string> Roles);
}
