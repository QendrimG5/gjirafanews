using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Options;

namespace GjirafaNewsAPI.Infrastructure.Storage;

public class S3StorageService(
    IAmazonS3 s3,
    IOptions<S3Options> options,
    ILogger<S3StorageService> logger) : IStorageService
{
    private readonly S3Options _options = options.Value;

    public async Task<MultipartInitResult> InitiateMultipartAsync(
        string fileName,
        string contentType,
        int partCount,
        CancellationToken ct)
    {
        if (partCount < 1 || partCount > _options.MaxParts)
        {
            throw new ArgumentOutOfRangeException(
                nameof(partCount),
                $"partCount must be between 1 and {_options.MaxParts}.");
        }

        var key = BuildObjectKey(fileName);

        var initiate = await s3.InitiateMultipartUploadAsync(new InitiateMultipartUploadRequest
        {
            BucketName = _options.Bucket,
            Key = key,
            ContentType = contentType,
            CannedACL = _options.PublicRead ? S3CannedACL.PublicRead : null,
        }, ct);

        var expiresAt = DateTime.UtcNow.AddMinutes(_options.PresignedUrlExpiryMinutes);
        var partUrls = new List<PresignedPartUrl>(partCount);

        for (var partNumber = 1; partNumber <= partCount; partNumber++)
        {
            var url = await s3.GetPreSignedURLAsync(new GetPreSignedUrlRequest
            {
                BucketName = _options.Bucket,
                Key = key,
                Verb = HttpVerb.PUT,
                Expires = expiresAt,
                UploadId = initiate.UploadId,
                PartNumber = partNumber,
            });
            partUrls.Add(new PresignedPartUrl(partNumber, url));
        }

        logger.LogInformation(
            "Initiated multipart upload {UploadId} for {Key} ({PartCount} parts)",
            initiate.UploadId, key, partCount);

        return new MultipartInitResult(key, initiate.UploadId, partUrls, expiresAt);
    }

    public async Task<CompleteMultipartResult> CompleteMultipartAsync(
        string key,
        string uploadId,
        IEnumerable<UploadedPart> parts,
        CancellationToken ct)
    {
        // S3 requires parts in ascending PartNumber order; the client may have
        // uploaded out of order, so sort defensively.
        var partTags = parts
            .OrderBy(p => p.PartNumber)
            .Select(p => new PartETag(p.PartNumber, p.ETag))
            .ToList();

        if (partTags.Count == 0)
        {
            throw new ArgumentException("At least one part is required.", nameof(parts));
        }

        var resp = await s3.CompleteMultipartUploadAsync(new CompleteMultipartUploadRequest
        {
            BucketName = _options.Bucket,
            Key = key,
            UploadId = uploadId,
            PartETags = partTags,
        }, ct);

        logger.LogInformation(
            "Completed multipart upload {UploadId} for {Key}", uploadId, key);

        return new CompleteMultipartResult(resp.Key, resp.Location, resp.ETag);
    }

    public async Task AbortMultipartAsync(string key, string uploadId, CancellationToken ct)
    {
        await s3.AbortMultipartUploadAsync(new AbortMultipartUploadRequest
        {
            BucketName = _options.Bucket,
            Key = key,
            UploadId = uploadId,
        }, ct);

        logger.LogInformation(
            "Aborted multipart upload {UploadId} for {Key}", uploadId, key);
    }

    private static string BuildObjectKey(string fileName)
    {
        var safeName = Path.GetFileName(fileName);
        if (string.IsNullOrWhiteSpace(safeName))
        {
            safeName = "file";
        }
        var now = DateTime.UtcNow;
        return $"uploads/{now:yyyy/MM/dd}/{Guid.NewGuid():N}/{safeName}";
    }
}
