using Gardrop.Core.Application.Services;
using Gardrop.Core.Domain.Enums;
using Gardrop.Core.Domain.Models;
using Gardrop.Infrastructure.Persistance.Data;

namespace Gardrop.Tests;

// Analitika DB-də aqreqasiya olunur (bax menfiler 4.1) — relyasion OrderItem üzərində.
public class AdminAnalyticsTests
{
    private static async Task SeedAsync(AppDbContext db)
    {
        db.Products.Add(new Product { Id = 1, Name = "Köynək", Store = "BakuWear", StoreId = 10, Category = "Kişi" });
        db.Products.Add(new Product { Id = 2, Name = "Paltar", Store = "FashionAZ", StoreId = 20, Category = "Qadın" });
        db.Orders.Add(new Order
        {
            Id = 1, UserId = 7, Status = OrderStatus.Delivered, Total = 250m, CreatedAt = DateTime.UtcNow,
            Items = new() {
                new OrderItem { ProductId = 1, Name = "Köynək", Store = "BakuWear", Price = 50m, Qty = 3 },
                new OrderItem { ProductId = 2, Name = "Paltar", Store = "FashionAZ", Price = 100m, Qty = 1 },
            },
        });
        db.Orders.Add(new Order
        {
            Id = 2, UserId = 8, Status = OrderStatus.Cancelled, Total = 999m, CreatedAt = DateTime.UtcNow,
            Items = new() { new OrderItem { ProductId = 1, Name = "Köynək", Store = "BakuWear", Price = 50m, Qty = 9 } },
        });
        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task Stats_top_products_aggregate_excluding_cancelled()
    {
        using var db = TestDb.New();
        await SeedAsync(db);
        var stats = await new AdminAnalyticsService(db).StatsAsync();

        // Ləğv olunmuş sifariş (9 ədəd Köynək) sayılmamalı → Köynək units = 3.
        var top = stats.TopProducts.Single(t => t.Id == 1);
        Assert.Equal(3, top.Units);
        Assert.Equal(150m, top.Revenue);
        Assert.Equal(250m, stats.Revenue);   // yalnız çatdırılmış sifariş
    }

    [Fact]
    public async Task Analytics_units_revenue_and_category_aggregate_in_db()
    {
        using var db = TestDb.New();
        await SeedAsync(db);
        var a = await new AdminAnalyticsService(db).AnalyticsAsync(14);

        Assert.Equal(4, a.TotalUnits);          // 3 + 1 (ləğv xaric)
        Assert.Equal(250m, a.TotalRevenue);     // 150 + 100
        Assert.Equal(1, a.OrderCount);
        Assert.Contains(a.ByCategory, c => c.Category == "Kişi" && c.Revenue == 150m);
        Assert.Contains(a.ByCategory, c => c.Category == "Qadın" && c.Revenue == 100m);
    }
}
