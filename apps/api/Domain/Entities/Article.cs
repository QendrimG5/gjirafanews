namespace GjirafaNewsAPI.Domain.Entities;

public class Article : BaseEntity
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;  // thumbnail URL
    public int ReadTime { get; set; }                       // minutes
    public DateTime PublishedAt { get; set; }               // non-nullable

    // Relationships
    public int CategoryId { get; set; }
    public virtual Category Category { get; set; } = null!;
    public int SourceId { get; set; }
    public virtual Source Source { get; set; } = null!;
    public virtual FeaturedImage? FeaturedImage { get; set; }
    public virtual ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public virtual ICollection<Tag> Tags { get; set; } = new List<Tag>();
    public virtual ICollection<User> SavedByUsers { get; set; } = new List<User>();
}
