using GjirafaNewsAPI.Models.Dtos;

namespace GjirafaNewsAPI.Caching;

public interface IRedisService
{
    Task<ArticleDetailDto?> GetArticleDetailAsync(int id, CancellationToken ct);
    Task SetArticleDetailAsync(int id, ArticleDetailDto dto, CancellationToken ct);

    Task<IReadOnlyList<ArticleListDto>?> GetArticleListPageAsync(int page, int pageSize, CancellationToken ct);
    Task SetArticleListAsync(IReadOnlyList<ArticleListDto> all, CancellationToken ct);
    Task PushNewArticleAsync(ArticleListDto dto, CancellationToken ct);

    Task InvalidateArticleAsync(int id, CancellationToken ct);
}
