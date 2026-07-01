using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Gardrop.Core.Application.Common.Interfaces;

namespace Gardrop.Presentation.Controllers;

// Nazik controller — kataloq məntiqi IProductCatalogService-dədir (Application qatı, bax menfiler D1/D2).
[ApiController]
[Route("api/products")]
[EnableRateLimiting("search")]   // kataloq/axtarış scraping qarşısı (IP üzrə 40/dəq)
public class ProductsController : ControllerBase
{
    private readonly IProductCatalogService _catalog;
    public ProductsController(IProductCatalogService catalog) => _catalog = catalog;

    // GET /api/products  (search / filter / sort)
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] string? search, [FromQuery] string? category, [FromQuery] string? subcategory,
        [FromQuery] string? sort, [FromQuery] double? minPrice, [FromQuery] double? maxPrice,
        [FromQuery] string? discount, [FromQuery] string? store,
        [FromQuery] int? page, [FromQuery] int? pageSize, CancellationToken ct) =>
        Ok(await _catalog.ListAsync(search, category, subcategory, sort, minPrice, maxPrice, discount, store, page, pageSize, ct));

    // GET /api/products/:id
    [HttpGet("{id:int}")]
    public async Task<IActionResult> One(int id, CancellationToken ct)
    {
        var product = await _catalog.GetAsync(id, ct);
        return product is null ? NotFound(new { error = "Məhsul tapılmadı" }) : Ok(product);
    }

    // GET /api/products/slug/{slug} — SEO məhsul səhifəsi (Next.js SSR)
    [HttpGet("slug/{slug}")]
    public async Task<IActionResult> BySlug(string slug, CancellationToken ct)
    {
        var product = await _catalog.GetBySlugAsync(slug, ct);
        return product is null ? NotFound(new { error = "Məhsul tapılmadı" }) : Ok(product);
    }
}
