using GjirafaNewsAPI.Controllers;
using GjirafaNewsAPI.Domain.Entities;
using GjirafaNewsAPI.Infrastructure.Persistence;
using GjirafaNewsAPI.Models.Dtos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GjirafaNews.Tests.Controllers;

public class CategoriesControllerTests
{
    private static AppDbContext NewDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"cats-{Guid.NewGuid()}")
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task GetAll_ReturnsCategoriesOrderedByName_WithArticleCount()
    {
        await using var db = NewDb();
        db.Categories.AddRange(
            new Category { Id = 1, Name = "Tech", Slug = "tech", Color = "#111111" },
            new Category { Id = 2, Name = "Botë", Slug = "world", Color = "#222222" });
        db.Articles.Add(new Article
        {
            Id = 10, Title = "T", Slug = "t", Summary = "", Content = "",
            ImageUrl = "", ReadTime = 1, PublishedAt = DateTime.UtcNow,
            CategoryId = 1, SourceId = 1
        });
        await db.SaveChangesAsync();

        var sut = new CategoriesController(db);
        var result = await sut.GetAll(CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var dtos = Assert.IsAssignableFrom<IEnumerable<CategoryWithCountDto>>(ok.Value).ToList();

        Assert.Equal(2, dtos.Count);
        Assert.Equal("Botë", dtos[0].Name);
        Assert.Equal(0, dtos[0].ArticleCount);
        Assert.Equal("Tech", dtos[1].Name);
        Assert.Equal(1, dtos[1].ArticleCount);
    }

    [Fact]
    public async Task GetById_ReturnsNotFound_WhenMissing()
    {
        await using var db = NewDb();
        var sut = new CategoriesController(db);

        var result = await sut.GetById(123, CancellationToken.None);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task Create_RejectsDuplicateSlug()
    {
        await using var db = NewDb();
        db.Categories.Add(new Category { Id = 1, Name = "Tech", Slug = "tech", Color = "#111111" });
        await db.SaveChangesAsync();

        var sut = new CategoriesController(db);
        var result = await sut.Create(new CreateCategoryRequest("Tech 2", "tech", "#222222"), CancellationToken.None);

        Assert.IsType<ConflictObjectResult>(result.Result);
    }

    [Fact]
    public async Task Create_PersistsAndReturnsCreated()
    {
        await using var db = NewDb();
        var sut = new CategoriesController(db);

        var result = await sut.Create(new CreateCategoryRequest("Tech", "tech", "#111111"), CancellationToken.None);

        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        var dto = Assert.IsType<CategoryDto>(created.Value);
        Assert.Equal("Tech", dto.Name);
        Assert.Single(db.Categories);
    }

    [Fact]
    public async Task Delete_RejectsWhenArticlesExist()
    {
        await using var db = NewDb();
        db.Categories.Add(new Category { Id = 1, Name = "Tech", Slug = "tech", Color = "#111111" });
        db.Articles.Add(new Article
        {
            Id = 10, Title = "T", Slug = "t", Summary = "", Content = "",
            ImageUrl = "", ReadTime = 1, PublishedAt = DateTime.UtcNow,
            CategoryId = 1, SourceId = 1
        });
        await db.SaveChangesAsync();

        var sut = new CategoriesController(db);
        var result = await sut.Delete(1, CancellationToken.None);

        Assert.IsType<ConflictObjectResult>(result);
        Assert.Single(db.Categories);
    }
}
