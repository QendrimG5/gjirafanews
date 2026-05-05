namespace GjirafaNewsAPI.Domain.Entities;

public abstract class BaseEntity
{
    // Set by AuditTimestampInterceptor on INSERT
    public DateTime CreatedAt { get; set; }

    // Updated by AuditTimestampInterceptor on every SaveChanges
    public DateTime UpdatedAt { get; set; }

    // Set by SoftDeleteInterceptor when Remove() is called
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
}
