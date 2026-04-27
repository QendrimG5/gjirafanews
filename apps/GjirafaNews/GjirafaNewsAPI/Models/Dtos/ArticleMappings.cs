using GjirafaNewsAPI.Domain.Entities;

namespace GjirafaNewsAPI.Models.Dtos;

public static class ArticleMappings
{
    public static CategoryDto ToDto(this Category c) => new(c.Id, c.Name, c.Slug, c.Color);

    public static SourceDto ToDto(this Source s) => new(s.Id, s.Name, s.Url, s.LogoUrl);

    public static TagDto ToDto(this Tag t) => new(t.Id, t.Name, t.Slug);

    public static FeaturedImageDto ToDto(this FeaturedImage f) =>
        new(f.Id, f.Url, f.AltText, f.Width, f.Height);

    public static CommentDto ToDto(this Comment c) => new(
        c.Id,
        c.Content,
        c.CreatedAt,
        new CommentAuthorDto(c.User.Id, c.User.Name));

    public static ArticleListDto ToListDto(this Article a) => new(
        a.Id,
        a.Title,
        a.Slug,
        a.Summary,
        a.ImageUrl,
        a.ReadTime,
        a.PublishedAt,
        a.Category.ToDto(),
        a.Source.ToDto(),
        a.Tags.Select(t => t.ToDto()).ToList());

    public static ArticleDetailDto ToDetailDto(this Article a) => new(
        a.Id,
        a.Title,
        a.Slug,
        a.Summary,
        a.Content,
        a.ImageUrl,
        a.ReadTime,
        a.PublishedAt,
        a.Category.ToDto(),
        a.Source.ToDto(),
        a.FeaturedImage?.ToDto(),
        a.Tags.Select(t => t.ToDto()).ToList(),
        a.Comments.Select(c => c.ToDto()).ToList());
}
