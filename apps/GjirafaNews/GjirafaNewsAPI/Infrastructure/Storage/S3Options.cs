namespace GjirafaNewsAPI.Infrastructure.Storage;

public class S3Options
{
    public string Bucket { get; set; } = "";
    public string Region { get; set; } = "us-east-1";

    // Optional override for S3-compatible endpoints (MinIO, LocalStack).
    // When null/empty the standard AWS endpoint for Region is used.
    public string? ServiceUrl { get; set; }

    // MinIO/LocalStack typically require path-style addressing.
    public bool ForcePathStyle { get; set; }

    public int PresignedUrlExpiryMinutes { get; set; } = 60;

    // S3 caps multipart uploads at 10,000 parts.
    public int MaxParts { get; set; } = 10_000;

    // When true, finalized objects are stored with public-read ACL so the
    // returned Location URL is directly fetchable. Bucket must allow ACLs
    // (S3 Object Ownership: ObjectWriter / BucketOwnerPreferred).
    public bool PublicRead { get; set; }
}
