using Gardrop.Core.Application.Services;
using Gardrop.Core.Domain.Enums;
using Gardrop.Core.Domain.Models;
using Gardrop.Infrastructure.Persistance.Data;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Tests;

// Stok azalt/qaytar — idempotent, status keçidlərinə bağlı (bax menfiler 5.4).
public class OrderOpsStockTests
{
    private static OrderOps Build(AppDbContext db) =>
        new(db, new FakeNotificationService());

    private static async Task<Order> SeedAsync(AppDbContext db, int stock = 5, int qty = 2)
    {
        db.Products.Add(new Product
        {
            Id = 1, Name = "Test", StoreId = 10, Price = 10m,
            Stock = stock, Sizes = new() { "M" }, SizeStock = new() { ["M"] = stock }
        });
        var order = new Order
        {
            Id = 1, UserId = 7, Status = OrderStatus.Preparing,
            Items = new() { new OrderItem { ProductId = 1, Name = "Test", Qty = qty, Price = 10m, SelectedSize = "M" } }
        };
        db.Orders.Add(order);
        await db.SaveChangesAsync();
        return order;
    }

    [Fact]
    public async Task Shipping_deducts_stock_once()
    {
        using var db = TestDb.New();
        var order = await SeedAsync(db, stock: 5, qty: 2);
        var ops = Build(db);

        await ops.ApplyStatusAsync(order, OrderStatus.OnTheWay);
        await db.SaveChangesAsync();

        var p = await db.Products.SingleAsync();
        Assert.Equal(3, p.Stock);
        Assert.True(order.StockDeducted);

        // İkinci dəfə "Çatdırıldı" → təkrar azalma OLMAMALI (idempotent).
        await ops.ApplyStatusAsync(order, OrderStatus.Delivered);
        await db.SaveChangesAsync();
        Assert.Equal(3, (await db.Products.SingleAsync()).Stock);
    }

    [Fact]
    public async Task Cancel_after_shipping_restores_stock()
    {
        using var db = TestDb.New();
        var order = await SeedAsync(db, stock: 5, qty: 2);
        var ops = Build(db);

        await ops.ApplyStatusAsync(order, OrderStatus.OnTheWay);
        await db.SaveChangesAsync();
        Assert.Equal(3, (await db.Products.SingleAsync()).Stock);

        await ops.ApplyStatusAsync(order, OrderStatus.Cancelled, "stok problemi", CancelledByParty.Store);
        await db.SaveChangesAsync();

        Assert.Equal(5, (await db.Products.SingleAsync()).Stock);
        Assert.False(order.StockDeducted);
    }

    [Fact]
    public async Task Cancel_before_shipping_does_not_change_stock()
    {
        using var db = TestDb.New();
        var order = await SeedAsync(db, stock: 5, qty: 2);
        var ops = Build(db);

        await ops.ApplyStatusAsync(order, OrderStatus.Cancelled, "fikrimi dəyişdim", CancelledByParty.Customer);
        await db.SaveChangesAsync();

        Assert.Equal(5, (await db.Products.SingleAsync()).Stock);
    }
}
