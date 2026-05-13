using GjirafaNewsAPI.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GjirafaNewsAPI.Infrastructure.Persistence.Configurations;

public class ArticleEmbeddingConfiguration : IEntityTypeConfiguration<ArticleEmbedding>
{
    // text-embedding-3-small natively produces 1536-dim vectors, but supports
    // Matryoshka-style truncation via the `dimensions` request parameter. We
    // request 1024 to halve storage / index size with minimal recall loss.
    //
    // MUST match OpenAI:Dimensions in appsettings — if you change one, change
    // both AND run a new migration (column type is fixed at create time).
    private const int EmbeddingDimensions = 1024;

    public void Configure(EntityTypeBuilder<ArticleEmbedding> builder)
    {
        builder.ToTable("article_embeddings");
        builder.Property(e => e.Id).UseIdentityAlwaysColumn();

        builder.Property(e => e.Model).IsRequired().HasMaxLength(64);
        builder.Property(e => e.ContentHash).IsRequired().HasMaxLength(64);  // SHA-256 hex

        // Fixed-dimension pgvector column. Inserts that don't match the
        // declared dimension are rejected at the DB layer.
        builder.Property(e => e.Embedding)
               .HasColumnType($"vector({EmbeddingDimensions})")
               .IsRequired();

        builder.Property(e => e.CreatedAt).HasColumnType("timestamptz");
        builder.Property(e => e.UpdatedAt).HasColumnType("timestamptz");
        builder.Property(e => e.DeletedAt).HasColumnType("timestamptz");

        // 1:1 with Article. Cascade ensures a hard-deleted article also drops
        // its embedding (soft-delete leaves the row in place, which is fine —
        // the article still exists, only filtered out at read time).
        builder.HasOne(e => e.Article)
               .WithOne(a => a.Embedding)
               .HasForeignKey<ArticleEmbedding>(e => e.ArticleId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(e => e.ArticleId).IsUnique();

        // ANN index. HNSW > IVFFlat for our scale (no training step, better
        // recall, slightly slower writes). Cosine distance (`<=>`) is the
        // standard choice for OpenAI embeddings — they're L2-normalized so
        // cosine ≡ inner product, but the cosine operator class is the
        // convention and lets us use raw `<=>` queries.
        //
        // NOTE: requires `CREATE EXTENSION vector` to have run on the target
        // database before the migration that creates this index is applied.
        builder.HasIndex(e => e.Embedding)
               .HasMethod("hnsw")
               .HasOperators("vector_cosine_ops");
    }
}
