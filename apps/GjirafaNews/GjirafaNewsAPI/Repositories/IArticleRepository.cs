using GjirafaNewsAPI.Domain.Entities;

namespace GjirafaNewsAPI.Repositories;

public record ArticleStats(string Category, int ArticleCount, double AvgReadTime, DateTime? LatestPublishedAt);

public interface IArticleRepository
{
    Task<List<Article>> GetAllAsync(int page = 1, int pageSize = 20);
    Task<List<Article>> GetAllForCacheAsync(int max, CancellationToken ct);
    Task<Article?> GetByIdAsync(int id);
    Task<List<ArticleStats>> GetCategoryStatsAsync();
    Task<List<Article>> SearchAsync(string query);
    Task DeleteAsync(int id);
}
