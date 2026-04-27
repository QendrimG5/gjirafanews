namespace GjirafaNewsAPI.Domain.Entities;

public class Category   // no BaseEntity — no audit fields
{
    public int Id { get; set; }
    public string Name  { get; set; } = "";
    public string Slug  { get; set; } = "";
    public string Color { get; set; } = "#000000";
    public virtual ICollection<Article> Articles { get; set; } = [];
}
