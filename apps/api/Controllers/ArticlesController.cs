using GjirafaNewsAPI.Caching;
using GjirafaNewsAPI.Models.Dtos;
using GjirafaNewsAPI.Repositories;
using GjirafaNewsAPI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace GjirafaNewsAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ArticlesController(
    IArticleRepository repo,
    DapperArticleRepository dapper,
    IRedisService redis,
    INotificationService notifications,
    IOptions<CacheOptions> cacheOptions) : ControllerBase
{
    private const string CacheHeader = "X-Cache";
    private const int PageSize = 20;

    // GET /api/articles?page=1
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, CancellationToken ct = default)
    {
        var cached = await redis.GetArticleListPageAsync(page, PageSize, ct);
        if (cached is not null)
        {
            Response.Headers[CacheHeader] = "HIT";
            return Ok(cached);
        }

        var max = cacheOptions.Value.ArticleListMaxSize;
        var articles = await repo.GetAllForCacheAsync(max, ct);
        var allDtos = articles.Select(a => a.ToListDto()).ToList();

        await redis.SetArticleListAsync(allDtos, ct);

        var pageDtos = allDtos
            .Skip((page - 1) * PageSize)
            .Take(PageSize)
            .ToList();

        Response.Headers[CacheHeader] = "MISS";
        return Ok(pageDtos);
    }

    // GET /api/articles/5
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken ct = default)
    {
        var cached = await redis.GetArticleDetailAsync(id, ct);
        if (cached is not null)
        {
            Response.Headers[CacheHeader] = "HIT";
            return Ok(cached);
        }

        var article = await repo.GetByIdAsync(id);
        if (article is null) return NotFound();

        var dto = article.ToDetailDto();
        await redis.SetArticleDetailAsync(id, dto, ct);

        Response.Headers[CacheHeader] = "MISS";
        return Ok(dto);
    }

    // GET /api/articles/stats — verify GroupBy + aggregate (read_time not read_time_minutes)
    [HttpGet("stats")]
    public async Task<IActionResult> Stats() =>
        Ok(await repo.GetCategoryStatsAsync());

    // DELETE /api/articles/5 — verify soft delete
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(
        int id,
        [FromServices] IDashboardService dashboard,
        CancellationToken ct = default)
    {
        await repo.DeleteAsync(id);
        await redis.InvalidateArticleAsync(id, ct);
        await notifications.NotifyAdminsAsync(
            title: "Article deleted",
            message: $"Article #{id} was deleted.",
            type: "article.deleted",
            ct);
        _ = dashboard.PushSnapshotAsync();
        return NoContent();
    }

    // ── Dapper endpoints ──────────────────────────────────────────────────

    // GET /api/articles/top?topN=10 — Dapper Pattern 1: typed query
    [HttpGet("top")]
    public async Task<IActionResult> Top([FromQuery] int topN = 10) =>
        Ok(await dapper.GetTopArticlesByReadTimeAsync(topN));

    // GET /api/articles/with-category — Dapper Pattern 2: multi-mapping
    [HttpGet("with-category")]
    public async Task<IActionResult> WithCategory() =>
        Ok(await dapper.GetArticlesWithCategoryAsync());

    // GET /api/articles/source-stats — Dapper Pattern 3: aggregation
    [HttpGet("source-stats")]
    public async Task<IActionResult> SourceStats() =>
        Ok(await dapper.GetSourceStatsAsync());

    // GET /api/articles/trending?days=7&limit=10 — Dapper Pattern 4: stored proc
    [HttpGet("trending")]
    public async Task<IActionResult> Trending([FromQuery] int days = 7, [FromQuery] int limit = 10) =>
        Ok(await dapper.GetTrendingAsync(days, limit));

    // POST /api/articles/{id}/views?count=1000 — Dapper Pattern 5: bulk insert via unnest
    [HttpPost("{id:int}/views")]
    public async Task<IActionResult> RecordViews(int id, [FromQuery] int count = 1)
    {
        var now = DateTime.UtcNow;
        var views = Enumerable.Range(0, count).Select(i => (ArticleId: id, ViewedAt: now.AddSeconds(-i)));
        await dapper.BulkInsertViewsAsync(views);
        return NoContent();
    }
}
