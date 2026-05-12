namespace GjirafaNewsAPI.Models.Dtos;

public record CreateSourceRequest(string Name, string Url, string? LogoUrl);

public record UpdateSourceRequest(string Name, string Url, string? LogoUrl);
