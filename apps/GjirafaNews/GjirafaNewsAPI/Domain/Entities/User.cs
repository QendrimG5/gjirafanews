namespace GjirafaNewsAPI.Domain.Entities;

public class User : BaseEntity
{
    public Guid Id { get; set; }
    public string Name  { get; set; } = "";
    public string Email { get; set; } = "";
    public string Role  { get; set; } = "reader";
    public virtual ICollection<Comment> Comments { get; set; } = [];
    public virtual ICollection<Article> SavedArticles { get; set; } = [];
}
