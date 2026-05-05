using Bogus;
using GjirafaNewsAPI.Domain.Entities;
using GjirafaNewsAPI.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace GjirafaNewsAPI.Infrastructure.Data;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        // Idempotency check — IgnoreQueryFilters() needed to see soft-deleted records too
        if (await db.Articles.IgnoreQueryFilters().AnyAsync()) return;
        //used db command 
        //    SELECT EXISTS(
        //SELECT 1
        //FROM articles AS a)

        // Albanian names — realistic for GjirafaNews Kosovo context
        string[] firstNames = ["Agon", "Blerta", "Driton", "Fjolla", "Gentian", "Hana", "Ilir", "Jeta"];
        string[] lastNames = ["Krasniqi", "Hoxha", "Berisha", "Gashi", "Morina", "Syla"];

        // 1. Categories — must save first to get IDs
        var categories = new List<Category>
        {
            new() { Name = "Politika",   Slug = "politika",   Color = "#cf222e" },
            new() { Name = "Sport",      Slug = "sport",      Color = "#1a7f37" },
            new() { Name = "Teknologji", Slug = "teknologji", Color = "#0969da" },
            new() { Name = "Ekonomi",    Slug = "ekonomi",    Color = "#e16f24" },
            new() { Name = "World",      Slug = "world",      Color = "#0550ae" },
        };
        db.Categories.AddRange(categories);

        // 2. Sources
        var sources = new List<Source>
        {
            new() { Name = "Gazeta Express", Url = "https://gazetaexpress.com" },
            new() { Name = "Koha Ditore",    Url = "https://koha.net" },
            new() { Name = "Telegrafi",      Url = "https://telegrafi.com" },
        };
        db.Sources.AddRange(sources);
        await db.SaveChangesAsync();  // categories and sources get IDs here

        // 3. Articles — use ReadTime, not ReadTimeMinutes
        var random = new Random(42);
        var tagNames = new[] { "Prishtinë", "Qeveria", "UEFA", "AI", "Startup", "Buxheti" };
        var tags = tagNames.Select(n => new Tag { Name = n, Slug = n.ToLower().Replace("ë", "e") }).ToList();
        db.Tags.AddRange(tags);
        await db.SaveChangesAsync();

        var articleFaker = new Faker<Article>()
            .RuleFor(a => a.Title, f => f.Lorem.Sentence(6, 4).TrimEnd('.'))
            .RuleFor(a => a.Slug, (f, a) => a.Title.ToLower().Replace(" ", "-")
                                                     .Substring(0, Math.Min(80, a.Title.Length))
                                                   + "-" + f.Random.Int(1000, 9999))
            .RuleFor(a => a.Summary, f => f.Lorem.Sentences(2))
            .RuleFor(a => a.Content, f => f.Lorem.Paragraphs(4))
            .RuleFor(a => a.ImageUrl, f => $"https://picsum.photos/seed/{f.Random.Int(1, 999)}/800/400")
            .RuleFor(a => a.ReadTime, f => f.Random.Int(2, 8))        // ReadTime — not ReadTimeMinutes
            .RuleFor(a => a.PublishedAt, f => f.Date.Between(DateTime.UtcNow.AddMonths(-6), DateTime.UtcNow).ToUniversalTime())
            .RuleFor(a => a.CategoryId, f => f.PickRandom(categories).Id)
            .RuleFor(a => a.SourceId, f => f.PickRandom(sources).Id);

        var articles = articleFaker.Generate(100);

        // M:M — assign random tags to each article
        foreach (var article in articles)
        {
            var articleTags = tags.OrderBy(_ => random.Next()).Take(random.Next(1, 4)).ToList();
            foreach (var tag in articleTags) article.Tags.Add(tag);
        }

        // 1:1 FeaturedImages for 80% of articles
        foreach (var article in articles.Take(80))
            article.FeaturedImage = new FeaturedImage
            {
                Url = article.ImageUrl,
                AltText = article.Title[..Math.Min(100, article.Title.Length)],
                Width = 800,
                Height = 400
            };

        db.Articles.AddRange(articles);
        await db.SaveChangesAsync();

        // Comments — use Content (not Body)
        var users = new Faker<User>()
            .RuleFor(u => u.Name, f => $"{f.PickRandom(firstNames)} {f.PickRandom(lastNames)}")
            .RuleFor(u => u.Email, (f, u) => f.Internet.Email(u.Name.Split(' ')[0].ToLower()))
            .RuleFor(u => u.Role, f => f.PickRandom("reader", "reader", "editor"))
            .Generate(50);
        db.Users.AddRange(users);
        await db.SaveChangesAsync();

        var comments = new Faker<Comment>()
            .RuleFor(c => c.Content, f => f.Lorem.Sentences(f.Random.Int(1, 3)))   // Content — not Body
            .RuleFor(c => c.ArticleId, f => f.PickRandom(articles).Id)
            .RuleFor(c => c.UserId, f => f.PickRandom(users).Id)
            .Generate(300);
        db.Comments.AddRange(comments);
        await db.SaveChangesAsync();

        Console.WriteLine($"[Seeder] Done: {categories.Count} cats, {articles.Count} articles, {comments.Count} comments.");
    }
}
