namespace GjirafaNewsAPI.Infrastructure.Storage;

public record PresignedPartUrl(int PartNumber, string Url);

public record MultipartInitResult(
    string Key,
    string UploadId,
    IReadOnlyList<PresignedPartUrl> PartUrls,
    DateTime ExpiresAt);

public record UploadedPart(int PartNumber, string ETag);

public record CompleteMultipartResult(string Key, string? Location, string? ETag);

public interface IStorageService
{
    Task<MultipartInitResult> InitiateMultipartAsync(
        string fileName,
        string contentType,
        int partCount,
        CancellationToken ct);

    Task<CompleteMultipartResult> CompleteMultipartAsync(
        string key,
        string uploadId,
        IEnumerable<UploadedPart> parts,
        CancellationToken ct);

    Task AbortMultipartAsync(string key, string uploadId, CancellationToken ct);
}
