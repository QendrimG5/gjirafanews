using GjirafaNewsAPI.Domain.Entities;
using GjirafaNewsAPI.Infrastructure.Persistence;
using GjirafaNewsAPI.Models.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GjirafaNewsAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<CategoryWithCountDto>>> GetAll(CancellationToken ct)
    {
        var rows = await db.Categories
            .OrderBy(c => c.Name)
            .Select(c => new CategoryWithCountDto(
                c.Id,
                c.Name,
                c.Slug,
                c.Color,
                c.Articles.Count(a => !a.IsDeleted)))
            .ToListAsync(ct);
        return Ok(rows);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CategoryWithCountDto>> GetById(int id, CancellationToken ct)
    {
        var dto = await db.Categories
            .Where(c => c.Id == id)
            .Select(c => new CategoryWithCountDto(
                c.Id,
                c.Name,
                c.Slug,
                c.Color,
                c.Articles.Count(a => !a.IsDeleted)))
            .FirstOrDefaultAsync(ct);
        return dto is null ? NotFound() : Ok(dto);
    }

    [HttpPost]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<CategoryDto>> Create(
        [FromBody] CreateCategoryRequest request,
        CancellationToken ct)
    {
        if (await db.Categories.AnyAsync(c => c.Slug == request.Slug, ct))
            return Conflict(new { error = "A category with that slug already exists." });

        var entity = new Category { Name = request.Name, Slug = request.Slug, Color = request.Color };
        db.Categories.Add(entity);
        await db.SaveChangesAsync(ct);

        var dto = entity.ToDto();
        return CreatedAtAction(nameof(GetById), new { id = entity.Id }, dto);
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<ActionResult<CategoryDto>> Update(
        int id,
        [FromBody] UpdateCategoryRequest request,
        CancellationToken ct)
    {
        var entity = await db.Categories.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (entity is null) return NotFound();

        var slugTaken = await db.Categories.AnyAsync(c => c.Slug == request.Slug && c.Id != id, ct);
        if (slugTaken) return Conflict(new { error = "A category with that slug already exists." });

        entity.Name = request.Name;
        entity.Slug = request.Slug;
        entity.Color = request.Color;
        await db.SaveChangesAsync(ct);

        return Ok(entity.ToDto());
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var entity = await db.Categories.FirstOrDefaultAsync(c => c.Id == id, ct);
        if (entity is null) return NotFound();

        var inUse = await db.Articles.AnyAsync(a => a.CategoryId == id, ct);
        if (inUse) return Conflict(new { error = "Category is referenced by existing articles." });

        db.Categories.Remove(entity);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }
}
