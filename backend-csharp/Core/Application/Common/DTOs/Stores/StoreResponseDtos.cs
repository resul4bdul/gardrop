using System.Text.Json;
using Gardrop.Core.Domain.Models;

namespace Gardrop.Core.Application.Common.DTOs;

/// <summary>GET mağazalarım: { hasStore, stores }.</summary>
public record MyStoresResult(bool HasStore, List<StoreView> Stores);

// ── Dashboard ──
public record StoreDashboardStore(int Id, string Name, double Rating, int Reviews, string City, string Address, double? Lat, double? Lng, int Established);
public record StoreDashboardCounts(int Products, int Orders);
public record StoreLowStockItem(int Id, string Name, int Stock);
public record StoreKpis(decimal TodaySales, decimal MonthSales, decimal TotalSales, int TodayOrders,
    int ActiveProducts, int SoldUnits, int PendingOrders, decimal AvgOrder);
public record StoreRecentOrder(long Id, string OrderNo, string Customer, string Status, decimal Amount, DateTime CreatedAt);
public record StoreRecentReview(string UserName, int Rating, string ProductName, DateTime CreatedAt, string Comment);
public record StoreDashboard(
    StoreDashboardStore Store, StoreDashboardCounts Counts, decimal Revenue,
    Dictionary<string, int> OrdersByStatus, List<StoreLowStockItem> LowStock,
    StoreKpis Kpis, List<StoreRecentOrder> RecentOrders, List<StoreRecentReview> RecentReviews);

/// <summary>Sifariş sətri (mağaza görünüşü): { id, name, qty, price, selectedSize }.</summary>
public record StoreOrderItem(int Id, string Name, int Qty, decimal Price, string SelectedSize);

// ── Satıcı sifariş siyahısı sətri ──
public record StoreOrderView(
    long Id, string OrderNo, long UserId, string? UserName, string? UserEmail,
    string Status, DateTime CreatedAt, DateTime? ConfirmedAt, DateTime? ShippedAt,
    DateTime? DeliveredAt, DateTime? CancelledAt, string DeliveryType, string CancelReason,
    string CancelledBy, string PaymentMethod, JsonElement DeliveryAddress, List<StoreOrderItem> MyItems,
    decimal MySubtotal, bool MyPrepared, bool MultiStore, int StoreCount, int PreparedCount);

/// <summary>Sifariş ləğv nəticəsi: { id, status }.</summary>
public record StoreOrderCancelResult(long Id, string Status);

/// <summary>Sifariş "Hazırlandı" nəticəsi: { id, status, myPrepared, allReady, preparedCount, storeCount }.</summary>
public record StoreOrderPreparedResult(long Id, string Status, bool MyPrepared, bool AllReady, int PreparedCount, int StoreCount);

/// <summary>Mağaza rəyi (cavabla birgə).</summary>
public record StoreReviewView(
    long Id, int ProductId, string ProductName, string UserName, int Rating, string Comment,
    List<string> ImageUrls, DateTime CreatedAt, string StoreReply, DateTime? StoreReplyAt);

/// <summary>Rəyə cavab nəticəsi: { id, storeReply, storeReplyAt }.</summary>
public record StoreReplyResult(long Id, string StoreReply, DateTime? StoreReplyAt);

// ── Analitika ──
public record StoreRevenuePoint(string Day, decimal Revenue, int Units, int Orders);
public record StoreTopProduct(int Id, string Name, int Units, decimal Revenue, string? Image);
public record StoreAnalytics(
    decimal TotalRevenue, int TotalUnits, int OrderCount, decimal AvgOrder,
    List<StoreRevenuePoint> RevenueByDay, List<StoreRevenuePoint> RevenueByMonth,
    List<StoreTopProduct> TopProducts, List<StoreTopProduct> LeastProducts);

// ── Maliyyə / ödənişlər (FAZA 5) ──
// Qeyd: payout/settlement persistence modeli hələ yoxdur — balans = ümumi net (ödəniş edilməyib),
// gözləyən ödəniş = balans. Real ödəniş tarixçəsi settlement modeli gələndə əlavə olunacaq.
public record StoreFinancePoint(string Month, decimal Gross, decimal Commission, decimal Net);
public record StoreCommissionReportRow(string Category, decimal Percent, int Units, decimal Gross, decimal Commission, decimal Net);

/// <summary>Mağazaya ödəniş (settlement) sətri — admin idarəsi + satıcı tarixçəsi.</summary>
public record PayoutView(
    long Id, int StoreId, DateTime PeriodStart, DateTime PeriodEnd, decimal Amount,
    string Status, DateTime? PaidAt, string Method, string Reference, string Note, DateTime CreatedAt)
{
    public static PayoutView From(StorePayout p) => new(
        p.Id, p.StoreId, p.PeriodStart, p.PeriodEnd, p.Amount,
        p.Status, p.PaidAt, p.Method, p.Reference, p.Note, p.CreatedAt);
}

public record StoreFinance(
    decimal CurrentBalance, decimal MonthEarnings, decimal TotalEarnings, decimal PlatformCommission, decimal PendingPayout,
    decimal GrossTotal, decimal TotalPaid, List<StoreFinancePoint> Monthly, List<StoreCommissionReportRow> CommissionReport,
    List<PayoutView> Payouts);
