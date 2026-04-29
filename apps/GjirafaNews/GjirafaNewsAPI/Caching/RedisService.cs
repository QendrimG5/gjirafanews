using System.Text.Json;
using GjirafaNewsAPI.Models.Dtos;
using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace GjirafaNewsAPI.Caching;

public class RedisService : IRedisService
{
    private const string ArticleListKey = "articles:list";
    private const string ArticleDetailKeyPrefix = "articles:byid:";

    private readonly IDatabase _db;
    private readonly CacheOptions _opts;
    private readonly ILogger<RedisService> _logger;

    public RedisService(
        IConnectionMultiplexer mux,
        IOptions<CacheOptions> opts,
        ILogger<RedisService> logger)
    {
        _db = mux.GetDatabase();
        _opts = opts.Value;
        _logger = logger;
    }

    public async Task<ArticleDetailDto?> GetArticleDetailAsync(int id, CancellationToken ct)
    {
        try
        {
            var value = await _db.StringGetAsync(DetailKey(id));
            if (value.IsNullOrEmpty) return null;
            return JsonSerializer.Deserialize<ArticleDetailDto>((string)value!);
        }
        catch (RedisException ex)
        {
            _logger.LogWarning(ex, "Redis GET failed for article detail {Id}", id);
            return null;
        }
    }

    public async Task SetArticleDetailAsync(int id, ArticleDetailDto dto, CancellationToken ct)
    {
        try
        {
            var json = JsonSerializer.Serialize(dto);
            await _db.StringSetAsync(
                DetailKey(id),
                json,
                TimeSpan.FromSeconds(_opts.ArticleDetailTtlSeconds));
        }
        catch (RedisException ex)
        {
            _logger.LogWarning(ex, "Redis SET failed for article detail {Id}", id);
        }
    }

    public async Task<IReadOnlyList<ArticleListDto>?> GetArticleListPageAsync(int page, int pageSize, CancellationToken ct)
    {
        try
        {
            if (!await _db.KeyExistsAsync(ArticleListKey)) return null;
            
            var start = (page - 1) * pageSize;
            var stop = start + pageSize - 1;
            var values = await _db.ListRangeAsync(ArticleListKey, start, stop);

            var result = new List<ArticleListDto>(values.Length);
            foreach (var value in values)
            {
                if (value.IsNullOrEmpty) continue;
                var dto = JsonSerializer.Deserialize<ArticleListDto>((string)value!);
                if (dto is not null) result.Add(dto);
            }
            return result;
        }
        catch (RedisException ex)
        {
            _logger.LogWarning(ex, "Redis LRANGE failed for article list page {Page}", page);
            return null;
        }
    }

    public async Task SetArticleListAsync(IReadOnlyList<ArticleListDto> all, CancellationToken ct)
    {
        if (all.Count == 0) return;

        try
        {
            await _db.KeyDeleteAsync(ArticleListKey);

            var values = new RedisValue[all.Count];
            for (var i = 0; i < all.Count; i++)
            {
                values[i] = JsonSerializer.Serialize(all[i]);
            }

            await _db.ListRightPushAsync(ArticleListKey, values);
            await _db.KeyExpireAsync(ArticleListKey, TimeSpan.FromSeconds(_opts.ArticleListTtlSeconds));
        }
        catch (RedisException ex)
        {
            _logger.LogWarning(ex, "Redis RPUSH failed for article list");
        }
    }

    public async Task PushNewArticleAsync(ArticleListDto dto, CancellationToken ct)
    {
        try
        {
            if (!await _db.KeyExistsAsync(ArticleListKey)) return;

            var json = JsonSerializer.Serialize(dto);
            await _db.ListLeftPushAsync(ArticleListKey, json);
            await _db.ListTrimAsync(ArticleListKey, 0, _opts.ArticleListMaxSize - 1);
        }
        catch (RedisException ex)
        {
            _logger.LogWarning(ex, "Redis LPUSH failed for new article {Id}", dto.Id);
        }
    }

    public async Task InvalidateArticleAsync(int id, CancellationToken ct)
    {
        try
        {
            await Task.WhenAll(
                _db.KeyDeleteAsync(DetailKey(id)),
                _db.KeyDeleteAsync(ArticleListKey));
        }
        catch (RedisException ex)
        {
            _logger.LogWarning(ex, "Redis DEL failed during invalidation for article {Id}", id);
        }
    }

    private static string DetailKey(int id) => ArticleDetailKeyPrefix + id;
}
