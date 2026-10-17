using System.Text.Json;
using Gardrop.Core.Application.Common;
using Gardrop.Core.Application.Common.Interfaces;
using Gardrop.Core.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Core.Application.Services;

/// <summary>Müştəri sifariş əməliyyatları — EF implementasiyası (Scoped).</summary>
public class OrderService : IOrderService
{
    private readonly IAppDbContext _db;
    private readonly IRatingRecomputeQueue _rating;
    private readonly IOrderStatusService _orderStatus;
    private readonly IDeliveryService _delivery;
    private readonly ICouponService _coupon;
    private readonly IPaymentService _payment;
    private readonly INotificationService _notify;
    private readonly IEmailSender _email;
    public OrderService(IAppDbContext db, IRatingRecomputeQueue rating, IOrderStatusService orderStatus,
        IDeliveryService delivery, ICouponService coupon, IPaymentService payment, INotificationService notify, IEmailSender email)
    { _db = db; _rating = rating; _orderStatus = orderStatus; _delivery = delivery; _coupon = coupon; _payment = payment; _notify = notify; _email = email; }

    private static async Task SafeEmail(IEmailSender email, string to, string subject, string html)
    {
        try { await email.SendAsync(to, subject, html); } catch { /* email xətası sifarişi pozmasın */ }
    }

    private static OrderView Shape(Order o) => new(
        Id: o.Id,
        UserId: o.UserId,
        OrderNo: o.OrderNo,
        Items: OrderItemsJson.ToElement(o.Items),
        Total: o.Total,
        DeliveryFee: o.DeliveryFee,
        DeliveryType: o.DeliveryType,
        Discount: o.Discount,
        CouponCode: o.CouponCode,
        DeliveryAddress: JsonSerializer.Deserialize<JsonElement>(o.DeliveryAddressJson),
        Payment: JsonSerializer.Deserialize<JsonElement>(o.PaymentJson),
        Status: o.Status,
        CreatedAt: o.CreatedAt,
        ConfirmedAt: o.ConfirmedAt,
        ShippedAt: o.ShippedAt,
        DeliveredAt: o.DeliveredAt,
        CancelledAt: o.CancelledAt,
        CancelReason: o.CancelReason,
        CancelledBy: o.CancelledBy,
        PaymentMethod: o.PaymentMethod,
        PaymentStatus: o.PaymentStatus);

    public async Task<OpResult> CreateAsync(long userId, OrderDto dto, CancellationToken ct = default)
    {
        if (dto.Items is null || dto.Items.Count == 0)
            return OpResult.Fail(400, "Sifariş boşdur");

        // ── Səbət cəmini server tərəfdə məhsul qiymətlərindən hesabla (müştəri dəyərinə güvənmə) ──
        var itemsEl = JsonSerializer.SerializeToElement(dto.Items);
        var products = await _db.Products.AsNoTracking().ToListAsync(ct);
        decimal subtotal = 0;
        var storeIds = new HashSet<int>();
        var orderItems = new List<OrderItem>();
        foreach (var li in OrderItemsJson.Parse(itemsEl))
        {
            var p = products.FirstOrDefault(x => x.Id == li.Id);
            if (p is null) continue;
            subtotal += p.Price * li.Qty;
            storeIds.Add(p.StoreId);
            // Snapshot server dəyərləri ilə (qiymət/ad/mağaza saxtalaşdırıla bilməz; bax menfiler 2.2).
            orderItems.Add(new OrderItem
            {
                ProductId = p.Id, Name = p.Name, Store = p.Store,
                Price = p.Price, Qty = li.Qty, SelectedSize = li.SelectedSize,
            });
        }
        if (orderItems.Count == 0)
            return OpResult.Fail(400, "Sifariş boşdur");

        // ── Çatdırılma xərci: ünvan koordinatına görə (server hesablayır) ──
        var addrEl = JsonSerializer.SerializeToElement(dto.DeliveryAddress ?? new { });
        double? lat = addrEl.TryGetProperty("lat", out var latEl) && latEl.ValueKind == JsonValueKind.Number ? latEl.GetDouble() : null;
        double? lng = addrEl.TryGetProperty("lng", out var lngEl) && lngEl.ValueKind == JsonValueKind.Number ? lngEl.GetDouble() : null;
        var stores = await _db.Stores.AsNoTracking().Where(s => storeIds.Contains(s.Id)).ToListAsync(ct);
        bool express = string.Equals(dto.DeliveryType, DeliveryType.Express, StringComparison.OrdinalIgnoreCase);
        var deliveryFee = _delivery.Quote(stores, lat, lng, subtotal, express).Total;

        // ── Kupon (varsa) — server təsdiqi + istifadə sayğacı ──
        decimal discount = 0;
        string? appliedCode = null;
        if (!string.IsNullOrWhiteSpace(dto.CouponCode))
        {
            var code = dto.CouponCode.Trim().ToUpperInvariant();
            var coupon = await _db.Coupons.FirstOrDefaultAsync(c => c.Code == code, ct);
            var res = _coupon.Evaluate(coupon, subtotal);
            if (res.Ok) { discount = res.Discount; appliedCode = coupon!.Code; coupon.Used++; }
        }

        decimal total = Math.Round(Math.Max(0m, subtotal - discount) + deliveryFee, 2);

        // Unikal sifariş nömrəsi (toqquşma olarsa təkrar cəhd — bax menfiler 2.7).
        string orderNo;
        do { orderNo = "#GD-" + Random.Shared.Next(100000, 1000000); }
        while (await _db.Orders.AnyAsync(o => o.OrderNo == orderNo, ct));

        // ── Ödəniş metodu (müştəri snapshot-undan) — default COD (nağd) ──
        var payEl = JsonSerializer.SerializeToElement(dto.Payment ?? new { method = PaymentMethod.Cash });
        var method = payEl.TryGetProperty("method", out var mEl) && mEl.ValueKind == JsonValueKind.String && !string.IsNullOrWhiteSpace(mEl.GetString())
            ? mEl.GetString()!
            : PaymentMethod.Cash;

        var order = new Order
        {
            UserId = userId,
            OrderNo = orderNo,
            Items = orderItems,
            Total = total,
            DeliveryFee = deliveryFee,
            DeliveryType = express ? DeliveryType.Express : DeliveryType.Standard,
            Discount = discount,
            CouponCode = appliedCode,
            DeliveryAddressJson = JsonSerializer.Serialize(dto.DeliveryAddress ?? new { }),
            PaymentJson = JsonSerializer.Serialize(dto.Payment ?? new { method = PaymentMethod.Cash }),
            PaymentMethod = method,
            Status = OrderStatus.Preparing,
            CreatedAt = DateTime.UtcNow,
        };

        // ── Ödəniş niyyəti: onlayn şlüz → intent/redirect; COD → Gözləyir (bax A.1) ──
        var intent = await _payment.CreateIntentAsync(order, ct);
        order.PaymentProvider = intent.Provider;
        order.PaymentIntentId = intent.IntentId;
        order.PaymentStatus = intent.Status;

        // Vahid atomik əməliyyat: sifariş + səbət boşaltma + kupon sayğacı + reytinq (bax menfiler 2.5).
        await using var tx = await _db.BeginTransactionAsync(ct);
        _db.Orders.Add(order);

        // checkout səbəti boşaldır
        _db.CartItems.RemoveRange(_db.CartItems.Where(c => c.UserId == userId));

        await _db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        _rating.Request();  // sifariş sayı mağaza reytinqinə təsir edir (fon, commit-dən sonra)

        // ── Yeni sifariş: mağaza sahiblərinə panel bildirişi + email ──
        var ownerIds = stores.Where(s => s.OwnerUserId != null).Select(s => s.OwnerUserId!.Value).Distinct().ToList();
        if (ownerIds.Count > 0)
        {
            var expressTag = express ? " ⚡ EKSPRESS (30 dəq ərzində hazırlayın)" : "";
            foreach (var oid in ownerIds)
                _notify.Notify(oid, "order", "Yeni sifariş",
                    $"{orderNo} yeni sifariş daxil oldu.{expressTag} Mağaza panelindən hazırlayın.");
            await _db.SaveChangesAsync(ct);
            var ownerEmails = await _db.Users.AsNoTracking().Where(u => ownerIds.Contains(u.Id))
                .Select(u => u.Email).ToListAsync(ct);
            foreach (var em in ownerEmails)
                if (!string.IsNullOrWhiteSpace(em))
                    _ = SafeEmail(_email, em, "Yeni sifariş — Gardrop",
                        $"<p><b>{orderNo}</b> yeni sifariş daxil oldu.{(express ? " <b>Ekspress</b> — 30 dəqiqə ərzində hazırlayın." : "")}</p>");
        }

        return OpResult.Created(new OrderCreatedResult(
            order.OrderNo, order.Id, total, deliveryFee, discount,
            order.PaymentStatus, order.PaymentProvider, intent.CheckoutUrl, intent.ClientSecret, intent.RequiresAction));
    }

    public async Task<List<OrderView>> ListAsync(long userId, int? page = null, int? pageSize = null, CancellationToken ct = default)
    {
        var orders = await _db.Orders.AsNoTracking()
            .Include(o => o.Items)
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAt)
            .Page(page, pageSize)   // opt-in səhifələmə (bax menfiler 4.3)
            .ToListAsync(ct);
        return orders.Select(Shape).ToList();
    }

    public async Task<OrderView?> GetAsync(long userId, long id, CancellationToken ct = default)
    {
        var order = await _db.Orders.AsNoTracking().Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id && o.UserId == userId, ct);
        return order is null ? null : Shape(order);
    }

    public async Task<OpResult> CancelAsync(long userId, long id, CancelDto? dto, CancellationToken ct = default)
    {
        var order = await _db.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == id && o.UserId == userId, ct);
        if (order is null) return OpResult.Fail(404, "Sifariş tapılmadı");

        if (order.Status is not (OrderStatus.Preparing or OrderStatus.Prepared))
            return OpResult.Fail(400, "Bu sifariş artıq ləğv edilə bilməz. Ləğv üçün dəstəklə əlaqə saxlayın.");

        var reason = (dto?.Reason ?? "").Trim();
        if (reason.Length < 3) return OpResult.Fail(400, "Ləğv səbəbini qeyd edin");

        await using var tx = await _db.BeginTransactionAsync(ct);
        await _orderStatus.ApplyStatusAsync(order, OrderStatus.Cancelled, reason, CancelledByParty.Customer, ct);
        await _db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        _rating.Request();  // müştəri imtinası mağaza reytinqini azaldır (fon, commit-dən sonra)
        return OpResult.Ok(Shape(order));
    }
}
