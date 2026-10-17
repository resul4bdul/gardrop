using Gardrop.Core.Application.Common;
using Gardrop.Core.Application.Common.Helpers;
using Gardrop.Core.Application.Common.Interfaces;
using Gardrop.Core.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Core.Application.Services;

/// <summary>Satıcı paneli — sifariş idarəsi (Scoped). Mağaza yalnız öz hissəsini "Hazırlandı" edə/ləğv edə bilər. Bax menfiler 3.1.</summary>
public class StoreOwnerOrderService : StoreOwnerServiceBase, IStoreOwnerOrderService
{
    private readonly IRatingRecomputeQueue _rating;
    private readonly INotificationService _notify;
    private readonly IOrderStatusService _orderStatus;
    private readonly IEmailSender _email;
    public StoreOwnerOrderService(IAppDbContext db, IRatingRecomputeQueue rating, INotificationService notify, IOrderStatusService orderStatus, IEmailSender email)
        : base(db) { _rating = rating; _notify = notify; _orderStatus = orderStatus; _email = email; }

    private static async Task SafeEmail(IEmailSender email, string? to, string subject, string html)
    {
        if (string.IsNullOrWhiteSpace(to)) return;
        try { await email.SendAsync(to, subject, html); } catch { /* email xətası sifarişi pozmasın */ }
    }

    public async Task<OpResult> OrdersAsync(long userId, int storeId, string? status, CancellationToken ct = default)
    {
        var s = await OwnedAsync(userId, storeId, ct);
        if (s is null) return NotOwned;

        var idSet = (await _db.Products.AsNoTracking().Where(p => p.StoreId == storeId).Select(p => p.Id).ToListAsync(ct)).ToHashSet();
        var prodStore = await _db.Products.AsNoTracking().Select(p => new { p.Id, p.StoreId })
            .ToDictionaryAsync(p => p.Id, p => p.StoreId, ct);
        var orders = await _db.Orders.AsNoTracking().Include(o => o.User).Include(o => o.Items)
            .OrderByDescending(o => o.DeliveryType == DeliveryType.Express)
            .ThenByDescending(o => o.CreatedAt).ToListAsync(ct);

        var result = new List<StoreOrderView>();
        foreach (var o in orders)
        {
            if (!string.IsNullOrWhiteSpace(status) && o.Status != status) continue;
            var (mineCount, mineSum, mineItems) = MyItemsDetailed(o.Items, idSet);
            if (mineCount == 0) continue;
            var orderStoreIds = OrderStoreIds(o.Items, prodStore);
            var prepared = o.PreparedStores;
            result.Add(new StoreOrderView(
                Id: o.Id, OrderNo: o.OrderNo, UserId: o.UserId,
                UserName: o.User != null ? $"{o.User.FirstName} {o.User.LastName}".Trim() : null,
                UserEmail: o.User != null ? o.User.Email : null,
                Status: o.Status, CreatedAt: o.CreatedAt, ConfirmedAt: o.ConfirmedAt,
                ShippedAt: o.ShippedAt, DeliveredAt: o.DeliveredAt, CancelledAt: o.CancelledAt,
                DeliveryType: o.DeliveryType, CancelReason: o.CancelReason, CancelledBy: o.CancelledBy,
                PaymentMethod: o.PaymentMethod,
                DeliveryAddress: Parse(o.DeliveryAddressJson),
                MyItems: mineItems,
                MySubtotal: Math.Round(mineSum, 2),
                MyPrepared: prepared.Contains(storeId),
                MultiStore: orderStoreIds.Count > 1,
                StoreCount: orderStoreIds.Count,
                PreparedCount: prepared.Count(p => orderStoreIds.Contains(p))));
        }
        return OpResult.Ok(result);
    }

    public async Task<OpResult> UpdateOrderStatusAsync(long userId, int storeId, long orderId, AdminOrderStatusDto dto, CancellationToken ct = default)
    {
        var s = await OwnedAsync(userId, storeId, ct);
        if (s is null) return NotOwned;
        if (!_orderStatus.IsValidStatus(dto.Status)) return OpResult.Fail(400, "Yanlış status");
        if (!_orderStatus.StoreAllowedStatuses.Contains(dto.Status))
            return OpResult.Fail(403, "Mağaza yalnız sifarişi \"Hazırlandı\" və ya \"Yolda\" işarələyə bilər (status geri dönmür)");

        var idSet = (await _db.Products.AsNoTracking().Where(p => p.StoreId == storeId).Select(p => p.Id).ToListAsync(ct)).ToHashSet();
        var o = await _db.Orders.Include(x => x.Items).Include(x => x.User).FirstOrDefaultAsync(x => x.Id == orderId, ct);
        if (o is null) return OpResult.Fail(404, "Sifariş tapılmadı");
        var (mine, _) = MyItems(o.Items, idSet);
        if (mine == 0) return OpResult.Fail(403, "Bu sifarişdə sizin məhsulunuz yoxdur");

        if (o.Status is not (OrderStatus.Preparing or OrderStatus.Prepared))
            return OpResult.Fail(403, "Bu sifariş artıq emal mərhələsindən keçib");

        var prodStore = await _db.Products.AsNoTracking().Select(p => new { p.Id, p.StoreId })
            .ToDictionaryAsync(p => p.Id, p => p.StoreId, ct);
        var orderStoreIds = OrderStoreIds(o.Items, prodStore);

        await using var tx = await _db.BeginTransactionAsync(ct);  // status + stok + bildiriş + reytinq atomik (2.5)
        if (dto.Status == OrderStatus.Cancelled)
        {
            // Hazır işarələnmiş hissə artıq ləğv edilə bilməz.
            if (o.PreparedStores.Contains(storeId))
                return OpResult.Fail(403, "Bu sifariş artıq hazırdır — ləğv edilə bilməz");
            var reason = InputSanitizer.CleanMultiline(dto.Reason);
            if (reason.Length < 3) return OpResult.Fail(400, "Ləğv səbəbini qeyd edin");
            await _orderStatus.ApplyStatusAsync(o, OrderStatus.Cancelled, reason, CancelledByParty.Store, ct);
            _notify.Notify(o.UserId, "order", "Sifariş ləğv edildi",
                $"{o.OrderNo} sifarişiniz mağaza tərəfindən ləğv edildi. Səbəb: {reason}");
            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
            _rating.Request();  // fon, commit-dən sonra
            _ = SafeEmail(_email, o.User?.Email, "Sifarişiniz ləğv edildi",
                $"<p><b>{System.Text.Encodings.Web.HtmlEncoder.Default.Encode(o.OrderNo)}</b> sifarişiniz mağaza tərəfindən ləğv edildi.</p><p>Səbəb: {System.Text.Encodings.Web.HtmlEncoder.Default.Encode(reason)}</p>");
            return OpResult.Ok(new StoreOrderCancelResult(o.Id, o.Status));
        }

        // Kuryerə verildi (Yolda) — yalnız sifariş tam hazır olduqda.
        if (dto.Status == OrderStatus.OnTheWay)
        {
            if (o.Status != OrderStatus.Prepared) return OpResult.Fail(403, "Yalnız hazır sifariş kuryerə verilə bilər");
            await _orderStatus.ApplyStatusAsync(o, OrderStatus.OnTheWay, ct: ct);
            _notify.Notify(o.UserId, "order", "Sifariş yolda", $"{o.OrderNo} sifarişiniz kuryerə verildi və yoldadır.");
            await _db.SaveChangesAsync(ct);
            await tx.CommitAsync(ct);
            _rating.Request();
            _ = SafeEmail(_email, o.User?.Email, "Sifarişiniz yolda", $"<p><b>{o.OrderNo}</b> sifarişiniz kuryerə verildi.</p>");
            return OpResult.Ok(new StoreOrderPreparedResult(o.Id, o.Status, true, true, orderStoreIds.Count, orderStoreIds.Count));
        }

        // Hazırlandı (default) — çox-mağaza per-store işarələmə. (Geri qaytarma yoxdur — Live Status bir-yönlü.)
        var prepared = o.PreparedStores;
        if (!prepared.Contains(storeId)) prepared.Add(storeId);

        bool allReady = orderStoreIds.Count > 0 && orderStoreIds.All(sid => prepared.Contains(sid));
        if (allReady)
        {
            await _orderStatus.ApplyStatusAsync(o, OrderStatus.Prepared, ct: ct);
            // Bütün mağazalar hazırladıqda adminə bildiriş.
            var adminIds = await _db.Users.AsNoTracking().Where(u => u.IsAdmin).Select(u => u.Id).ToListAsync(ct);
            foreach (var aid in adminIds)
                _notify.Notify(aid, "order", "Sifariş hazırdır", $"{o.OrderNo} sifarişi bütün mağazalar tərəfindən hazırlandı — göndərişə hazırdır.");
        }

        await _db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);
        _rating.Request();  // fon, commit-dən sonra
        if (allReady)
            _ = SafeEmail(_email, o.User?.Email, "Sifarişiniz hazırdır",
                $"<p><b>{o.OrderNo}</b> sifarişiniz hazırlandı və tezliklə göndərişə veriləcək.</p>");
        return OpResult.Ok(new StoreOrderPreparedResult(
            Id: o.Id, Status: o.Status, MyPrepared: true, AllReady: allReady,
            PreparedCount: prepared.Count(p => orderStoreIds.Contains(p)),
            StoreCount: orderStoreIds.Count));
    }

    // Kuryeri çağır — mağaza admin/dispatch-ə bildiriş göndərir (kuryer inteqrasiyası gələndə real API-yə bağlanacaq).
    public async Task<OpResult> RequestCourierAsync(long userId, int storeId, long orderId, CancellationToken ct = default)
    {
        var s = await OwnedAsync(userId, storeId, ct);
        if (s is null) return NotOwned;

        var idSet = (await _db.Products.AsNoTracking().Where(p => p.StoreId == storeId).Select(p => p.Id).ToListAsync(ct)).ToHashSet();
        var o = await _db.Orders.Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == orderId, ct);
        if (o is null) return OpResult.Fail(404, "Sifariş tapılmadı");
        var (mine, _) = MyItems(o.Items, idSet);
        if (mine == 0) return OpResult.Fail(403, "Bu sifarişdə sizin məhsulunuz yoxdur");
        if (o.Status is not (OrderStatus.Prepared or OrderStatus.OnTheWay))
            return OpResult.Fail(400, "Kuryer yalnız hazır sifariş üçün çağırıla bilər");

        var adminIds = await _db.Users.AsNoTracking().Where(u => u.IsAdmin).Select(u => u.Id).ToListAsync(ct);
        foreach (var aid in adminIds)
            _notify.Notify(aid, "courier", "Kuryer çağırıldı",
                $"{s.Name} mağazası {o.OrderNo} sifarişi üçün kuryer çağırdı — götürülməyə hazırdır.");
        await _db.SaveChangesAsync(ct);
        return OpResult.Ok(new { ok = true, orderId = o.Id });
    }
}
