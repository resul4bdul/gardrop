using Gardrop.Core.Application.Common;
using Gardrop.Core.Application.Common.DTOs;
using Gardrop.Core.Application.Common.Helpers;
using Gardrop.Core.Application.Common.Interfaces;
using Gardrop.Core.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Infrastructure.Services;

/// <summary>Public məhsul kataloqu — EF + pg_trgm implementasiyası (Scoped).</summary>
public class ProductCatalogService : IProductCatalogService
{
    private readonly IAppDbContext _db;
    public ProductCatalogService(IAppDbContext db) => _db = db;

    public async Task<ProductListResponse> ListAsync(string? search, string? category, string? subcategory, string? sort,
        double? minPrice, double? maxPrice, string? discount, string? store,
        int? page = null, int? pageSize = null, CancellationToken ct = default)
    {
        // Yalnız admin təsdiqindən keçmiş məhsullar saytda görünür.
        IQueryable<Product> q = _db.Products.AsNoTracking().Where(p => p.ApprovalStatus == ApprovalStatus.Approved);

        var trimmed = search?.Trim();
        var hasSearch = !string.IsNullOrWhiteSpace(trimmed);
        var nq = TextNormalizer.Normalize(trimmed);
        if (hasSearch)
        {
            // pg_trgm: ILIKE alt-sətir (diakritiksiz) + word_similarity fuzzy (yazı səhvlərini tolere edir)
            var like = $"%{nq}%";
            q = q.Where(p =>
                EF.Functions.ILike(p.SearchBlob, like) ||
                EF.Functions.TrigramsWordSimilarity(nq, p.SearchBlob) > 0.45);
        }
        if (!string.IsNullOrWhiteSpace(category)) q = q.Where(p => p.Category == category);
        if (!string.IsNullOrWhiteSpace(subcategory)) q = q.Where(p => p.Subcategory == subcategory);
        if (!string.IsNullOrWhiteSpace(store)) q = q.Where(p => p.Store == store);
        if (discount == "true") q = q.Where(p => p.Discount != null);
        if (minPrice.HasValue) q = q.Where(p => p.Price >= (decimal)minPrice.Value);
        if (maxPrice.HasValue) q = q.Where(p => p.Price <= (decimal)maxPrice.Value);

        q = sort switch
        {
            "price_asc" => q.OrderBy(p => p.Price),
            "price_desc" => q.OrderByDescending(p => p.Price),
            "rating" => q.OrderByDescending(p => p.Rating),
            _ => hasSearch
                ? q.OrderByDescending(p => EF.Functions.TrigramsWordSimilarity(nq, p.SearchBlob))
                : q.OrderByDescending(p => p.Id),
        };

        // Total tam nəticə sayıdır; Skip/Take yalnız page/pageSize verildikdə tətbiq olunur (bax menfiler 4.3).
        var total = await q.CountAsync(ct);
        var products = await q.Page(page, pageSize).ToListAsync(ct);
        return new ProductListResponse(total, products.ToViews());
    }

    public async Task<ProductDetailDto?> GetAsync(int id, CancellationToken ct = default)
    {
        var list = await _db.Products.AsNoTracking().Where(p => p.ApprovalStatus == ApprovalStatus.Approved).ToListAsync(ct);
        var product = list.FirstOrDefault(p => p.Id == id);
        if (product is null) return null;

        // Baxış sayğacını artır (atomik, tək sorğu — entity yükləmədən).
        await _db.Products.Where(p => p.Id == id)
            .ExecuteUpdateAsync(s => s.SetProperty(p => p.Views, p => p.Views + 1), ct);

        var related = list.Where(p => p.Id != product.Id && p.Category == product.Category).Take(4).ToList();
        var storeLogo = await _db.Stores.AsNoTracking()
            .Where(s => s.Id == product.StoreId).Select(s => s.Logo).FirstOrDefaultAsync(ct) ?? "";

        return ProductDetailDto.From(product, storeLogo, related.ToViews());
    }
}
