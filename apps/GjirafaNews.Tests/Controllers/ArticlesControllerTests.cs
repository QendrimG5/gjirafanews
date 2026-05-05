using GjirafaNewsAPI.Caching;
using GjirafaNewsAPI.Controllers;
using GjirafaNewsAPI.Domain.Entities;
using GjirafaNewsAPI.Models.Dtos;
using GjirafaNewsAPI.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Moq;

namespace GjirafaNews.Tests.Controllers;

public class ArticlesControllerTests
{
    private readonly Mock<IArticleRepository> _repo = new(MockBehavior.Strict);
    private readonly Mock<IRedisService> _redis = new(MockBehavior.Strict);
    private readonly IOptions<CacheOptions> _cacheOptions = Options.Create(new CacheOptions());

    private ArticlesController CreateSut() =>
        new(_repo.Object, dapper: null!, _redis.Object, _cacheOptions)
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

    [Fact]
    public async Task GetById_ReturnsCachedDto_WhenCacheHit()
    {
        var dto = NewDetailDto(id: 1);
        _redis.Setup(r => r.GetArticleDetailAsync(1, It.IsAny<CancellationToken>()))
              .ReturnsAsync(dto);

        var sut = CreateSut();

        var result = await sut.GetById(1);

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Same(dto, ok.Value);
        Assert.Equal("HIT", sut.Response.Headers["X-Cache"].ToString());
        _repo.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetById_LoadsFromRepoAndPopulatesCache_OnMiss()
    {
        var article = NewArticle(id: 1, title: "Hello");
        _redis.Setup(r => r.GetArticleDetailAsync(1, It.IsAny<CancellationToken>()))
              .ReturnsAsync((ArticleDetailDto?)null);
        _redis.Setup(r => r.SetArticleDetailAsync(1, It.IsAny<ArticleDetailDto>(), It.IsAny<CancellationToken>()))
              .Returns(Task.CompletedTask);
        _repo.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(article);

        var sut = CreateSut();

        var result = await sut.GetById(1);

        var ok = Assert.IsType<OkObjectResult>(result);
        var dto = Assert.IsType<ArticleDetailDto>(ok.Value);
        Assert.Equal(1, dto.Id);
        Assert.Equal("Hello", dto.Title);
        Assert.Equal("MISS", sut.Response.Headers["X-Cache"].ToString());
        _redis.Verify(r => r.SetArticleDetailAsync(1, It.IsAny<ArticleDetailDto>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task GetById_ReturnsNotFound_WhenRepoReturnsNull()
    {
        _redis.Setup(r => r.GetArticleDetailAsync(99, It.IsAny<CancellationToken>()))
              .ReturnsAsync((ArticleDetailDto?)null);
        _repo.Setup(r => r.GetByIdAsync(99)).ReturnsAsync((Article?)null);

        var sut = CreateSut();

        var result = await sut.GetById(99);

        Assert.IsType<NotFoundResult>(result);
        _redis.Verify(r => r.SetArticleDetailAsync(It.IsAny<int>(), It.IsAny<ArticleDetailDto>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    private static Article NewArticle(int id, string title) => new()
    {
        Id = id,
        Title = title,
        Slug = title.ToLowerInvariant(),
        Summary = "",
        Content = "",
        ImageUrl = "",
        ReadTime = 1,
        PublishedAt = new DateTime(2026, 1, 1),
        Category = new Category { Id = 1, Name = "Tech", Slug = "tech" },
        Source = new Source { Id = 1, Name = "Reuters", Url = "https://reuters.com" },
        Tags = [],
        Comments = [],
    };

    private static ArticleDetailDto NewDetailDto(int id) => new(
        id,
        "T",
        "t",
        "s",
        "c",
        "i",
        1,
        new DateTime(2026, 1, 1),
        new CategoryDto(1, "Tech", "tech", "#000"),
        new SourceDto(1, "Reuters", "https://reuters.com", null),
        FeaturedImage: null,
        Tags: [],
        Comments: []);
}
