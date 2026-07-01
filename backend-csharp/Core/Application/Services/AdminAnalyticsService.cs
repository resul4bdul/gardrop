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
    private readonly ICommissionService _commission;
    public AdminAnalyticsService(IAppDbContext db, ICommissionService commission) { _db = db; _commission = commission; }

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

        // Platforma gəliri: komissiya (məhsul başına brut × pay%) + çatdırılma haqqı.
        // GMV (ümumi geyim satışı) = ləğv-olunmayan sətir brutlarının cəmi.
        var itemGross = await _db.OrderItems.Where(oi => oi.Order!.Status != Cancelled)
            .GroupBy(oi => oi.ProductId).Select(g => new { Pid = g.Key, Gross = g.Sum(x => x.Price * x.Qty) }).ToListAsync(ct);
        var prodMeta = await _db.Products.AsNoTracking().Select(p => new { p.Id, p.StoreId, p.Category }).ToListAsync(ct);
        var prodMap = prodMeta.ToDictionary(p => p.Id, p => (p.StoreId, Cat: p.Category ?? ""));
        var coms = await _db.StoreCommissions.AsNoTracking().ToListAsync(ct);
        var byStore = coms.GroupBy(c => c.StoreId).ToDictionary(g => g.Key,
            g => (Cat: g.Where(c => c.Category != "").ToDictionary(c => c.Category, c => c.Percent),
                  Def: g.FirstOrDefault(c => c.Category == "")?.Percent ?? 0m));
        decimal Pct(int pid)
        {
            if (!prodMap.TryGetValue(pid, out var pm) || !byStore.TryGetValue(pm.StoreId, out var sc)) return 0m;
            return Math.Clamp(sc.Cat.TryGetValue(pm.Cat, out var p) ? p : sc.Def, 0m, 100m);
        }
        decimal clothingSales = itemGross.Sum(x => x.Gross);
        decimal commission = itemGross.Sum(x => x.Gross * Pct(x.Pid) / 100m);
        decimal deliveryRevenue = await _db.Orders.Where(o => o.Status != Cancelled).SumAsync(o => o.DeliveryFee, ct);
        decimal platformRevenue = commission + deliveryRevenue;

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
            TopProducts: topProducts,
            ClothingSales: Math.Round(clothingSales, 2),
            PlatformRevenue: Math.Round(platformRevenue, 2),
            Commission: Math.Round(commission, 2),
            DeliveryRevenue: Math.Round(deliveryRevenue, 2));
    }

    public async Task<AdminStoreDetail?> StoreDetailAsync(int storeId, CancellationToken ct = default)
    {
        var s = await _db.Stores.AsNoTracking().FirstOrDefaultAsync(x => x.Id == storeId, ct);
        if (s is null) return null;

        var idSet = (await _db.Products.AsNoTracking().Where(p => p.StoreId == storeId).Select(p => p.Id).ToListAsync(ct)).ToHashSet();
        var items = _db.OrderItems.AsNoTracking().Where(oi => idSet.Contains(oi.ProductId) && oi.Order!.Status != Cancelled);
        var agg = await items.GroupBy(oi => oi.ProductId)
            .Select(g => new { Pid = g.Key, Gross = g.Sum(x => x.Price * x.Qty), Units = g.Sum(x => x.Qty) }).ToListAsync(ct);
        int orderCount = await items.Select(oi => oi.OrderId).Distinct().CountAsync(ct);

        var factors = await _commission.NetFactorsAsync(storeId, ct);
        decimal F(int pid) => factors.GetValueOrDefault(pid, 1m);
        decimal gmv = agg.Sum(x => x.Gross);
        decimal net = agg.Sum(x => x.Gross * F(x.Pid));   // mağazanın net qazancı
        decimal commission = gmv - net;                    // platformanın bu mağazadan qazancı
        int units = agg.Sum(x => x.Units);

        var payouts = await _db.StorePayouts.AsNoTracking().Where(p => p.StoreId == storeId)
            .OrderByDescending(p => p.PeriodEnd).ThenByDescending(p => p.Id).ToListAsync(ct);
        decimal paid = payouts.Where(p => p.Status == PayoutStatus.Paid).Sum(p => p.Amount);

        var ownerEmail = s.OwnerUserId is null ? "" :
            (await _db.Users.AsNoTracking().Where(u => u.Id == s.OwnerUserId).Select(u => u.Email).FirstOrDefaultAsync(ct)) ?? "";

        return new AdminStoreDetail(
            s.Id, s.Name, s.City, ownerEmail, units, orderCount,
            Math.Round(gmv, 2), Math.Round(commission, 2), Math.Round(net, 2),
            Math.Round(paid, 2), Math.Round(net - paid, 2),
            payouts.Select(PayoutView.From).ToList());
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
