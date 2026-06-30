using Gardrop.Core.Application.Common.DTOs;
using Gardrop.Core.Application.Services;
using Gardrop.Core.Domain.Enums;
using Gardrop.Core.Domain.Models;
using Gardrop.Infrastructure.Persistance.Data;

namespace Gardrop.Tests;

/// <summary>
/// Satıcı paneli dashboard/analitika DB-də aqreqasiya olunur (bax menfiler 4.1) — yalnız mağazanın
/// OrderItem sətirləri üzərində, bütün sifarişlər yaddaşa çəkilmir. Çoxmağazalı sifarişdə yalnız
/// öz sətir-cəmi sayılır; ləğv olunmuş sifariş gəlirə daxil olmur.
/// </summary>
public class StoreProfileAnalyticsTests
{
    private const int StoreId = 10;
    private const long Owner = 7;

    private static async Task SeedAsync(AppDbContext db)
    {
        db.Stores.Add(new Store { Id = StoreId, Name = "BakuWear", OwnerUserId = Owner });
        db.Products.Add(new Product { Id = 1, Name = "Köynək", Store = "BakuWear", StoreId = StoreId, Stock = 5 });
        db.Products.Add(new Product { Id = 2, Name = "Paltar", Store = "FashionAZ", StoreId = 20 });   // başqa mağaza

        // Çoxmağazalı çatdırılmış sifariş: mənim 3×50 + başqa mağaza 1×100.
        db.Orders.Add(new Order
        {
            Id = 1, UserId = 8, Status = OrderStatus.Delivered, Total = 250m, CreatedAt = DateTime.UtcNow,
            Items = new() {
                new OrderItem { ProductId = 1, Name = "Köynək", Price = 50m, Qty = 3 },
                new OrderItem { ProductId = 2, Name = "Paltar", Price = 100m, Qty = 1 },
            },
        });
        // Ləğv olunmuş sifariş (mənim 9×50) — gəlirə daxil OLMAMALI.
        db.Orders.Add(new Order
        {
            Id = 2, UserId = 9, Status = OrderStatus.Cancelled, Total = 999m, CreatedAt = DateTime.UtcNow,
            Items = new() { new OrderItem { ProductId = 1, Name = "Köynək", Price = 50m, Qty = 9 } },
        });
        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task Dashboard_revenue_counts_only_my_items_excluding_cancelled()
    {
        using var db = TestDb.New();
        await SeedAsync(db);
        var r = await new StoreProfileService(db, new FakeRatingQueue(), new CommissionService(db)).DashboardAsync(Owner, StoreId);

        var d = Assert.IsType<StoreDashboard>(r.Data);
        Assert.Equal(150m, d.Revenue);       // 3×50, başqa mağaza 100 və ləğv 9×50 xaric
        Assert.Equal(2, d.Counts.Orders);    // hər iki sifarişdə mənim məhsulum var
    }

    [Fact]
    public async Task Analytics_aggregates_my_items_in_db()
    {
        using var db = TestDb.New();
        await SeedAsync(db);
        var r = await new StoreProfileService(db, new FakeRatingQueue(), new CommissionService(db)).AnalyticsAsync(Owner, StoreId, 14);

        var a = Assert.IsType<StoreAnalytics>(r.Data);
        Assert.Equal(150m, a.TotalRevenue);   // yalnız ləğv-olunmayan öz sətirləri
        Assert.Equal(3, a.TotalUnits);
        Assert.Equal(1, a.OrderCount);        // ləğv xaric → bir sifariş
        Assert.Equal(1, a.TopProducts.Single().Id);
    }
}
