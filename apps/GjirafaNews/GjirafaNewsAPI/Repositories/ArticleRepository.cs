using GjirafaNewsAPI.Domain.Entities;
using GjirafaNewsAPI.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace GjirafaNewsAPI.Repositories;

public class ArticleRepository(AppDbContext db) : IArticleRepository
{
    public Task<List<Article>> GetAllAsync(int page = 1, int pageSize = 20) =>
        db.Articles
          //.Include(a => a.Category)
          //.Include(a => a.Source)
          //.Include(a => a.Tags)
          .OrderByDescending(a => a.PublishedAt)
          .Skip((page - 1) * pageSize)
          .Take(pageSize)
          .ToListAsync();
//without lazy loading 
//    SELECT a0.id, a0.category_id, a0.content, a0.created_at, a0.deleted_at, a0.image_url, a0.is_deleted, a0.published_at, a0.read_time, a0.slug, a0.source_id, a0.summary, a0.title, a0.updated_at, c.id, c.color, c.name, c.slug, s.id, s.logo_url, s.name, s.url, s0.articles_id, s0.tags_id, s0.id, s0.name, s0.slug
//FROM (
//    SELECT a.id, a.category_id, a.content, a.created_at, a.deleted_at, a.image_url, a.is_deleted, a.published_at, a.read_time, a.slug, a.source_id, a.summary, a.title, a.updated_at
//    FROM articles AS a
//    WHERE NOT (a.is_deleted)
//    ORDER BY a.published_at DESC
//    LIMIT @p1 OFFSET @p
//) AS a0
//INNER JOIN categories AS c ON a0.category_id = c.id
//INNER JOIN sources AS s ON a0.source_id = s.id
//LEFT JOIN(
//    SELECT a1.articles_id, a1.tags_id, t.id, t.name, t.slug
//    FROM article_tags AS a1
//    INNER JOIN tags AS t ON a1.tags_id = t.id
//) AS s0 ON a0.id = s0.articles_id
//ORDER BY a0.published_at DESC, a0.id, c.id, s.id, s0.articles_id, s0.tags_id

    public Task<List<Article>> GetAllForCacheAsync(int max, CancellationToken ct) =>
        db.Articles
          .OrderByDescending(a => a.PublishedAt)
          .Take(max)
          .ToListAsync(ct);

    public Task<Article?> GetByIdAsync(int id) =>
        db.Articles
          //.Include(a => a.Category)
          //.Include(a => a.Source)
          //.Include(a => a.Tags)
          //.Include(a => a.FeaturedImage)
          //.Include(a => a.Comments.Where(c => !c.IsDeleted))  // filtered Include
          //    .ThenInclude(c => c.User)                        // nested
          .FirstOrDefaultAsync(a => a.Id == id);


    // Workaround kept for reference — aggregates on FK, resolves names client-side.
    // Use this if the flat-projection version above ever stops translating.
    public async Task<List<ArticleStats>> GetCategoryStatsAsync()
    {
        // EF Core 10 cannot translate GroupBy(navigation.Property) with multiple
        // aggregates over the entity — it auto-joins into a TransparentIdentifier
        // and wraps each aggregate in .AsQueryable(), which breaks SQL translation.
        var stats = await db.Articles
            .GroupBy(a => a.CategoryId)
            .Select(g => new
            {
                CategoryId = g.Key,
                Count = g.Count(),
                AvgReadTime = g.Average(a => a.ReadTime),  // ReadTime — not ReadTimeMinutes
                Latest = g.Max(a => (DateTime?)a.PublishedAt)
            })
            .ToListAsync();

        var names = await db.Categories.ToDictionaryAsync(c => c.Id, c => c.Name);

        return stats
            .Select(s => new ArticleStats(names[s.CategoryId], s.Count, s.AvgReadTime, s.Latest))
            .OrderByDescending(s => s.ArticleCount)
            .ToList();
    }

    public Task<List<Article>> SearchAsync(string query) =>
        db.Articles
          .FromSqlRaw(
              """
              SELECT * FROM articles
              WHERE to_tsvector('simple', title || ' ' || summary)
                    @@ plainto_tsquery('simple', {0})
                AND is_deleted = false
              ORDER BY published_at DESC
              LIMIT 50
              """, query)
          .Include(a => a.Category).Include(a => a.Source)
          .ToListAsync();

    public async Task DeleteAsync(int id)
    {
        var article = await db.Articles.FirstOrDefaultAsync(a => a.Id == id);
        if (article is null) return;
        db.Articles.Remove(article);  // SoftDeleteInterceptor converts to UPDATE
        await db.SaveChangesAsync();
    }
}
