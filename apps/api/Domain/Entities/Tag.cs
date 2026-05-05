namespace GjirafaNewsAPI.Domain.Entities;

public class Tag
{
    public int Id { get; set; }
    public string Name { get; set; } = "";   // unique
    public string Slug { get; set; } = "";

    public virtual ICollection<Article> Articles { get; set; } = [];
}
