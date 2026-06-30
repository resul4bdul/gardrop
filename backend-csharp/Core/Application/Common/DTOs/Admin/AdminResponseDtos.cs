using System.Text.Json;

namespace Gardrop.Core.Application.Common.DTOs;

/// <summary>Təsir olunan sətir sayı: { affected }.</summary>
public record AffectedResult(int Affected);

// ── Dashboard stats ──
public record AdminStatsCounts(
    int Users, int Admins, int Products, int PendingProducts,
    int Stores, int Categories, int Orders, int Reviews);
public record AdminRecentOrder(long Id, string OrderNo, long UserId, decimal Total, string Status, DateTime CreatedAt);
public record AdminLowStockItem(int Id, string Name, string Store, int Stock);
public record AdminRecentReview(long Id, int ProductId, string ProductName, string UserName, int Rating, string Comment, DateTime CreatedAt);
public record AdminTopProduct(int Id, string Name, int Units, decimal Revenue);
public record AdminStats(
    AdminStatsCounts Counts, decimal Revenue, Dictionary<string, int> OrdersByStatus,
    List<AdminRecentOrder> RecentOrders, List<AdminLowStockItem> LowStock,
    List<AdminRecentReview> RecentReviews, List<AdminTopProduct> TopProducts);

// ── Analitika ──
public record AdminRevenuePoint(string Day, decimal Revenue, int Orders);
public record AdminCategoryRevenue(string Category, decimal Revenue);
public record AdminAnalytics(
    decimal TotalRevenue, int TotalUnits, int OrderCount, decimal AvgOrder,
    List<AdminRevenuePoint> RevenueByDay, List<AdminTopProduct> TopProducts,
    List<AdminCategoryRevenue> ByCategory);

// ── İstifadəçilər ──
public record AdminUserView(
    long Id, string Ad, string Soyad, string Email, string Telefon, string? Cins, bool IsAdmin,
    DateTime CreatedAt, int CartCount, int FavCount, int OrderCount, int AddressCount);

/// <summary>İstifadəçi yeniləndi (qısa): { id, ad, soyad, email, telefon, cins, isAdmin }.</summary>
public record AdminUserBrief(long Id, string Ad, string Soyad, string Email, string Telefon, string? Cins, bool IsAdmin);

/// <summary>Məhsul təsdiqi nəticəsi: { id, approvalStatus, rejectReason }.</summary>
public record AdminApprovalResult(int Id, string ApprovalStatus, string RejectReason);

// ── Mağazalar ──
public record AdminStoreView(
    int Id, string Name, double Rating, int Reviews, int Products, string City, int Established,
    double? Lat, double? Lng, string Address, string Logo, long? OwnerUserId, string? OwnerEmail);

// ── Sifarişlər (admin görünüşü) ──
public record AdminOrderStore(int Id, string Name, double? Lat, double? Lng, string Address);
public record AdminOrderView(
    long Id, string OrderNo, long UserId, string? UserEmail, string? UserName, JsonElement Items,
    decimal Total, decimal DeliveryFee, string DeliveryType, decimal Discount, string? CouponCode,
    double? Km, double? CustomerLat, double? CustomerLng, List<AdminOrderStore> Stores,
    JsonElement DeliveryAddress, JsonElement Payment, string Status, DateTime CreatedAt,
    DateTime? ConfirmedAt, DateTime? ShippedAt, DateTime? DeliveredAt, DateTime? CancelledAt,
    string CancelReason, string CancelledBy);

/// <summary>Sifariş statusu yeniləndi: { id, status, stockDeducted }.</summary>
public record AdminOrderStatusResult(long Id, string Status, bool StockDeducted);
