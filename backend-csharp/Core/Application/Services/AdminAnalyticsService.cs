using Gardrop.Core.Application.Common.Interfaces;
using Gardrop.Core.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Core.Application.Services;

/// <summary>
/// Admin paneli dashboard statistikası + analitika — EF (Scoped). Bax menfiler 3.1.
/// Aqreqasiya DB-də (GroupBy/Sum) edilir — bütün sifarişlər yaddaşa çəkilmir (bax menfiler 4.1).
/// </summary>
public class AdminAnalyticsService : IAdminAnalyticsService
{
    private readonly IAppDbContext _db;
    public AdminAnalyticsService(IAppDbContext db) { _db = db; }

    private static readonly string Cancelled = OrderStatus.Cancelled;

    public async Task<AdminStats> StatsAsync(CancellationToken ct = default)
    {
        var revenue = await _db.Orders.Where(o => o.Status != Cancelled).SumAsync(o => o.Total, ct);
        var byStatus = await _db.Orders.GroupBy(o => o.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() }).ToDictionaryAsync(x => x.Status, x => x.Count, ct);
        var recent = await _db.Orders.AsNoTracking().OrderByDescending(o => o.CreatedAt).Take(8)
            .Select(o => new AdminRecentOrder(o.Id, o.OrderNo, o.UserId, o.Total, o.Status, o.CreatedAt)).ToListAsync(ct);

        var lowStock = await _db.Products.AsNoTracking()
            .Where(p => p.Stock <= 10).OrderBy(p => p.Stock)
            .Select(p => new AdminLowStockItem(p.Id, p.Name, p.Store, p.Stock)).Take(50).ToListAsync(ct);

        var prodNames = await _db.Products.AsNoTracking().Select(p => new { p.Id, p.Name })
            .ToDictionaryAsync(p => p.Id, p => p.Name, ct);
        var recentReviews = (await _db.Reviews.AsNoTracking()
            .OrderByDescending(r => r.CreatedAt).Take(8).ToListAsync(ct))
            .Select(r => new AdminRecentReview(r.Id, r.ProductId, prodNames.GetValueOrDefault(r.ProductId, "—"), r.UserName, r.Rating, r.Comment, r.CreatedAt)).ToList();

        // Top məhsullar — sifariş sətirləri DB-də aqreqasiya olunur (bax menfiler 4.1).
        var topProducts = (await _db.OrderItems.Where(oi => oi.Order!.Status != Cancelled)
            .GroupBy(oi => new { oi.ProductId, oi.Name })
            .Select(g => new { g.Key.ProductId, g.Key.Name, Units = g.Sum(x => x.Qty), Revenue = g.Sum(x => x.Price * x.Qty) })
            .OrderByDescending(x => x.Units).Take(6).ToListAsync(ct))
            .Select(x => new AdminTopProduct(x.ProductId, x.Name, x.Units, Math.Round(x.Revenue, 2))).ToList();

        return new AdminStats(
            Counts: new AdminStatsCounts(
                Users: await _db.Users.CountAsync(ct),
                Admins: await _db.Users.CountAsync(u => u.IsAdmin, ct),
                Products: await _db.Products.CountAsync(ct),
                PendingProducts: await _db.Products.CountAsync(p => p.ApprovalStatus == ApprovalStatus.Pending, ct),
                Stores: await _db.Stores.CountAsync(ct),
                Categories: await _db.Categories.CountAsync(ct),
                Orders: await _db.Orders.CountAsync(ct),
                Reviews: await _db.Reviews.CountAsync(ct)),
            Revenue: revenue,
            OrdersByStatus: byStatus,
            RecentOrders: recent,
            LowStock: lowStock,
            RecentReviews: recentReviews,
            TopProducts: topProducts);
    }

    public async Task<AdminAnalytics> AnalyticsAsync(int days, CancellationToken ct = default)
    {
        days = Math.Clamp(days, 7, 90);
        var today = DateTime.UtcNow.Date;
        var fromDate = today.AddDays(-(days - 1));

        // Günlük gəlir/say — DB-də qruplaşdırılır (bax menfiler 4.1).
        var dayAgg = (await _db.Orders.Where(o => o.Status != Cancelled && o.CreatedAt >= fromDate)
            .GroupBy(o => o.CreatedAt.Date)
            .Select(g => new { Day = g.Key, Revenue = g.Sum(o => o.Total), Count = g.Count() }).ToListAsync(ct))
            .ToDictionary(x => x.Day, x => (x.Revenue, x.Count));

        var byDay = Enumerable.Range(0, days).Select(i => today.AddDays(-(days - 1 - i)))
            .Select(d => new AdminRevenuePoint(d.ToString("yyyy-MM-dd"),
                Math.Round(dayAgg.TryGetValue(d, out var v) ? v.Revenue : 0m, 2),
                dayAgg.TryGetValue(d, out var c) ? c.Count : 0)).ToList();

        var orderRevenue = await _db.Orders.Where(o => o.Status != Cancelled).SumAsync(o => o.Total, ct);
        var orderCount = await _db.Orders.CountAsync(o => o.Status != Cancelled, ct);

        // Məhsul-səviyyə aqreqasiya DB-də (sətirlər → məhsul başına); kateqoriya bucket-i yaddaşda
        // kiçik məhsul-aqreqatı üzərində (silinmiş məhsul → "Digər", əvvəlki davranış).
        var itemAgg = await _db.OrderItems.Where(oi => oi.Order!.Status != Cancelled)
            .GroupBy(oi => new { oi.ProductId, oi.Name })
            .Select(g => new { g.Key.ProductId, g.Key.Name, Units = g.Sum(x => x.Qty), Revenue = g.Sum(x => x.Price * x.Qty) })
            .ToListAsync(ct);
        var catById = await _db.Products.AsNoTracking().ToDictionaryAsync(p => p.Id, p => p.Category, ct);

        var totalUnits = itemAgg.Sum(x => x.Units);
        var totalRevenue = itemAgg.Sum(x => x.Revenue);

        var byCategory = itemAgg.GroupBy(x => catById.GetValueOrDefault(x.ProductId, "Digər"))
            .Select(g => new AdminCategoryRevenue(g.Key, Math.Round(g.Sum(x => x.Revenue), 2)))
            .OrderByDescending(c => c.Revenue).ToList();

        var topProducts = itemAgg.OrderByDescending(x => x.Units).Take(6)
            .Select(x => new AdminTopProduct(x.ProductId, x.Name, x.Units, Math.Round(x.Revenue, 2))).ToList();

        return new AdminAnalytics(
            TotalRevenue: Math.Round(totalRevenue, 2),
            TotalUnits: totalUnits,
            OrderCount: orderCount,
            AvgOrder: orderCount > 0 ? Math.Round(orderRevenue / orderCount, 2) : 0,
            RevenueByDay: byDay,
            TopProducts: topProducts,
            ByCategory: byCategory);
    }
}
