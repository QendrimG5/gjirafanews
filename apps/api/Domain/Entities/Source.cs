namespace GjirafaNewsAPI.Domain.Entities;

public class Source
{
    public int Id { get; set; }
    public string Name    { get; set; } = "";
    public string Url     { get; set; } = "";
    public string? LogoUrl { get; set; }
    public virtual ICollection<Article> Articles { get; set; } = [];
}
