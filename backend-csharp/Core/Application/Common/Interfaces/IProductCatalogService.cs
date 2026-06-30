using Gardrop.Core.Application.Common.DTOs;

namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>Public məhsul kataloqu (axtarış/filtr/sıralama + detal) — bax menfiler D1/D2.</summary>
public interface IProductCatalogService
{
    Task<ProductListResponse> ListAsync(string? search, string? category, string? subcategory, string? sort,
        double? minPrice, double? maxPrice, string? discount, string? store,
        int? page = null, int? pageSize = null, CancellationToken ct = default);

    /// <summary>Məhsul detalı + əlaqəli məhsullar. Tapılmazsa null.</summary>
    Task<ProductDetailDto?> GetAsync(int id, CancellationToken ct = default);
}
