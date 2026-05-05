using GjirafaNewsAPI.Infrastructure.Persistence;
using GjirafaNewsAPI.Models.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GjirafaNewsAPI.Controllers;

[ApiController]
[Route("api/live-chat")]
[AllowAnonymous]
public class ChatController(AppDbContext db) : ControllerBase
{
    // GET /api/live-chat/messages?limit=100 — chronological history seed for
    // the live chat client. Returns newest-first; the client reverses.
    [HttpGet("messages")]
    public async Task<ActionResult<IReadOnlyList<ChatMessageDto>>> Recent(
        [FromQuery] int limit = 100,
        CancellationToken ct = default)
    {
        var clamped = Math.Clamp(limit, 1, 500);
        var rows = await db.ChatMessages
            .AsNoTracking()
            .OrderByDescending(m => m.CreatedAt)
            .Take(clamped)
            .Select(m => new ChatMessageDto(m.Id, m.Username, m.Text, m.CreatedAt, null))
            .ToListAsync(ct);

        return Ok(rows);
    }
}
