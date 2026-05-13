using System.Text.Json;
using GjirafaNewsAPI.Domain.Entities;
using GjirafaNewsAPI.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace GjirafaNewsAPI.Services;

public sealed class ArticleSeederService(AppDbContext db) : IArticleSeederService
{
    private const int BatchSize = 200;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    public async Task<ArticleSeedResult> SeedFromFileAsync(string filePath, int? max, CancellationToken ct)
    {
        SeedFile? seed;
        await using (var stream = File.OpenRead(filePath))
        {
            seed = await JsonSerializer.DeserializeAsync<SeedFile>(stream, JsonOptions, ct);
        }

        if (seed?.Articles is null || seed.Articles.Count == 0)
            throw new InvalidDataException("Seed file is empty or invalid.");

        var articlesToSeed = max is { } cap ? seed.Articles.Take(cap).ToList() : seed.Articles;

        var (categoriesBySlug, sourcesByName, tagsBySlug) = await EnsureLookupsAsync(seed.Meta, ct);

        var existingSlugs = (await db.Articles
                .IgnoreQueryFilters()
                .Select(a => a.Slug)
                .ToListAsync(ct))
            .ToHashSet(StringComparer.Ordinal);

        int inserted = 0, skipped = 0;
        var batch = new List<Article>(BatchSize);

        foreach (var s in articlesToSeed)
        {
            if (existingSlugs.Contains(s.Slug))
            {
                skipped++;
                continue;
            }
            if (!categoriesBySlug.TryGetValue(s.CategorySlug, out var cat) ||
                !sourcesByName.TryGetValue(s.SourceName, out var src))
            {
                skipped++;
                continue;
            }

            var article = new Article
            {
                Title = s.Title,
                Slug = s.Slug,
                Summary = s.Summary.Length > 600 ? s.Summary[..600] : s.Summary,
                Content = s.Content,
                ImageUrl = s.ImageUrl,
                ReadTime = s.ReadTime,
                PublishedAt = s.PublishedAt.ToUniversalTime(),
                CategoryId = cat.Id,
                SourceId = src.Id,
            };
            foreach (var tagSlug in s.TagSlugs ?? new())
            {
                if (tagsBySlug.TryGetValue(tagSlug, out var tag))
                    article.Tags.Add(tag);
            }

            batch.Add(article);
            existingSlugs.Add(s.Slug);
            inserted++;

            if (batch.Count >= BatchSize)
            {
                await FlushBatchAsync(batch, ct);
            }
        }
        if (batch.Count > 0)
        {
            await FlushBatchAsync(batch, ct);
        }

        return new ArticleSeedResult(inserted, skipped, articlesToSeed.Count);
    }

    private async Task FlushBatchAsync(List<Article> batch, CancellationToken ct)
    {
        db.Articles.AddRange(batch);
        await db.SaveChangesAsync(ct);
        // Keep the change tracker small across the loop
        foreach (var entry in db.ChangeTracker.Entries<Article>().ToList())
            entry.State = EntityState.Detached;
        batch.Clear();
    }

    private async Task<(
        Dictionary<string, Category> categoriesBySlug,
        Dictionary<string, Source> sourcesByName,
        Dictionary<string, Tag> tagsBySlug)>
    EnsureLookupsAsync(SeedMeta? meta, CancellationToken ct)
    {
        var categoriesBySlug = await db.Categories.ToDictionaryAsync(c => c.Slug, ct);
        foreach (var c in meta?.Categories ?? new())
        {
            if (categoriesBySlug.ContainsKey(c.Slug)) continue;
            var entity = new Category { Slug = c.Slug, Name = c.Name, Color = c.Color };
            db.Categories.Add(entity);
            categoriesBySlug[c.Slug] = entity;
        }

        var sourcesByName = await db.Sources.ToDictionaryAsync(s => s.Name, ct);
        foreach (var s in meta?.Sources ?? new())
        {
            if (sourcesByName.ContainsKey(s.Name)) continue;
            var entity = new Source { Name = s.Name, Url = s.Url };
            db.Sources.Add(entity);
            sourcesByName[s.Name] = entity;
        }

        var tagsBySlug = await db.Tags.ToDictionaryAsync(t => t.Slug, ct);
        foreach (var t in meta?.Tags ?? new())
        {
            if (tagsBySlug.ContainsKey(t.Slug)) continue;
            var entity = new Tag { Slug = t.Slug, Name = t.Name };
            db.Tags.Add(entity);
            tagsBySlug[t.Slug] = entity;
        }

        await db.SaveChangesAsync(ct);   // assign IDs to newly inserted lookup rows
        return (categoriesBySlug, sourcesByName, tagsBySlug);
    }

    private sealed record SeedFile(SeedMeta? Meta, List<SeedArticle>? Articles);

    private sealed record SeedMeta(
        List<SeedCategoryDef>? Categories,
        List<SeedSourceDef>? Sources,
        List<SeedTagDef>? Tags);

    private sealed record SeedCategoryDef(string Slug, string Name, string Color);
    private sealed record SeedSourceDef(string Name, string Url);
    private sealed record SeedTagDef(string Slug, string Name);

    private sealed record SeedArticle(
        string Title,
        string Slug,
        string Summary,
        string Content,
        string ImageUrl,
        int ReadTime,
        DateTime PublishedAt,
        string CategorySlug,
        string SourceName,
        List<string>? TagSlugs);
}
