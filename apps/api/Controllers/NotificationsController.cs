using GjirafaNewsAPI.Models.Dtos;
using GjirafaNewsAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GjirafaNewsAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController(
    INotificationService notifications,
    INotificationStore store) : ControllerBase
{
    // GET /api/notifications?limit=50 — the recent notifications log. Open to
    // anonymous callers so the public site can seed its list on page load.
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<NotificationDto>>> List(
        [FromQuery] int limit = 50,
        CancellationToken ct = default)
    {
        var clamped = Math.Clamp(limit, 1, 200);
        return Ok(await store.GetRecentAsync(clamped, ct));
    }

    [HttpPost("broadcast")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Broadcast(
        [FromBody] BroadcastNotificationRequest request,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new { error = "Title and message are required." });
        }

        var type = string.IsNullOrWhiteSpace(request.Type) ? "info" : request.Type!;
        await notifications.BroadcastAsync(request.Title, request.Message, type, ct);
        return NoContent();
    }

    // POST /api/notifications/test — fires a canned notification at every connected
    // client so the SignalR pipeline can be verified end-to-end without a payload.
    // Open to anonymous callers (overrides the controller-level [Authorize]) so
    // logged-out users can trigger broadcasts as well.
    [HttpPost("test")]
    [AllowAnonymous]
    public async Task<IActionResult> Test(CancellationToken ct)
    {
        var sender = User.Identity?.IsAuthenticated == true
            ? User.Identity.Name ?? "authenticated user"
            : "anonymous";
        await notifications.BroadcastAsync(
            title: "Test notification",
            message: $"Hello from {sender} at {DateTime.UtcNow:HH:mm:ss} UTC.",
            type: "test",
            ct);
        return NoContent();
    }
}
