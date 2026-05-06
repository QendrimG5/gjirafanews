using GjirafaNewsAPI.Domain.Entities;
using GjirafaNewsAPI.Infrastructure.Persistence;
using GjirafaNewsAPI.Models.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GjirafaNewsAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SourcesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<SourceDto>>> GetAll(CancellationToken ct)
    {
        var rows = await db.Sources
            .OrderBy(s => s.Name)
            .Select(s => new SourceDto(s.Id, s.Name, s.Url, s.LogoUrl))
            .ToListAsync(ct);
        return Ok(rows);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<SourceDto>> GetById(int id, CancellationToken ct)
    {
        var entity = await db.Sources.FirstOrDefaultAsync(s => s.Id == id, ct);
        return entity is null ? NotFound() : Ok(entity.ToDto());
    }

    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<SourceDto>> Create(
        [FromBody] CreateSourceRequest request,
        CancellationToken ct)
    {
        if (await db.Sources.AnyAsync(s => s.Url == request.Url, ct))
            return Conflict(new { error = "A source with that URL already exists." });

        var entity = new Source { Name = request.Name, Url = request.Url, LogoUrl = request.LogoUrl };
        db.Sources.Add(entity);
        await db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, entity.ToDto());
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<SourceDto>> Update(
        int id,
        [FromBody] UpdateSourceRequest request,
        CancellationToken ct)
    {
        var entity = await db.Sources.FirstOrDefaultAsync(s => s.Id == id, ct);
        if (entity is null) return NotFound();

        var urlTaken = await db.Sources.AnyAsync(s => s.Url == request.Url && s.Id != id, ct);
        if (urlTaken) return Conflict(new { error = "A source with that URL already exists." });

        entity.Name = request.Name;
        entity.Url = request.Url;
        entity.LogoUrl = request.LogoUrl;
        await db.SaveChangesAsync(ct);

        return Ok(entity.ToDto());
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var entity = await db.Sources.FirstOrDefaultAsync(s => s.Id == id, ct);
        if (entity is null) return NotFound();

        var inUse = await db.Articles.AnyAsync(a => a.SourceId == id, ct);
        if (inUse) return Conflict(new { error = "Source is referenced by existing articles." });

        db.Sources.Remove(entity);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
}
