using GjirafaNewsAPI.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace GjirafaNewsAPI.Infrastructure.Persistence.Interceptors;

public class SoftDeleteInterceptor : SaveChangesInterceptor
{
    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData, InterceptionResult<int> result)
    {
        ConvertDeleteToSoftDelete(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData, InterceptionResult<int> result, CancellationToken ct = default)
    {
        ConvertDeleteToSoftDelete(eventData.Context);
        return base.SavingChangesAsync(eventData, result, ct);
    }

    private static void ConvertDeleteToSoftDelete(DbContext? context)
    {
        if (context is null) return;
        var now = DateTime.UtcNow;

        // .ToList() REQUIRED — changing State during iteration causes an exception
        var deleted = context.ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Deleted).ToList();

        foreach (var entry in deleted)
        {
            switch (entry.Entity)
            {
                case Article a: entry.State = EntityState.Modified; a.IsDeleted = true; a.DeletedAt = now; break;
                case Comment c: entry.State = EntityState.Modified; c.IsDeleted = true; c.DeletedAt = now; break;
                case User u:    entry.State = EntityState.Modified; u.IsDeleted = true; u.DeletedAt = now; break;
            }
        }
    }
}
