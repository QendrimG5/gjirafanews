using GjirafaNewsAPI.Controllers;
using GjirafaNewsAPI.Domain.Entities;
using GjirafaNewsAPI.Infrastructure.Persistence;
using GjirafaNewsAPI.Models.Dtos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GjirafaNews.Tests.Controllers;

public class SourcesControllerTests
{
    private static AppDbContext NewDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase($"sources-{Guid.NewGuid()}")
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task GetAll_ReturnsSourcesOrderedByName()
    {
        await using var db = NewDb();
        db.Sources.AddRange(
            new Source { Id = 1, Name = "Reuters", Url = "https://reuters.com" },
            new Source { Id = 2, Name = "AP",      Url = "https://apnews.com" });
        await db.SaveChangesAsync();

        var sut = new SourcesController(db);
        var result = await sut.GetAll(CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var dtos = Assert.IsAssignableFrom<IEnumerable<SourceDto>>(ok.Value).ToList();

        Assert.Equal(2, dtos.Count);
        Assert.Equal("AP", dtos[0].Name);
        Assert.Equal("Reuters", dtos[1].Name);
    }

    [Fact]
    public async Task Create_RejectsDuplicateUrl()
    {
        await using var db = NewDb();
        db.Sources.Add(new Source { Id = 1, Name = "Reuters", Url = "https://reuters.com" });
        await db.SaveChangesAsync();

        var sut = new SourcesController(db);
        var result = await sut.Create(
            new CreateSourceRequest("Reuters Mirror", "https://reuters.com", null),
            CancellationToken.None);

        Assert.IsType<ConflictObjectResult>(result.Result);
    }

    [Fact]
    public async Task Update_PersistsChanges()
    {
        await using var db = NewDb();
        db.Sources.Add(new Source { Id = 1, Name = "Reuters", Url = "https://reuters.com" });
        await db.SaveChangesAsync();

        var sut = new SourcesController(db);
        var result = await sut.Update(
            1,
            new UpdateSourceRequest("Reuters EU", "https://reuters.eu", "https://example.com/logo.png"),
            CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var dto = Assert.IsType<SourceDto>(ok.Value);
        Assert.Equal("Reuters EU", dto.Name);
        Assert.Equal("https://reuters.eu", dto.Url);
    }

    [Fact]
    public async Task Delete_RejectsWhenArticlesExist()
    {
        await using var db = NewDb();
        db.Sources.Add(new Source { Id = 1, Name = "Reuters", Url = "https://reuters.com" });
        db.Articles.Add(new Article
        {
            Id = 10, Title = "T", Slug = "t", Summary = "", Content = "",
            ImageUrl = "", ReadTime = 1, PublishedAt = DateTime.UtcNow,
            CategoryId = 1, SourceId = 1
        });
        await db.SaveChangesAsync();

        var sut = new SourcesController(db);
        var result = await sut.Delete(1, CancellationToken.None);

        Assert.IsType<ConflictObjectResult>(result);
    }
}
