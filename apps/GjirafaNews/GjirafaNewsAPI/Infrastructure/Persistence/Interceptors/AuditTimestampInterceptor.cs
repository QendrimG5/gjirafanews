using GjirafaNewsAPI.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace GjirafaNewsAPI.Infrastructure.Persistence.Interceptors;

public class AuditTimestampInterceptor : SaveChangesInterceptor
{
    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData, InterceptionResult<int> result)
    {
        ApplyTimestamps(eventData.Context);
        return base.SavingChanges(eventData, result);  // MUST call base — or nothing saves
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData, InterceptionResult<int> result, CancellationToken ct = default)
    {
        ApplyTimestamps(eventData.Context);
        return base.SavingChangesAsync(eventData, result, ct);
    }

    private static void ApplyTimestamps(DbContext? context)
    {
        if (context is null) return;
        var now = DateTime.UtcNow;

        // Current approach — type-switch per entity (no BaseEntity required)
        foreach (var entry in context.ChangeTracker.Entries())
        {
            if (entry.State == EntityState.Added)
            {
                if (entry.Entity is Article a)  { a.CreatedAt = now; a.UpdatedAt = now; }
                if (entry.Entity is Comment c)  { c.CreatedAt = now; c.UpdatedAt = now; }
                if (entry.Entity is User u)     { u.CreatedAt = now; u.UpdatedAt = now; }
            }
            else if (entry.State == EntityState.Modified)
            {
                if (entry.Entity is Article a)  a.UpdatedAt = now;
                if (entry.Entity is Comment c)  c.UpdatedAt = now;
                if (entry.Entity is User u)     u.UpdatedAt = now;
            }
        }
        // With BaseEntity: replace the above with Entries<BaseEntity>() — one loop, no type checks
    }
}
