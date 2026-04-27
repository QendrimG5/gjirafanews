namespace GjirafaNewsAPI.Domain.Entities;

public class Comment : BaseEntity
{
    public int Id { get; set; }
    public string Content { get; set; } = "";
    public int ArticleId { get; set; }
    public virtual Article Article { get; set; } = null!;
    public Guid UserId { get; set; }
    public virtual User User { get; set; } = null!;
}
