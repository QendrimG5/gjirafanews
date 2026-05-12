namespace GjirafaNewsAPI.Models.Dtos;

public record CategoryWithCountDto(int Id, string Name, string Slug, string Color, int ArticleCount);

public record CreateCategoryRequest(string Name, string Slug, string Color);

public record UpdateCategoryRequest(string Name, string Slug, string Color);
