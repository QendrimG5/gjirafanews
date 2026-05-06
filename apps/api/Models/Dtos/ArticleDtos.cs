namespace GjirafaNewsAPI.Models.Dtos;

public record CategoryDto(int Id, string Name, string Slug, string Color);

public record SourceDto(int Id, string Name, string Url, string? LogoUrl);

public record TagDto(int Id, string Name, string Slug);

public record FeaturedImageDto(int Id, string Url, string AltText, int Width, int Height);

public record CommentAuthorDto(Guid Id, string Name);

public record CommentDto(int Id, string Content, DateTime CreatedAt, CommentAuthorDto Author);

public record ArticleListDto(
    int Id,
    string Title,
    string Slug,
    string Summary,
    string ImageUrl,
    int ReadTime,
    DateTime PublishedAt,
    CategoryDto Category,
    SourceDto Source,
    IReadOnlyList<TagDto> Tags);

public record ArticleDetailDto(
    int Id,
    string Title,
    string Slug,
    string Summary,
    string Content,
    string ImageUrl,
    int ReadTime,
    DateTime PublishedAt,
    CategoryDto Category,
    SourceDto Source,
    FeaturedImageDto? FeaturedImage,
    IReadOnlyList<TagDto> Tags,
    IReadOnlyList<CommentDto> Comments);

public record CreateArticleRequest(
    string Title,
    string Summary,
    string Content,
    string? ImageUrl,
    int CategoryId,
    int SourceId,
    int? ReadTime);

public record UpdateArticleRequest(
    string Title,
    string Summary,
    string Content,
    string? ImageUrl,
    int CategoryId,
    int SourceId,
    int? ReadTime);
