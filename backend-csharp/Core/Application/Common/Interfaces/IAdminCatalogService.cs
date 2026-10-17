using Gardrop.Core.Application.Common;

namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>
/// Admin paneli — kataloq idarəsi (məhsul, mağaza, kupon, kateqoriya).
/// Bax menfiler 3.1: əvvəlki Adminservice god-class-ından SRP üzrə ayrıldı.
/// </summary>
public interface IAdminCatalogService
{
    // Products
    Task<List<ProductView>> ProductsAsync(string? search, string? status, int? page = null, int? pageSize = null, CancellationToken ct = default);
    Task<OpResult> SetApprovalAsync(int id, ApprovalDto dto, CancellationToken ct = default);
    Task<OpResult> CreateProductAsync(AdminProductDto dto, CancellationToken ct = default);
    Task<OpResult> UpdateProductAsync(int id, AdminProductDto dto, CancellationToken ct = default);
    Task<OpResult> BulkProductsAsync(BulkProductDto dto, CancellationToken ct = default);
    Task<OpResult> DeleteProductAsync(int id, CancellationToken ct = default);

    // Stores
    Task<List<AdminStoreView>> StoresAsync(CancellationToken ct = default);
    Task<OpResult> CreateStoreAsync(AdminStoreDto dto, CancellationToken ct = default);
    Task<OpResult> UpdateStoreAsync(int id, AdminStoreDto dto, CancellationToken ct = default);
    Task<OpResult> DeleteStoreAsync(int id, CancellationToken ct = default);

    // Coupons
    Task<List<CouponView>> CouponsAsync(CancellationToken ct = default);
    Task<OpResult> CreateCouponAsync(AdminCouponDto dto, CancellationToken ct = default);
    Task<OpResult> UpdateCouponAsync(long id, AdminCouponDto dto, CancellationToken ct = default);
    Task<OpResult> DeleteCouponAsync(long id, CancellationToken ct = default);

    // Categories
    Task<List<CategoryView>> CategoriesAsync(CancellationToken ct = default);
    Task<OpResult> CreateCategoryAsync(AdminCategoryDto dto, CancellationToken ct = default);
    Task<OpResult> UpdateCategoryAsync(string name, AdminCategoryDto dto, CancellationToken ct = default);
    Task<OpResult> DeleteCategoryAsync(string name, CancellationToken ct = default);
}
