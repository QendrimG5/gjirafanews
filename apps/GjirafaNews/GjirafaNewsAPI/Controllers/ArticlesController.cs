using GjirafaNewsAPI.Models.Dtos;
using GjirafaNewsAPI.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace GjirafaNewsAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ArticlesController(
    IArticleRepository repo,
    DapperArticleRepository dapper) : ControllerBase
{
    // GET /api/articles?page=1 — verify EF Core + global query filter (no deleted)
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1)
    {
        var articles = await repo.GetAllAsync(page);
        return Ok(articles.Select(a => a.ToListDto()).ToList());
    }

    // GET /api/articles/5 — verify eager loading: Category, Source, Tags, Comments, User
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var article = await repo.GetByIdAsync(id);
        return article is null ? NotFound() : Ok(article.ToDetailDto());
    }

    // GET /api/articles/stats — verify GroupBy + aggregate (read_time not read_time_minutes)
    [HttpGet("stats")]
    public async Task<IActionResult> Stats() =>
        Ok(await repo.GetCategoryStatsAsync());

    // DELETE /api/articles/5 — verify soft delete
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        await repo.DeleteAsync(id);  // takes int id — interceptor handles the rest
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
