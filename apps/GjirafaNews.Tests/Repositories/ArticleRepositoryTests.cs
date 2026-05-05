using GjirafaNews.Tests.Infrastructure;
using GjirafaNewsAPI.Domain.Entities;
using GjirafaNewsAPI.Repositories;
using Microsoft.EntityFrameworkCore;

namespace GjirafaNews.Tests.Repositories;

[Collection(PostgresCollection.Name)]
public class ArticleRepositoryTests(PostgresCollectionFixture fixture)
{
    [Fact]
    public async Task GetAllAsync_ReturnsArticlesOrderedByPublishedAtDesc()
    {
        await fixture.ResetAsync();
        await using var db = fixture.CreateContext();

        var category = new Category { Name = "Tech", Slug = "tech" };
        var source = new Source { Name = "Reuters", Url = "https://reuters.com" };
        db.Categories.Add(category);
        db.Sources.Add(source);
        await db.SaveChangesAsync();

        db.Articles.AddRange(
            new Article
            {
                Title = "Older",
                Slug = "older",
                PublishedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                CategoryId = category.Id,
                SourceId = source.Id,
            },
            new Article
            {
                Title = "Newer",
                Slug = "newer",
                PublishedAt = new DateTime(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc),
                CategoryId = category.Id,
                SourceId = source.Id,
            });
        await db.SaveChangesAsync();

        var sut = new ArticleRepository(db);

        var result = await sut.GetAllAsync();

        Assert.Equal(2, result.Count);
        Assert.Equal("Newer", result[0].Title);
        Assert.Equal("Older", result[1].Title);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsArticleWithRelations_AndExcludesDeletedComments()
    {
        await fixture.ResetAsync();
        await using var db = fixture.CreateContext();

        var category = new Category { Name = "Tech", Slug = "tech" };
        var source = new Source { Name = "Reuters", Url = "https://reuters.com" };
        var tag = new Tag { Name = "ai", Slug = "ai" };
        var user = new User { Id = Guid.NewGuid(), Name = "Alice", Email = "alice@example.com" };

        db.Categories.Add(category);
        db.Sources.Add(source);
        db.Tags.Add(tag);
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var article = new Article
        {
            Title = "Hello",
            Slug = "hello",
            PublishedAt = new DateTime(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc),
            CategoryId = category.Id,
            SourceId = source.Id,
            Tags = [tag],
            FeaturedImage = new FeaturedImage { Url = "https://img/1.jpg", AltText = "x", Width = 100, Height = 100 },
            Comments =
            [
                new Comment { Content = "live", UserId = user.Id },
                new Comment { Content = "gone", UserId = user.Id, IsDeleted = true },
            ],
        };

        db.Articles.Add(article);
        await db.SaveChangesAsync();
        var savedId = article.Id;
        db.ChangeTracker.Clear();

        var sut = new ArticleRepository(db);

        var result = await sut.GetByIdAsync(savedId);
        var raw = await db.Articles.AsNoTracking().FirstAsync(a => a.Id == savedId);
        var withCat = await db.Articles.AsNoTracking().Include(a => a.Category).FirstAsync(a => a.Id == savedId);
        Console.WriteLine($"DEBUG raw.CategoryId={raw.CategoryId} category.Id={category.Id} include.Category={(withCat.Category is null ? "null" : withCat.Category.Name)} result.Category={(result?.Category is null ? "null" : result.Category.Name)}");

        Assert.NotNull(result);
        Assert.Equal("Hello", result!.Title);
        Assert.Equal("Tech", result.Category.Name);
        Assert.Equal("Reuters", result.Source.Name);
        Assert.NotNull(result.FeaturedImage);
        Assert.Single(result.Tags);
        Assert.Single(result.Comments);
        Assert.Equal("live", result.Comments.First().Content);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsNull_WhenNotFound()
    {
        await fixture.ResetAsync();
        await using var db = fixture.CreateContext();

        var sut = new ArticleRepository(db);

        var result = await sut.GetByIdAsync(999_999);

        Assert.Null(result);
    }
}
