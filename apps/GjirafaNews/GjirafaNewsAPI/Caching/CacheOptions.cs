namespace GjirafaNewsAPI.Caching;

public class CacheOptions
{
    public int ArticleListTtlSeconds { get; set; } = 60;
    public int ArticleDetailTtlSeconds { get; set; } = 300;
    public int ArticleListMaxSize { get; set; } = 500;
}
