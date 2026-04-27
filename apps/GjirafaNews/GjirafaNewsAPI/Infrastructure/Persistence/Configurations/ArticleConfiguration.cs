using GjirafaNewsAPI.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GjirafaNewsAPI.Infrastructure.Persistence.Configurations;

public class ArticleConfiguration : IEntityTypeConfiguration<Article>
{
    public void Configure(EntityTypeBuilder<Article> builder)
    {
        builder.ToTable("articles");
        builder.Property(a => a.Id).UseIdentityAlwaysColumn();  // GENERATED ALWAYS AS IDENTITY
        builder.Property(a => a.Title).IsRequired().HasMaxLength(300);
        builder.Property(a => a.Slug).IsRequired().HasMaxLength(320);
        builder.Property(a => a.Summary).IsRequired().HasMaxLength(600);
        builder.Property(a => a.ImageUrl).HasMaxLength(500);
        builder.HasIndex(a => a.Slug).IsUnique();

        // Explicit timestamptz for all DateTime columns
        builder.Property(a => a.PublishedAt).HasColumnType("timestamptz");
        builder.Property(a => a.CreatedAt).HasColumnType("timestamptz");
        builder.Property(a => a.UpdatedAt).HasColumnType("timestamptz");
        builder.Property(a => a.DeletedAt).HasColumnType("timestamptz");

        // 1:M — Restrict: cannot delete a Category that has Articles
        builder.HasOne(a => a.Category).WithMany(c => c.Articles)
               .HasForeignKey(a => a.CategoryId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(a => a.Source).WithMany(s => s.Articles)
               .HasForeignKey(a => a.SourceId).OnDelete(DeleteBehavior.Restrict);

        // 1:1 — FK lives on FeaturedImage side; Cascade: image deleted with article
        builder.HasOne(a => a.FeaturedImage).WithOne(f => f.Article)
               .HasForeignKey<FeaturedImage>(f => f.ArticleId)
               .OnDelete(DeleteBehavior.Cascade);

        // 1:M — Cascade: comments deleted when article deleted
        builder.HasMany(a => a.Comments).WithOne(c => c.Article)
               .HasForeignKey(c => c.ArticleId).OnDelete(DeleteBehavior.Cascade);

        // M:M — EF Core auto-creates join tables
        builder.HasMany(a => a.Tags).WithMany(t => t.Articles)
               .UsingEntity(j => j.ToTable("article_tags"));
        builder.HasMany(a => a.SavedByUsers).WithMany(u => u.SavedArticles)
               .UsingEntity(j => j.ToTable("user_saved_articles"));

        // Indexes for frequent query patterns
        builder.HasIndex(a => a.CategoryId);
        builder.HasIndex(a => a.SourceId);
        builder.HasIndex(a => a.PublishedAt);
        builder.HasIndex(a => new { a.IsDeleted, a.PublishedAt });  // composite
    }
}
