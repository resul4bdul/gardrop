using Gardrop.Core.Application.Common;
using Gardrop.Core.Application.Common.Helpers;
using Gardrop.Core.Application.Common.Interfaces;
using Gardrop.Core.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Core.Application.Services;

/// <summary>Satıcı paneli — mağaza profili, dashboard, analitika (Scoped). Bax menfiler 3.1.</summary>
public class StoreProfileService : StoreOwnerServiceBase, IStoreProfileService
{
    private readonly IRatingRecomputeQueue _rating;
    private readonly ICommissionService _commission;
    public StoreProfileService(IAppDbContext db, IRatingRecomputeQueue rating, ICommissionService commission) : base(db) { _rating = rating; _commission = commission; }

    public async Task<MyStoresResult> MyStoresAsync(long userId, CancellationToken ct = default)
    {
        var stores = await _db.Stores.AsNoTracking()
            .Where(s => s.OwnerUserId == userId).OrderBy(s => s.Id).ToListAsync(ct);
        return new MyStoresResult(stores.Count > 0, stores.ToViews());
    }

    public async Task<OpResult> UpdateSelfAsync(long userId, int storeId, StoreSelfDto dto, CancellationToken ct = default)
    {
        var s = await OwnedAsync(userId, storeId, ct);
        if (s is null) return NotOwned;

        // Bütün mətn sahələri sanitizasiyadan keçir (idarəetmə/görünməz simvollar + trim).
        if (dto.Name is not null && InputSanitizer.Clean(dto.Name).Length > 0) s.Name = InputSanitizer.Clean(dto.Name);
        if (dto.City is not null) s.City = InputSanitizer.Clean(dto.City);
        if (dto.Established.HasValue) s.Established = dto.Established.Value;
        if (dto.Address is not null) s.Address = InputSanitizer.Clean(dto.Address);
        if (dto.Logo is not null) s.Logo = InputSanitizer.Clean(dto.Logo);
        if (dto.Lat.HasValue) s.Lat = dto.Lat.Value;
        if (dto.Lng.HasValue) s.Lng = dto.Lng.Value;

        // FAZA 6 — public profil/sosial/əlaqə/çatdırılma
        if (dto.Banner is not null) s.Banner = InputSanitizer.Clean(dto.Banner);
        if (dto.Url is not null) s.Url = InputSanitizer.Clean(dto.Url);
        if (dto.About is not null) s.About = InputSanitizer.CleanMultiline(dto.About);
        if (dto.Instagram is not null) s.Instagram = InputSanitizer.Clean(dto.Instagram);
        if (dto.Facebook is not null) s.Facebook = InputSanitizer.Clean(dto.Facebook);
        if (dto.Tiktok is not null) s.Tiktok = InputSanitizer.Clean(dto.Tiktok);
        if (dto.Whatsapp is not null) s.Whatsapp = InputSanitizer.Clean(dto.Whatsapp);
        if (dto.Phone is not null) s.Phone = InputSanitizer.Clean(dto.Phone);
        if (dto.Email is not null) s.Email = InputSanitizer.Clean(dto.Email);
        if (dto.PrepDays.HasValue) s.PrepDays = dto.PrepDays.Value;
        if (dto.ReturnDays.HasValue) s.ReturnDays = dto.ReturnDays.Value;

        // FAZA 6 — həssas (bank/hüquqi/bildiriş)
        if (dto.BankName is not null) s.BankName = InputSanitizer.Clean(dto.BankName);
        if (dto.Iban is not null) s.Iban = InputSanitizer.Clean(dto.Iban);
        if (dto.Beneficiary is not null) s.Beneficiary = InputSanitizer.Clean(dto.Beneficiary);
        if (dto.Voen is not null) s.Voen = InputSanitizer.Clean(dto.Voen);
        if (dto.LegalName is not null) s.LegalName = InputSanitizer.Clean(dto.LegalName);
        if (dto.NotifyNewOrder.HasValue) s.NotifyNewOrder = dto.NotifyNewOrder.Value;
        if (dto.NotifyNewReview.HasValue) s.NotifyNewReview = dto.NotifyNewReview.Value;
        if (dto.NotifyEmail.HasValue) s.NotifyEmail = dto.NotifyEmail.Value;

        await _db.SaveChangesAsync(ct);
        _rating.Request();
        return OpResult.Ok(StoreView.From(s));
    }

    public async Task<OpResult> SettingsAsync(long userId, int storeId, CancellationToken ct = default)
    {
        var s = await OwnedAsync(userId, storeId, ct);
        if (s is null) return NotOwned;
        return OpResult.Ok(new StoreSettings(
            s.BankName, s.Iban, s.Beneficiary, s.Voen, s.LegalName,
            s.NotifyNewOrder, s.NotifyNewReview, s.NotifyEmail));
    }

    public async Task<OpResult> DashboardAsync(long userId, int storeId, CancellationToken ct = default)
    {
        var s = await OwnedAsync(userId, storeId, ct);
        if (s is null) return NotOwned;

        // BÜTÜN məhsullar (silinmişlər daxil) — silinən məhsulun keçmiş satışı/rəyi statistikadan düşməsin.
        // (bax menfiler 2.6: sifariş tarixçəsi qalır; aktiv məhsul sayı isə ayrıca, filtrli hesablanır.)
        var prodList = await _db.Products.AsNoTracking().IgnoreQueryFilters().Where(p => p.StoreId == storeId)
            .Select(p => new { p.Id, p.Name }).ToListAsync(ct);
        var nameById = prodList.ToDictionary(p => p.Id, p => p.Name);
        var idSet = nameById.Keys.ToHashSet();

        var factors = await _commission.NetFactorsAsync(storeId, ct);
        decimal F(int pid) => factors.GetValueOrDefault(pid, 1m);

        var today = DateTime.SpecifyKind(DateTime.UtcNow.Date, DateTimeKind.Utc);
        var monthStart = DateTime.SpecifyKind(new DateTime(today.Year, today.Month, 1), DateTimeKind.Utc);

        var nonCancelled = _db.OrderItems.AsNoTracking()
            .Where(oi => idSet.Contains(oi.ProductId) && oi.Order!.Status != OrderStatus.Cancelled);

        // Məhsul üzrə net gəlir (ümumi / bugün / ay) — şərti cəmlər (komissiya çıxılmış).
        var buckets = await nonCancelled.GroupBy(oi => oi.ProductId).Select(g => new
        {
            Pid = g.Key,
            Total = g.Sum(x => x.Price * x.Qty),
            Today = g.Where(x => x.Order!.CreatedAt >= today).Sum(x => x.Price * x.Qty),
            Month = g.Where(x => x.Order!.CreatedAt >= monthStart).Sum(x => x.Price * x.Qty),
            Units = g.Sum(x => x.Qty),
        }).ToListAsync(ct);
        decimal totalSales = buckets.Sum(x => x.Total * F(x.Pid));
        decimal todaySales = buckets.Sum(x => x.Today * F(x.Pid));
        decimal monthSales = buckets.Sum(x => x.Month * F(x.Pid));
        int soldUnits = buckets.Sum(x => x.Units);

        // Sifariş meta (status + tarix) — ləğv daxil (status sayğacı üçün).
        var orderMeta = await _db.OrderItems.AsNoTracking().Where(oi => idSet.Contains(oi.ProductId))
            .Select(oi => new { oi.OrderId, oi.Order!.Status, oi.Order!.CreatedAt }).Distinct().ToListAsync(ct);
        int myOrderCount = orderMeta.Count;
        int todayOrders = orderMeta.Count(x => x.CreatedAt >= today);
        int pendingOrders = orderMeta.Count(x => x.Status == OrderStatus.Preparing);
        var statusCounts = orderMeta.GroupBy(x => x.Status).ToDictionary(g => g.Key, g => g.Count());
        decimal avgOrder = myOrderCount > 0 ? Math.Round(totalSales / myOrderCount, 2) : 0m;
        // Aktiv məhsul sayı = yalnız silinməmiş (qlobal filtr tətbiq olunur) — canlı kataloqu əks etdirir.
        int activeProducts = await _db.Products.AsNoTracking().CountAsync(p => p.StoreId == storeId, ct);

        var lowStock = await _db.Products.AsNoTracking()
            .Where(p => p.StoreId == storeId && p.Stock < 5)
            .OrderBy(p => p.Stock)
            .Select(p => new StoreLowStockItem(p.Id, p.Name, p.Stock)).Take(30).ToListAsync(ct);

        // Son sifarişlər (5) — net məbləğlə.
        var recentIds = orderMeta.OrderByDescending(x => x.CreatedAt).Take(5).Select(x => x.OrderId).ToList();
        var recentOrdersRaw = await _db.Orders.AsNoTracking().Where(o => recentIds.Contains(o.Id))
            .Select(o => new { o.Id, o.OrderNo, o.Status, o.CreatedAt, UserName = o.User != null ? (o.User.FirstName + " " + o.User.LastName) : "" })
            .ToListAsync(ct);
        var recentNet = await nonCancelled.Where(oi => recentIds.Contains(oi.OrderId))
            .GroupBy(oi => new { oi.OrderId, oi.ProductId })
            .Select(g => new { g.Key.OrderId, g.Key.ProductId, Rev = g.Sum(x => x.Price * x.Qty) }).ToListAsync(ct);
        var netByOrder = recentNet.GroupBy(x => x.OrderId).ToDictionary(g => g.Key, g => g.Sum(x => x.Rev * F(x.ProductId)));
        var recentOrders = recentOrdersRaw.OrderByDescending(o => o.CreatedAt)
            .Select(o => new StoreRecentOrder(o.Id, o.OrderNo, o.UserName.Trim(), o.Status,
                Math.Round(netByOrder.GetValueOrDefault(o.Id, 0m), 2), o.CreatedAt)).ToList();

        // Son rəylər (5).
        var recentReviews = (await _db.Reviews.AsNoTracking().Where(r => idSet.Contains(r.ProductId))
            .OrderByDescending(r => r.CreatedAt).Take(5)
            .Select(r => new { r.ProductId, r.UserName, r.Rating, r.Comment, r.CreatedAt }).ToListAsync(ct))
            .Select(r => new StoreRecentReview(r.UserName, r.Rating, nameById.GetValueOrDefault(r.ProductId, "—"), r.CreatedAt, r.Comment)).ToList();

        var kpis = new StoreKpis(Math.Round(todaySales, 2), Math.Round(monthSales, 2), Math.Round(totalSales, 2),
            todayOrders, activeProducts, soldUnits, pendingOrders, avgOrder);

        return OpResult.Ok(new StoreDashboard(
            Store: new StoreDashboardStore(s.Id, s.Name, s.Rating, s.Reviews, s.City, s.Address, s.Lat, s.Lng, s.Established),
            Counts: new StoreDashboardCounts(activeProducts, myOrderCount),
            Revenue: Math.Round(totalSales, 2),
            OrdersByStatus: statusCounts, LowStock: lowStock,
            Kpis: kpis, RecentOrders: recentOrders, RecentReviews: recentReviews));
    }

    public async Task<OpResult> FinanceAsync(long userId, int storeId, CancellationToken ct = default)
    {
        var s = await OwnedAsync(userId, storeId, ct);
        if (s is null) return NotOwned;

        // Maliyyə hesabatı silinmiş məhsulun keçmiş satışını da əhatə etsin → filtrləri ötür (bax menfiler 2.6).
        var prods = await _db.Products.AsNoTracking().IgnoreQueryFilters().Where(p => p.StoreId == storeId)
            .Select(p => new { p.Id, p.Category }).ToListAsync(ct);
        var catById = prods.ToDictionary(p => p.Id, p => p.Category ?? "");
        var idSet = catById.Keys.ToHashSet();

        // Komissiya faizləri (kateqoriya → %, "" = default).
        var coms = await _db.StoreCommissions.AsNoTracking().Where(c => c.StoreId == storeId).ToListAsync(ct);
        var byCat = coms.Where(c => c.Category != "").ToDictionary(c => c.Category, c => c.Percent);
        var def = coms.FirstOrDefault(c => c.Category == "")?.Percent ?? 0m;
        decimal Pct(string cat) => Math.Clamp(byCat.TryGetValue(cat, out var p) ? p : def, 0m, 100m);

        // Ləğv-olunmayan sətirlər → gün×məhsul aqreqatı (DB-də, bax menfiler 4.1).
        var items = _db.OrderItems.AsNoTracking()
            .Where(oi => idSet.Contains(oi.ProductId) && oi.Order!.Status != OrderStatus.Cancelled);
        var dp = await items.GroupBy(oi => new { oi.ProductId, Day = oi.Order!.CreatedAt.Date })
            .Select(g => new { g.Key.ProductId, g.Key.Day, Gross = g.Sum(x => x.Price * x.Qty), Units = g.Sum(x => x.Qty) })
            .ToListAsync(ct);

        // Net = brut × (1 − komissiya%); komissiya = brut − net.
        var rows = dp.Select(r => { var cat = catById.GetValueOrDefault(r.ProductId, ""); var pct = Pct(cat);
            return new { r.Day, cat, pct, r.Gross, r.Units, Net = r.Gross * (1 - pct / 100m) }; }).ToList();

        var today = DateTime.UtcNow.Date;
        var monthStart = new DateTime(today.Year, today.Month, 1);
        decimal grossTotal = rows.Sum(x => x.Gross), netTotal = rows.Sum(x => x.Net);
        decimal grossMonth = rows.Where(x => x.Day >= monthStart).Sum(x => x.Gross);
        decimal netMonth = rows.Where(x => x.Day >= monthStart).Sum(x => x.Net);

        // Son 12 ay: brut / komissiya / net.
        var monthAgg = rows.GroupBy(x => new { x.Day.Year, x.Day.Month })
            .ToDictionary(g => (g.Key.Year, g.Key.Month), g => (Gross: g.Sum(x => x.Gross), Net: g.Sum(x => x.Net)));
        var monthly = Enumerable.Range(0, 12).Select(i => new DateTime(today.Year, today.Month, 1).AddMonths(-(11 - i)))
            .Select(m => { var v = monthAgg.TryGetValue((m.Year, m.Month), out var x) ? x : (Gross: 0m, Net: 0m);
                return new StoreFinancePoint(m.ToString("yyyy-MM"), Math.Round(v.Gross, 2), Math.Round(v.Gross - v.Net, 2), Math.Round(v.Net, 2)); }).ToList();

        // Kateqoriya üzrə komissiya hesabatı (brut azalan).
        var report = rows.GroupBy(x => new { x.cat, x.pct })
            .Select(g => { var gross = g.Sum(x => x.Gross); var net = g.Sum(x => x.Net);
                return new StoreCommissionReportRow(g.Key.cat == "" ? "(default)" : g.Key.cat, g.Key.pct,
                    g.Sum(x => x.Units), Math.Round(gross, 2), Math.Round(gross - net, 2), Math.Round(net, 2)); })
            .OrderByDescending(r => r.Gross).ToList();

        // Ödənişlər (settlement): balans = ümumi net − ödənilmiş cəm; gözləyən = balans.
        var payouts = await _db.StorePayouts.AsNoTracking().Where(p => p.StoreId == storeId)
            .OrderByDescending(p => p.PeriodEnd).ThenByDescending(p => p.Id).ToListAsync(ct);
        decimal totalPaid = payouts.Where(p => p.Status == PayoutStatus.Paid).Sum(p => p.Amount);
        decimal balance = netTotal - totalPaid;

        return OpResult.Ok(new StoreFinance(
            CurrentBalance: Math.Round(balance, 2),
            MonthEarnings: Math.Round(netMonth, 2),
            TotalEarnings: Math.Round(netTotal, 2),
            PlatformCommission: Math.Round(grossTotal - netTotal, 2),
            PendingPayout: Math.Round(balance, 2),
            GrossTotal: Math.Round(grossTotal, 2),
            TotalPaid: Math.Round(totalPaid, 2),
            Monthly: monthly, CommissionReport: report,
            Payouts: payouts.Select(PayoutView.From).ToList()));
    }

    public async Task<OpResult> AnalyticsAsync(long userId, int storeId, int days, CancellationToken ct = default)
    {
        var s = await OwnedAsync(userId, storeId, ct);
        if (s is null) return NotOwned;
        days = Math.Clamp(days, 1, 90);

        // Analitika silinmiş məhsulun keçmiş satışını da göstərsin (top/least, ad, şəkil) → filtrləri ötür.
        var myIds = (await _db.Products.AsNoTracking().IgnoreQueryFilters().Where(p => p.StoreId == storeId)
            .Select(p => new { p.Id, p.Name, p.ImageUrls }).ToListAsync(ct));
        var nameById = myIds.ToDictionary(p => p.Id, p => p.Name);
        var imageById = myIds.ToDictionary(p => p.Id, p => p.ImageUrls.FirstOrDefault());
        var idSet = nameById.Keys.ToHashSet();

        // Mağazanın ləğv-olunmayan sətirləri DB-də aqreqasiya (bax menfiler 4.1) — bütün sifarişlər
        // yaddaşa çəkilmir. Gün/məhsul üzrə qruplaşma SQL-də; gün-bucket-i kiçik aqreqat üzərində yığılır.
        var myItems = _db.OrderItems.AsNoTracking()
            .Where(oi => idSet.Contains(oi.ProductId) && oi.Order!.Status != OrderStatus.Cancelled);

        // NET pay: hər məhsulun komissiya faktoru tətbiq olunur (gün×məhsul aqreqatı).
        var factors = await _commission.NetFactorsAsync(storeId, ct);
        decimal F(int pid) => factors.GetValueOrDefault(pid, 1m);

        var dp = await myItems.GroupBy(oi => new { Day = oi.Order!.CreatedAt.Date, oi.ProductId })
            .Select(g => new { g.Key.Day, g.Key.ProductId, Revenue = g.Sum(x => x.Price * x.Qty), Units = g.Sum(x => x.Qty) })
            .ToListAsync(ct);

        var dayAgg = dp.GroupBy(x => x.Day).ToDictionary(g => g.Key,
            g => (Revenue: g.Sum(x => x.Revenue * F(x.ProductId)), Units: g.Sum(x => x.Units)));

        var prodAgg = dp.GroupBy(x => x.ProductId)
            .Select(g => new { ProductId = g.Key, Units = g.Sum(x => x.Units), Revenue = g.Sum(x => x.Revenue * F(x.ProductId)) })
            .ToList();

        int orderCount = await myItems.Select(oi => oi.OrderId).Distinct().CountAsync(ct);
        decimal totalRevenue = prodAgg.Sum(x => x.Revenue);
        int totalUnits = prodAgg.Sum(x => x.Units);

        // Gün üzrə sifariş sayı (distinct) — qrafikdə ikinci xətt.
        var dayOrders = (await myItems.Select(oi => new { Day = oi.Order!.CreatedAt.Date, oi.OrderId }).Distinct().ToListAsync(ct))
            .GroupBy(x => x.Day).ToDictionary(g => g.Key, g => g.Count());
        var monthOrders = (await myItems.Select(oi => new { oi.Order!.CreatedAt.Year, oi.Order!.CreatedAt.Month, oi.OrderId }).Distinct().ToListAsync(ct))
            .GroupBy(x => (x.Year, x.Month)).ToDictionary(g => g.Key, g => g.Count());

        var today = DateTime.UtcNow.Date;
        var byDay = Enumerable.Range(0, days).Select(i => today.AddDays(-(days - 1 - i)))
            .Select(d => { var v = dayAgg.TryGetValue(d, out var x) ? x : (Revenue: 0m, Units: 0);
                return new StoreRevenuePoint(d.ToString("yyyy-MM-dd"), Math.Round(v.Revenue, 2), v.Units, dayOrders.GetValueOrDefault(d, 0)); }).ToList();

        // Son 12 ay (aylıq aqreqat).
        var monthRev = dp.GroupBy(x => new { x.Day.Year, x.Day.Month })
            .ToDictionary(g => (g.Key.Year, g.Key.Month), g => (Rev: g.Sum(x => x.Revenue * F(x.ProductId)), Units: g.Sum(x => x.Units)));
        var byMonth = Enumerable.Range(0, 12).Select(i => new DateTime(today.Year, today.Month, 1).AddMonths(-(11 - i)))
            .Select(m => { var key = (m.Year, m.Month); var v = monthRev.TryGetValue(key, out var x) ? x : (Rev: 0m, Units: 0);
                return new StoreRevenuePoint(m.ToString("yyyy-MM"), Math.Round(v.Rev, 2), v.Units, monthOrders.GetValueOrDefault(key, 0)); }).ToList();

        return OpResult.Ok(new StoreAnalytics(
            TotalRevenue: Math.Round(totalRevenue, 2),
            TotalUnits: totalUnits,
            OrderCount: orderCount,
            AvgOrder: orderCount > 0 ? Math.Round(totalRevenue / orderCount, 2) : 0m,
            RevenueByDay: byDay,
            RevenueByMonth: byMonth,
            TopProducts: prodAgg.OrderByDescending(x => x.Units).Take(6)
                .Select(x => new StoreTopProduct(x.ProductId, nameById.GetValueOrDefault(x.ProductId, "—"), x.Units, Math.Round(x.Revenue, 2), imageById.GetValueOrDefault(x.ProductId))).ToList(),
            LeastProducts: prodAgg.OrderBy(x => x.Units).Take(6)
                .Select(x => new StoreTopProduct(x.ProductId, nameById.GetValueOrDefault(x.ProductId, "—"), x.Units, Math.Round(x.Revenue, 2), imageById.GetValueOrDefault(x.ProductId))).ToList()));
    }
}
