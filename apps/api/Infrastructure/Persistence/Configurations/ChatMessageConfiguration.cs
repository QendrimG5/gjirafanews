using GjirafaNewsAPI.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GjirafaNewsAPI.Infrastructure.Persistence.Configurations;

public class ChatMessageConfiguration : IEntityTypeConfiguration<ChatMessage>
{
    public void Configure(EntityTypeBuilder<ChatMessage> builder)
    {
        builder.ToTable("chat_messages");
        builder.HasKey(m => m.Id);
        builder.Property(m => m.Id).ValueGeneratedNever();

        builder.Property(m => m.Username).IsRequired().HasMaxLength(100);
        builder.Property(m => m.Text).IsRequired().HasMaxLength(500);
        builder.Property(m => m.CreatedAt).HasColumnType("timestamptz");

        // Index supports the seed query (GET /api/live-chat/messages) which
        // pulls the newest N rows.
        builder.HasIndex(m => m.CreatedAt).IsDescending();
    }
}
