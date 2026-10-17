using Gardrop.Core.Application.Common.DTOs;
using Gardrop.Core.Application.Services;
using Gardrop.Core.Domain.Enums;
using Gardrop.Core.Domain.Models;
using Gardrop.Infrastructure.Persistance.Data;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Tests;

// Sifariş yaratma/ləğv — ən riskli yol (cəm server tərəfdə, kupon, səbət) (bax menfiler 5.4).
public class OrderServiceTests
{
    private static OrderService Build(AppDbContext db, FakeRatingQueue? rating = null)
    {
        var notify = new FakeNotificationService();
        var orderOps = new OrderOps(db, notify);
        return new OrderService(db, rating ?? new FakeRatingQueue(), orderOps, new DeliveryEngine(), new CouponEngine(), new FakePaymentService(), notify, new FakeEmailSender());
    }

    private static async Task SeedProductAsync(AppDbContext db, int id = 1, decimal price = 100m, int stock = 5)
    {
        db.Stores.Add(new Store { Id = 10, Name = "Mağaza" });
        db.Products.Add(new Product
        {
            Id = id, Name = "Test", Store = "Mağaza", StoreId = 10,
            Price = price, Stock = stock, Sizes = new() { "M" }, SizeStock = new() { ["M"] = stock }
        });
        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task Empty_items_returns_400()
    {
        using var db = TestDb.New();
        var sut = Build(db);
        var r = await sut.CreateAsync(1, new OrderDto(new List<object>(), null, null, null, null, null, null, null));
        Assert.Equal(400, r.Status);
    }

    [Fact]
    public async Task Total_is_computed_server_side_ignoring_client_value()
    {
        using var db = TestDb.New();
        await SeedProductAsync(db, price: 100m, stock: 5);
        var sut = Build(db);

        // Müştəri Total=1₼ göndərir; server məhsul qiymətindən hesablamalıdır (100 × 2).
        var dto = new OrderDto(
            Items: new List<object> { new { id = 1, qty = 2, price = 1m } },
            Total: 1m, DeliveryAddress: null, Payment: null, DeliveryFee: null,
            CouponCode: null, StoreId: null, DeliveryType: "Standart");

        var r = await sut.CreateAsync(userId: 7, dto);

        Assert.Equal(201, r.Status);
        var order = await db.Orders.SingleAsync();
        Assert.True(order.Total >= 200m, $"Cəm ≥ 200 olmalı (məhsul cəmi), oldu {order.Total}");
    }

    [Fact]
    public async Task Order_items_persisted_relationally_with_server_snapshot()
    {
        using var db = TestDb.New();
        await SeedProductAsync(db, price: 100m, stock: 5);
        var sut = Build(db);

        // Müştəri saxta ad/qiymət göndərir; server snapshot məhsuldan götürməlidir (bax menfiler 2.2).
        await sut.CreateAsync(7, new OrderDto(
            new List<object> { new { id = 1, qty = 2, price = 1m, name = "SAXTA", store = "SAXTA", selectedSize = "M" } },
            null, null, null, null, null, null, "Standart"));

        var item = await db.OrderItems.SingleAsync();
        Assert.Equal(1, item.ProductId);
        Assert.Equal("Test", item.Name);        // server adı
        Assert.Equal("Mağaza", item.Store);     // server mağazası
        Assert.Equal(100m, item.Price);         // server qiyməti
        Assert.Equal(2, item.Qty);
        Assert.Equal("M", item.SelectedSize);
    }

    [Fact]
    public async Task Cart_is_cleared_after_order()
    {
        using var db = TestDb.New();
        await SeedProductAsync(db);
        db.CartItems.Add(new CartItem { UserId = 7, ProductId = 1, Qty = 1 });
        await db.SaveChangesAsync();
        var sut = Build(db);

        await sut.CreateAsync(7, new OrderDto(
            new List<object> { new { id = 1, qty = 1 } }, null, null, null, null, null, null, "Standart"));

        Assert.Empty(await db.CartItems.Where(c => c.UserId == 7).ToListAsync());
    }

    [Fact]
    public async Task Valid_coupon_reduces_total_and_increments_used()
    {
        using var db = TestDb.New();
        await SeedProductAsync(db, price: 100m, stock: 5);
        db.Coupons.Add(new Coupon { Code = "SALE10", Type = CouponType.percent, Value = 10, Active = true });
        await db.SaveChangesAsync();
        var sut = Build(db);

        var dto = new OrderDto(
            new List<object> { new { id = 1, qty = 1 } }, null, null, null, null,
            CouponCode: "sale10", StoreId: null, DeliveryType: "Standart");

        var r = await sut.CreateAsync(7, dto);
        Assert.Equal(201, r.Status);
        var order = await db.Orders.SingleAsync();
        Assert.Equal(10m, order.Discount);
        Assert.Equal(1, (await db.Coupons.SingleAsync()).Used);
    }

    [Fact]
    public async Task New_order_defaults_to_cod_pending_payment()
    {
        using var db = TestDb.New();
        await SeedProductAsync(db);
        var sut = Build(db);

        await sut.CreateAsync(7, new OrderDto(
            new List<object> { new { id = 1, qty = 1 } }, null, null, null, null, null, null, "Standart"));

        var order = await db.Orders.SingleAsync();
        Assert.Equal(PaymentMethod.Cash, order.PaymentMethod);
        Assert.Equal("cod", order.PaymentProvider);
        Assert.Equal(PaymentStatus.Pending, order.PaymentStatus);
        Assert.Null(order.PaidAt);
    }

    [Fact]
    public async Task Cod_order_marked_paid_on_delivery()
    {
        using var db = TestDb.New();
        await SeedProductAsync(db);
        var order = new Order
        {
            Id = 1, UserId = 7, Status = OrderStatus.Preparing,
            PaymentProvider = "cod", PaymentStatus = PaymentStatus.Pending,
            Items = new() { new OrderItem { ProductId = 1, Qty = 1, SelectedSize = "M" } },
        };
        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var ops = new OrderOps(db, new FakeNotificationService());
        await ops.ApplyStatusAsync(order, OrderStatus.Delivered);
        await db.SaveChangesAsync();

        var saved = await db.Orders.SingleAsync();
        Assert.Equal(PaymentStatus.Paid, saved.PaymentStatus);
        Assert.NotNull(saved.PaidAt);
    }

    [Fact]
    public async Task Cancel_rejects_non_cancellable_status()
    {
        using var db = TestDb.New();
        db.Orders.Add(new Order { Id = 1, UserId = 7, Status = OrderStatus.Delivered });
        await db.SaveChangesAsync();
        var sut = Build(db);

        var r = await sut.CancelAsync(7, 1, new CancelDto("fikrimi dəyişdim"));
        Assert.Equal(400, r.Status);
    }

    [Fact]
    public async Task Cancel_requires_reason()
    {
        using var db = TestDb.New();
        db.Orders.Add(new Order { Id = 1, UserId = 7, Status = OrderStatus.Preparing });
        await db.SaveChangesAsync();
        var sut = Build(db);

        var r = await sut.CancelAsync(7, 1, new CancelDto("x"));
        Assert.Equal(400, r.Status);
    }

    [Fact]
    public async Task Cancel_sets_status_iptal()
    {
        using var db = TestDb.New();
        db.Orders.Add(new Order { Id = 1, UserId = 7, Status = OrderStatus.Preparing });
        await db.SaveChangesAsync();
        var sut = Build(db);

        var r = await sut.CancelAsync(7, 1, new CancelDto("fikrimi dəyişdim"));
        Assert.Equal(200, r.Status);
        Assert.Equal(OrderStatus.Cancelled, (await db.Orders.SingleAsync()).Status);
    }
}
