using Gardrop.Core.Application.Common;
using Gardrop.Core.Application.Common.DTOs;
using Gardrop.Core.Application.Common.Helpers;
using Gardrop.Core.Application.Common.Interfaces;
using Gardrop.Core.Domain.Enums;
using Gardrop.Core.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Core.Application.Services;

/// <summary>Müştəri münaqişələri (Scoped) — müştəri açır; admin dondurur/qaytarır/rədd edir.</summary>
public class DisputeService : IDisputeService
{
    private readonly IAppDbContext _db;
    private readonly INotificationService _notify;
    private readonly IActivityLogService _activity;
    public DisputeService(IAppDbContext db, INotificationService notify, IActivityLogService activity)
    { _db = db; _notify = notify; _activity = activity; }

    public async Task<OpResult> CreateAsync(long userId, long orderId, DisputeCreateDto dto, CancellationToken ct = default)
    {
        var reason = InputSanitizer.CleanMultiline(dto.Reason);
        if (reason.Length < 5) return OpResult.Fail(400, "Şikayət səbəbini ətraflı yazın (min 5 simvol)");

        var order = await _db.Orders.AsNoTracking().Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId, ct);
        if (order is null) return OpResult.Fail(404, "Sifariş tapılmadı");
        if (order.UserId != userId) return OpResult.Fail(403, "Bu sifariş sizə aid deyil");

        if (await _db.Disputes.AnyAsync(d => d.OrderId == orderId && d.Status == DisputeStatus.Open, ct))
            return OpResult.Fail(409, "Bu sifariş üçün artıq açıq münaqişə var");

        // Aidiyyatlı mağaza — sifariş məhsullarının ilk mağazası.
        var pids = order.Items.Select(i => i.ProductId).Where(id => id != 0).Distinct().ToList();
        int? storeId = pids.Count == 0 ? null : await _db.Products.AsNoTracking()
            .Where(p => pids.Contains(p.Id)).Select(p => (int?)p.StoreId).FirstOrDefaultAsync(ct);

        var dispute = new Dispute
        {
            OrderId = orderId, OrderNo = order.OrderNo, UserId = userId, StoreId = storeId,
            Reason = reason, Status = DisputeStatus.Open,
        };
        _db.Disputes.Add(dispute);

        // Adminlərə bildiriş.
        var adminIds = await _db.Users.AsNoTracking().Where(u => u.IsAdmin).Select(u => u.Id).ToListAsync(ct);
        foreach (var aid in adminIds)
            _notify.Notify(aid, "dispute", "Yeni münaqişə", $"{order.OrderNo} sifarişi üçün müştəri şikayət açdı: {reason}");

        await _db.SaveChangesAsync(ct);
        return OpResult.Created(new { id = dispute.Id, status = dispute.Status });
    }

    public async Task<List<DisputeView>> ListAsync(string? status, CancellationToken ct = default)
    {
        var q = _db.Disputes.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(d => d.Status == status);
        var rows = await q.OrderByDescending(d => d.Id).Take(200).ToListAsync(ct);

        var userIds = rows.Select(d => d.UserId).Distinct().ToList();
        var storeIds = rows.Where(d => d.StoreId != null).Select(d => d.StoreId!.Value).Distinct().ToList();
        var users = await _db.Users.AsNoTracking().Where(u => userIds.Contains(u.Id))
            .Select(u => new { u.Id, Name = (u.FirstName + " " + u.LastName).Trim(), u.Email }).ToDictionaryAsync(u => u.Id, ct);
        var stores = await _db.Stores.AsNoTracking().Where(s => storeIds.Contains(s.Id))
            .Select(s => new { s.Id, s.Name }).ToDictionaryAsync(s => s.Id, s => s.Name, ct);

        return rows.Select(d => new DisputeView(
            d.Id, d.OrderId, d.OrderNo, d.UserId,
            users.TryGetValue(d.UserId, out var u) ? (string.IsNullOrWhiteSpace(u.Name) ? u.Email : u.Name) : "—",
            d.StoreId, d.StoreId != null && stores.TryGetValue(d.StoreId.Value, out var sn) ? sn : "",
            d.Reason, d.Status, d.Resolution, d.ResolvedAt, d.CreatedAt)).ToList();
    }

    public async Task<OpResult> ResolveAsync(long adminId, long disputeId, DisputeResolveDto dto, CancellationToken ct = default)
    {
        var action = (dto.Action ?? "").Trim().ToLowerInvariant();
        if (action is not ("refund" or "freeze" or "dismiss"))
            return OpResult.Fail(400, "Naməlum əməliyyat (refund | freeze | dismiss)");

        var d = await _db.Disputes.FirstOrDefaultAsync(x => x.Id == disputeId, ct);
        if (d is null) return OpResult.Fail(404, "Münaqişə tapılmadı");
        if (d.Status == DisputeStatus.Resolved) return OpResult.Fail(409, "Münaqişə artıq həll olunub");

        var note = (dto.Note ?? "").Trim();
        var adminName = (await _db.Users.AsNoTracking().Where(u => u.Id == adminId)
            .Select(u => (u.FirstName + " " + u.LastName).Trim()).FirstOrDefaultAsync(ct)) ?? "Admin";

        string custMsg;
        if (action == "refund")
        {
            var order = await _db.Orders.FirstOrDefaultAsync(o => o.Id == d.OrderId, ct);
            if (order is not null) { order.PaymentStatus = PaymentStatus.Refunded; }
            custMsg = $"{d.OrderNo} sifarişi üzrə şikayətiniz həll olundu — ödəniş geri qaytarıldı.";
        }
        else if (action == "freeze")
        {
            if (d.StoreId is int sid)
            {
                var store = await _db.Stores.FirstOrDefaultAsync(s => s.Id == sid, ct);
                if (store is not null) store.PayoutFrozen = true;
            }
            custMsg = $"{d.OrderNo} sifarişi üzrə şikayətiniz araşdırılır — mağaza ödənişi donduruldu.";
        }
        else
            custMsg = $"{d.OrderNo} sifarişi üzrə şikayətiniz nəzərdən keçirildi.";

        d.Status = DisputeStatus.Resolved;
        d.Resolution = string.IsNullOrEmpty(note) ? action : $"{action}: {note}";
        d.ResolvedAt = DateTime.UtcNow;

        _notify.Notify(d.UserId, "dispute", "Münaqişə həll olundu", custMsg);
        _activity.Log(adminId, adminName, "dispute.resolve", "dispute", d.Id.ToString(),
            $"{d.OrderNo} münaqişəsi «{action}» ilə həll olundu{(note.Length > 0 ? $" — {note}" : "")}");

        await _db.SaveChangesAsync(ct);
        return OpResult.Ok(new { id = d.Id, status = d.Status, resolution = d.Resolution });
    }
}
