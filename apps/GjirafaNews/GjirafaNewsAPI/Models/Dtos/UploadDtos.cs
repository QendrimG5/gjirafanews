namespace GjirafaNewsAPI.Models.Dtos;

public record InitiateMultipartUploadRequest(
    string FileName,
    string ContentType,
    int PartCount);

public record PresignedPartUrlDto(int PartNumber, string Url);

public record InitiateMultipartUploadResponse(
    string Key,
    string UploadId,
    IReadOnlyList<PresignedPartUrlDto> PartUrls,
    DateTime ExpiresAt);

public record UploadedPartDto(int PartNumber, string ETag);

public record CompleteMultipartUploadRequest(
    string Key,
    string UploadId,
    IReadOnlyList<UploadedPartDto> Parts);

public record CompleteMultipartUploadResponse(
    string Key,
    string? Location,
    string? ETag);

public record AbortMultipartUploadRequest(string Key, string UploadId);
