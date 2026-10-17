using Microsoft.AspNetCore.Mvc;
using Gardrop.Core.Application.Common.Interfaces;

namespace Gardrop.Presentation.Controllers;

/// <summary>Public mağaza kataloqu. Satıcı paneli üçün <see cref="StoreController"/>. Nazik controller (D1/D2).</summary>
[ApiController]
[Route("api/stores")]
public class StoresController : ControllerBase
{
    private readonly IStoreCatalogService _stores;
    public StoresController(IStoreCatalogService stores) => _stores = stores;

    // GET /api/stores
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct) => Ok(await _stores.ListAsync(ct));

    // GET /api/stores/:id
    [HttpGet("{id:int}")]
    public async Task<IActionResult> One(int id, CancellationToken ct)
    {
        var store = await _stores.GetAsync(id, ct);
        return store is null ? NotFound(new { error = "Mağaza tapılmadı" }) : Ok(store);
    }

    // GET /api/stores/by-url/{slug} — SEO mağaza səhifəsi (Next.js SSR)
    [HttpGet("by-url/{slug}")]
    public async Task<IActionResult> ByUrl(string slug, CancellationToken ct)
    {
        var store = await _stores.GetByUrlAsync(slug, ct);
        return store is null ? NotFound(new { error = "Mağaza tapılmadı" }) : Ok(store);
    }
}
