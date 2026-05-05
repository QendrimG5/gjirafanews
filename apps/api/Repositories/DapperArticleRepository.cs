using Dapper;
using GjirafaNewsAPI.Domain.Entities;
using Npgsql;

namespace GjirafaNewsAPI.Repositories;

public class DapperArticleRepository(NpgsqlDataSource dataSource)
{
    // Pattern 1: Typed query
    public async Task<IEnumerable<dynamic>> GetTopArticlesByReadTimeAsync(int topN = 10)
    {
        await using var conn = await dataSource.OpenConnectionAsync();
        return await conn.QueryAsync(
            """
            SELECT a.id, a.title, a.read_time, c.name AS category
            FROM   articles a
            JOIN   categories c ON c.id = a.category_id
            WHERE  a.is_deleted = false
            ORDER  BY a.read_time DESC
            LIMIT  @TopN
            """, new { TopN = topN });
    }

    // Pattern 2: Multi-mapping — one row → two objects
    public async Task<IEnumerable<Article>> GetArticlesWithCategoryAsync()
    {
        await using var conn = await dataSource.OpenConnectionAsync();
        return await conn.QueryAsync<Article, Category, Article>(
            """
            SELECT a.id, a.title, a.slug, a.read_time, a.published_at,
                   a.category_id, a.source_id, a.is_deleted,
                   c.id, c.name, c.slug, c.color
            FROM   articles a JOIN categories c ON c.id = a.category_id
            WHERE  a.is_deleted = false
            ORDER  BY a.published_at DESC LIMIT 50
            """,
            (article, category) => { article.Category = category; return article; },
            splitOn: "id");  // second "id" column → start reading Category
    }

    // Pattern 3: Source stats aggregation
    public async Task<IEnumerable<dynamic>> GetSourceStatsAsync()
    {
        await using var conn = await dataSource.OpenConnectionAsync();
        return await conn.QueryAsync(
            """
            SELECT  s.name            AS source_name,
                    COUNT(a.id)       AS total_articles,
                    AVG(a.read_time)  AS avg_read_time,
                    MAX(a.published_at) AS latest_article
            FROM    sources s
            LEFT JOIN articles a ON a.source_id = s.id AND a.is_deleted = false
            GROUP   BY s.id, s.name
            ORDER   BY total_articles DESC
            """);
    }

    // Pattern 4: Stored procedure call
    public async Task<IEnumerable<dynamic>> GetTrendingAsync(int days = 7, int limit = 10)
    {

        //SELECT* FROM get_trending_articles(5, 5);
        await using var conn = await dataSource.OpenConnectionAsync();
        return await conn.QueryAsync(
            "SELECT * FROM get_trending_articles(@Days, @Limit)",
            new { Days = days, Limit = limit });
    }

    // Pattern 5: Bulk insert with PostgreSQL unnest
    public async Task BulkInsertViewsAsync(IEnumerable<(int ArticleId, DateTime ViewedAt)> views)
    {
        var list = views.ToList();
        await using var conn = await dataSource.OpenConnectionAsync();
        await conn.ExecuteAsync(
            """
            INSERT INTO article_views (article_id, viewed_at)
            SELECT unnest(@ArticleIds), unnest(@ViewedAts)
            """,
            new
            {
                ArticleIds = list.Select(v => v.ArticleId).ToArray(),
                ViewedAts  = list.Select(v => v.ViewedAt).ToArray()
            });
        // 1000 rows = 1 round trip instead of 1000 individual INSERTs
    }
}
