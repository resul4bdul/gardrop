using System.Text.Json;
using Gardrop.Core.Application.Common;
using Gardrop.Core.Application.Common.Interfaces;
using Gardrop.Core.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Core.Application.Services;

/// <summary>Admin paneli sifariş əməliyyatları — EF (Scoped). Bax menfiler 3.1.</summary>
public class AdminOrderService : IAdminOrderService
{
    private readonly IAppDbContext _db;
    private readonly IRatingRecomputeQueue _rating;
    private readonly INotificationService _notify;
    private readonly IOrderStatusService _orderStatus;
    private readonly IDeliveryService _delivery;
    public AdminOrderService(IAppDbContext db, IRatingRecomputeQueue rating, INotificationService notify,
        IOrderStatusService orderStatus, IDeliveryService delivery)
    { _db = db; _rating = rating; _notify = notify; _orderStatus = orderStatus; _delivery = delivery; }

    public async Task<List<AdminOrderView>> OrdersAsync(string? status, CancellationToken ct = default)
    {
        var q = _db.Orders.AsNoTracking().Include(o => o.User).Include(o => o.Items).AsQueryable();
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(o => o.Status == status);

        var orders = await q.OrderByDescending(o => o.DeliveryType == DeliveryType.Express)
            .ThenByDescending(o => o.CreatedAt).ToListAsync(ct);

        var prodStore = (await _db.Products.AsNoTracking().Select(p => new { p.Id, p.StoreId }).ToListAsync(ct))
            .ToDictionary(p => p.Id, p => p.StoreId);
        var storeById = (await _db.Stores.AsNoTracking().ToListAsync(ct)).ToDictionary(s => s.Id);

        return orders.Select(o =>
        {
            var addr = Parse(o.DeliveryAddressJson);
            double? cLat = addr.ValueKind == JsonValueKind.Object && addr.TryGetProperty("lat", out var la) && la.ValueKind == JsonValueKind.Number ? la.GetDouble() : null;
            double? cLng = addr.ValueKind == JsonValueKind.Object && addr.TryGetProperty("lng", out var lo) && lo.ValueKind == JsonValueKind.Number ? lo.GetDouble() : null;

            var storeIds = new HashSet<int>();
            var itemsEl = OrderItemsJson.ToElement(o.Items);
            foreach (var it in o.Items)
                if (prodStore.TryGetValue(it.ProductId, out var sid))
                    storeIds.Add(sid);

            var orderStores = storeIds.Where(storeById.ContainsKey).Select(sid => storeById[sid]).ToList();
            var qr = _delivery.Quote(orderStores, cLat, cLng);

            return new AdminOrderView(
                Id: o.Id, OrderNo: o.OrderNo, UserId: o.UserId,
                UserEmail: o.User != null ? o.User.Email : null,
                UserName: o.User != null ? $"{o.User.FirstName} {o.User.LastName}".Trim() : null,
                Items: itemsEl,
                Total: o.Total, DeliveryFee: o.DeliveryFee, DeliveryType: o.DeliveryType,
                Discount: o.Discount, CouponCode: o.CouponCode,
                Km: qr.Km,
                CustomerLat: cLat, CustomerLng: cLng,
                Stores: orderStores.Select(s => new AdminOrderStore(s.Id, s.Name, s.Lat, s.Lng, s.Address)).ToList(),
                DeliveryAddress: addr,
                Payment: Parse(o.PaymentJson),
                Status: o.Status, CreatedAt: o.CreatedAt,
                ConfirmedAt: o.ConfirmedAt, ShippedAt: o.ShippedAt, DeliveredAt: o.DeliveredAt, CancelledAt: o.CancelledAt,
                CancelReason: o.CancelReason, CancelledBy: o.CancelledBy);
        }).ToList();
    }

    public async Task<OpResult> UpdateOrderStatusAsync(long id, AdminOrderStatusDto dto, CancellationToken ct = default)
    {
        if (!_orderStatus.IsValidStatus(dto.Status)) return OpResult.Fail(400, "Yanlış status");

        var o = await _db.Orders.Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == id, ct);
        if (o is null) return OpResult.Fail(404, "Sifariş tapılmadı");

        await using var tx = await _db.BeginTransactionAsync(ct);  // status + stok + bildiriş + reytinq atomik (2.5)
        if (dto.Status == OrderStatus.Cancelled)
        {
            var reason = (dto.Reason ?? "").Trim();
            if (reason.Length < 3) return OpResult.Fail(400, "Ləğv səbəbini qeyd edin");
            await _orderStatus.ApplyStatusAsync(o, OrderStatus.Cancelled, reason, CancelledByParty.Admin, ct);
            _notify.Notify(o.UserId, "order", "Sifariş ləğv edildi", $"{o.OrderNo} sifarişiniz ləğv edildi. Səbəb: {reason}");
        }
        else
        {
            await _orderStatus.ApplyStatusAsync(o, dto.Status!, ct: ct);
        }

        await _db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        _rating.Request();  // fon, commit-dən sonra
        return OpResult.Ok(new AdminOrderStatusResult(o.Id, o.Status, o.StockDeducted));
    }

    public async Task<OpResult> DeleteOrderAsync(long id, CancellationToken ct = default)
    {
        var o = await _db.Orders.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (o is null) return OpResult.Fail(404, "Sifariş tapılmadı");
        _db.Orders.Remove(o);
        await _db.SaveChangesAsync(ct);
        _rating.Request();
        return OpResult.Ok(new OkResult());
    }

    private static JsonElement Parse(string json)
    {
        try { return JsonSerializer.Deserialize<JsonElement>(json); }
        catch { return JsonSerializer.Deserialize<JsonElement>("null"); }
    }
}
