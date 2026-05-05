using GjirafaNewsAPI.Infrastructure.Storage;
using GjirafaNewsAPI.Models.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GjirafaNewsAPI.Controllers;

[ApiController]
[Route("api/uploads")]
[AllowAnonymous]
public class UploadsController(IStorageService storage) : ControllerBase
{
    // POST /api/uploads/multipart/init
    // Creates an S3 multipart upload and returns one presigned PUT URL per
    // part. Clients PUT each part directly to S3, then call /complete.
    [HttpPost("multipart/init")]
    public async Task<ActionResult<InitiateMultipartUploadResponse>> Initiate(
        [FromBody] InitiateMultipartUploadRequest request,
        CancellationToken ct)
    {
        var result = await storage.InitiateMultipartAsync(
            request.FileName, request.ContentType, request.PartCount, ct);

        return Ok(new InitiateMultipartUploadResponse(
            result.Key,
            result.UploadId,
            result.PartUrls.Select(p => new PresignedPartUrlDto(p.PartNumber, p.Url)).ToList(),
            result.ExpiresAt));
    }

    // POST /api/uploads/multipart/complete
    [HttpPost("multipart/complete")]
    public async Task<ActionResult<CompleteMultipartUploadResponse>> Complete(
        [FromBody] CompleteMultipartUploadRequest request,
        CancellationToken ct)
    {
        var parts = request.Parts.Select(p => new UploadedPart(p.PartNumber, p.ETag));
        var result = await storage.CompleteMultipartAsync(
            request.Key, request.UploadId, parts, ct);

        return Ok(new CompleteMultipartUploadResponse(result.Key, result.Location, result.ETag));
    }

    // POST /api/uploads/multipart/abort
    [HttpPost("multipart/abort")]
    public async Task<IActionResult> Abort(
        [FromBody] AbortMultipartUploadRequest request,
        CancellationToken ct)
    {
        await storage.AbortMultipartAsync(request.Key, request.UploadId, ct);
        return NoContent();
    }
}
