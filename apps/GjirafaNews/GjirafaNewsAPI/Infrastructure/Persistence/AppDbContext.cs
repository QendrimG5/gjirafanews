using GjirafaNewsAPI.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GjirafaNewsAPI.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Article>       Articles       => Set<Article>();
    public DbSet<Category>      Categories     => Set<Category>();
    public DbSet<Source>        Sources        => Set<Source>();
    public DbSet<Tag>           Tags           => Set<Tag>();
    public DbSet<Comment>       Comments       => Set<Comment>();
    public DbSet<FeaturedImage> FeaturedImages => Set<FeaturedImage>();
    public DbSet<User>          Users          => Set<User>();
    public DbSet<Notification>  Notifications  => Set<Notification>();
    public DbSet<ChatMessage>   ChatMessages   => Set<ChatMessage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Auto-discovers all IEntityTypeConfiguration<T> classes in this assembly
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

        // Global query filters — WHERE is_deleted = false on EVERY query
        modelBuilder.Entity<Article>().HasQueryFilter(a => !a.IsDeleted);
        modelBuilder.Entity<Comment>().HasQueryFilter(c => !c.IsDeleted);
        modelBuilder.Entity<User>().HasQueryFilter(u => !u.IsDeleted);
    }
}
