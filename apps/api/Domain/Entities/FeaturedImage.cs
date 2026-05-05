namespace GjirafaNewsAPI.Domain.Entities;

public class FeaturedImage : BaseEntity
{
    public int Id { get; set; }
    public string Url { get; set; } = "";
    public string AltText { get; set; } = "";
    public int Width { get; set; }
    public int Height { get; set; }

    // FK: ArticleId (unique — enforces 1:1)
    public int ArticleId { get; set; }
    public virtual Article Article { get; set; } = null!;
}
