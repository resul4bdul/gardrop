using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Gardrop.Core.Application.Common.Interfaces;

namespace Gardrop.Presentation.Controllers;

/// <summary>
/// Sayt məzmunu (CMS). Oxuma publikdir (əsas sayt slider/kateqoriya şəkilləri/hüquqi mətnlər),
/// yazma yalnız admin. Məntiq ISiteContentService-dədir (bax menfiler D1/D2).
/// </summary>
[ApiController]
[Route("api")]
public class ContentController : ControllerBase
{
    private readonly ISiteContentService _content;
    public ContentController(ISiteContentService content) => _content = content;

    // GET /api/content — bütün bloklar (açar → JSON mətni)
    [HttpGet("content")]
    public async Task<IActionResult> All(CancellationToken ct) => Ok(await _content.AllAsync(ct));

    // GET /api/content/{key} — tək blok
    [HttpGet("content/{key}")]
    public async Task<IActionResult> Get(string key, CancellationToken ct) =>
        Ok(new { key, json = await _content.GetAsync(key, ct) });

    // PUT /api/admin/content/{key} — admin yazma (sərbəst JSON mətni)
    [Authorize(Policy = "Admin")]
    [HttpPut("admin/content/{key}")]
    public async Task<IActionResult> Set(string key, [FromBody] ContentBody body, CancellationToken ct)
    {
        await _content.SetAsync(key, body?.Json ?? "", ct);
        return Ok(new { ok = true });
    }
}

public record ContentBody(string? Json);
