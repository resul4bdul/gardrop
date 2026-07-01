using Gardrop.Core.Application.Common;

namespace Gardrop.Core.Application.Common.Interfaces;

// Satıcı (mağaza) paneli — SRP üzrə resurs servislərinə bölündü (bax menfiler 3.1).
// Hamısı sahiblik (Store.OwnerUserId) yoxlayır; uğursuzdursa OpResult 403.

/// <summary>Satıcı paneli — mağaza profili, dashboard, analitika.</summary>
public interface IStoreProfileService
{
    Task<MyStoresResult> MyStoresAsync(long userId, CancellationToken ct = default);
    Task<OpResult> UpdateSelfAsync(long userId, int storeId, StoreSelfDto dto, CancellationToken ct = default);
    Task<OpResult> SettingsAsync(long userId, int storeId, CancellationToken ct = default);
    Task<OpResult> DashboardAsync(long userId, int storeId, CancellationToken ct = default);
    Task<OpResult> AnalyticsAsync(long userId, int storeId, int days, CancellationToken ct = default);
    Task<OpResult> FinanceAsync(long userId, int storeId, CancellationToken ct = default);
}

/// <summary>Satıcı paneli — məhsul idarəsi.</summary>
public interface IStoreOwnerProductService
{
    Task<OpResult> ProductsAsync(long userId, int storeId, string? search, CancellationToken ct = default);
    Task<OpResult> CreateProductAsync(long userId, int storeId, AdminProductDto dto, CancellationToken ct = default);
    Task<OpResult> UpdateProductAsync(long userId, int storeId, int productId, AdminProductDto dto, CancellationToken ct = default);
    Task<OpResult> DeleteProductAsync(long userId, int storeId, int productId, CancellationToken ct = default);
}

/// <summary>Satıcı paneli — sifariş idarəsi.</summary>
public interface IStoreOwnerOrderService
{
    Task<OpResult> OrdersAsync(long userId, int storeId, string? status, CancellationToken ct = default);
    Task<OpResult> UpdateOrderStatusAsync(long userId, int storeId, long orderId, AdminOrderStatusDto dto, CancellationToken ct = default);
    Task<OpResult> RequestCourierAsync(long userId, int storeId, long orderId, CancellationToken ct = default);
}

/// <summary>Satıcı paneli — rəy idarəsi.</summary>
public interface IStoreOwnerReviewService
{
    Task<OpResult> ReviewsAsync(long userId, int storeId, CancellationToken ct = default);
    Task<OpResult> ReplyReviewAsync(long userId, int storeId, long reviewId, ReviewReplyDto dto, CancellationToken ct = default);
}
