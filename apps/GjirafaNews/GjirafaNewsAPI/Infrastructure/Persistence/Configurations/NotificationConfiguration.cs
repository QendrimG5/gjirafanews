using GjirafaNewsAPI.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GjirafaNewsAPI.Infrastructure.Persistence.Configurations;

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("notifications");
        builder.HasKey(n => n.Id);
        builder.Property(n => n.Id).ValueGeneratedNever();

        builder.Property(n => n.Type).IsRequired().HasMaxLength(64);
        builder.Property(n => n.Title).IsRequired().HasMaxLength(200);
        builder.Property(n => n.Message).IsRequired().HasMaxLength(2000);
        builder.Property(n => n.CreatedAt).HasColumnType("timestamptz");

        // /api/notifications orders newest-first; descending index avoids a sort.
        builder.HasIndex(n => n.CreatedAt).IsDescending();
    }
}
