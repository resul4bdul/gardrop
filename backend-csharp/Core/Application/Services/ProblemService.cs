using Gardrop.Core.Application.Common;
using Gardrop.Core.Application.Common.DTOs;
using Gardrop.Core.Application.Common.Helpers;
using Gardrop.Core.Application.Common.Interfaces;
using Gardrop.Core.Domain.Enums;
using Gardrop.Core.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Core.Application.Services;

/// <summary>
/// Sifariş problemləri (Scoped) — Trendyol modeli axını. Bax <see cref="IProblemService"/>.
/// Hər status keçidi <see cref="ProblemEvent"/> kimi yazılır (müştəri timeline-ı buradan qurulur).
/// </summary>
public class ProblemService : IProblemService
{
    /// <summary>Geri qaytarma pəncərəsi — çatdırılmadan sonra 14 gün.</summary>
    public static readonly TimeSpan ReturnWindow = TimeSpan.FromDays(14);
    /// <summary>Satıcının cavab pəncərəsi — 48 saat; bitərsə avtomatik arbitraj.</summary>
    public static readonly TimeSpan StoreResponseWindow = TimeSpan.FromHours(48);

    private const int MaxPhotos = 5;

    private readonly IAppDbContext _db;
    private readonly INotificationService _notify;
    private readonly IActivityLogService _activity;
    public ProblemService(IAppDbContext db, INotificationService notify, IActivityLogService activity)
    { _db = db; _notify = notify; _activity = activity; }

    // ── Müştəri ──

    public async Task<OpResult> CreateAsync(long userId, long orderId, ProblemCreateDto dto, CancellationToken ct = default)
    {
        var reason = (dto.Reason ?? "").Trim();
        if (!ProblemReason.All.Contains(reason))
            return OpResult.Fail(400, "Problem səbəbi seçilməlidir");

        var description = InputSanitizer.CleanMultiline(dto.Description ?? "");
        if (description.Length < 5) return OpResult.Fail(400, "Problemi ətraflı təsvir edin (min 5 simvol)");

        var photos = (dto.Photos ?? new()).Select(p => (p ?? "").Trim())
            .Where(p => p.Length > 0 && p.Length <= 300).Take(MaxPhotos).ToList();

        var order = await _db.Orders.AsNoTracking().Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId, ct);
        if (order is null) return OpResult.Fail(404, "Sifariş tapılmadı");
        if (order.UserId != userId) return OpResult.Fail(403, "Bu sifariş sizə aid deyil");
        if (order.Status == OrderStatus.Cancelled) return OpResult.Fail(409, "Ləğv edilmiş sifariş üçün problem açıla bilməz");

        // 14 gün pəncərə — çatdırılma tarixindən hesablanır.
        if (order.DeliveredAt is DateTime delivered && DateTime.UtcNow - delivered > ReturnWindow)
            return OpResult.Fail(409, "Geri qaytarma pəncərəsi bağlanıb (çatdırılmadan 14 gün keçib)");

        // Malı görmədən "bəyənmədim/ölçü olmadı" açıla bilməz; "çatdırılmadı" isə çatdırılandan sonra mənasızdır.
        if (ProblemReason.RequiresDelivered.Contains(reason) && order.DeliveredAt is null)
            return OpResult.Fail(409, "Bu səbəb yalnız çatdırılmış sifariş üçün keçərlidir");
        if (reason == ProblemReason.NotDelivered && order.DeliveredAt is not null)
            return OpResult.Fail(409, "Sifariş artıq çatdırılıb");

        var hasActive = await _db.Problems.AnyAsync(p =>
            p.OrderId == orderId && !ProblemStatus.Terminal.Contains(p.Status), ct);
        if (hasActive) return OpResult.Fail(409, "Bu sifariş üçün artıq aktiv problem var");

        // Aidiyyatlı mağaza — sifariş məhsullarının ilk mağazası (Dispute ilə eyni yanaşma).
        var pids = order.Items.Select(i => i.ProductId).Where(id => id != 0).Distinct().ToList();
        int? storeId = pids.Count == 0 ? null : await _db.Products.AsNoTracking()
            .Where(p => pids.Contains(p.Id)).Select(p => (int?)p.StoreId).FirstOrDefaultAsync(ct);

        var now = DateTime.UtcNow;
        var problem = new Problem
        {
            OrderId = orderId, OrderNo = order.OrderNo, UserId = userId, StoreId = storeId,
            Reason = reason, Description = description, Photos = photos,
            Status = ProblemStatus.AwaitingStore, StoreDeadline = now + StoreResponseWindow,
        };
        _db.Problems.Add(problem);
        // Əvvəl problem yazılır ki, event üçün real Id yaransın (ProblemEvent FK naviqasiyasızdır).
        await _db.SaveChangesAsync(ct);
        AddEvent(problem, ProblemStatus.AwaitingStore, "Müştəri", $"{reason}: {description}");

        // Satıcıya + adminlərə bildiriş.
        if (storeId is int sid)
        {
            var ownerId = await _db.Stores.AsNoTracking().Where(s => s.Id == sid)
                .Select(s => s.OwnerUserId).FirstOrDefaultAsync(ct);
            if (ownerId is long oid)
                _notify.Notify(oid, "problem", "Yeni problem bildirişi",
                    $"{order.OrderNo} sifarişi üçün müştəri problem açdı ({reason}). 48 saat ərzində cavab verin — vaxt bitsə iş avtomatik arbitraja keçir.");
        }
        foreach (var aid in await AdminIdsAsync(ct))
            _notify.Notify(aid, "problem", "Yeni problem", $"{order.OrderNo} sifarişi üçün müştəri problem açdı: {reason}");

        await _db.SaveChangesAsync(ct);
        return OpResult.Created(new { id = problem.Id, status = problem.Status, storeDeadline = problem.StoreDeadline });
    }

    public async Task<List<ProblemView>> MyAsync(long userId, CancellationToken ct = default)
    {
        var rows = await _db.Problems.AsNoTracking().Where(p => p.UserId == userId)
            .OrderByDescending(p => p.Id).Take(100).ToListAsync(ct);
        return await ToViewsAsync(rows, withEvents: false, ct);
    }

    public async Task<OpResult> GetAsync(long userId, long problemId, CancellationToken ct = default)
    {
        var p = await _db.Problems.AsNoTracking().FirstOrDefaultAsync(x => x.Id == problemId, ct);
        if (p is null) return OpResult.Fail(404, "Problem tapılmadı");
        if (p.UserId != userId) return OpResult.Fail(403, "Bu problem sizə aid deyil");
        var views = await ToViewsAsync(new List<Problem> { p }, withEvents: true, ct);
        return OpResult.Ok(views[0]);
    }

    public async Task<OpResult> CancelAsync(long userId, long problemId, CancellationToken ct = default)
    {
        var p = await _db.Problems.FirstOrDefaultAsync(x => x.Id == problemId, ct);
        if (p is null) return OpResult.Fail(404, "Problem tapılmadı");
        if (p.UserId != userId) return OpResult.Fail(403, "Bu problem sizə aid deyil");
        if (ProblemStatus.IsTerminal(p.Status)) return OpResult.Fail(409, "Problem artıq bağlanıb");

        Close(p, ProblemStatus.Cancelled, "cancel");
        AddEvent(p, ProblemStatus.Cancelled, "Müştəri", "Müştəri problemi geri götürdü");
        await _db.SaveChangesAsync(ct);
        return OpResult.Ok(new { id = p.Id, status = p.Status });
    }

    // ── Satıcı ──

    public async Task<OpResult> StoreListAsync(long uid, int storeId, CancellationToken ct = default)
    {
        if (!await OwnsStoreAsync(uid, storeId, ct)) return OpResult.Fail(403, "Bu mağaza sizin deyil");
        var rows = await _db.Problems.AsNoTracking().Where(p => p.StoreId == storeId)
            .OrderByDescending(p => p.Id).Take(200).ToListAsync(ct);
        return OpResult.Ok(await ToViewsAsync(rows, withEvents: false, ct));
    }

    public async Task<OpResult> StoreRespondAsync(long uid, int storeId, long problemId, ProblemStoreRespondDto dto, CancellationToken ct = default)
    {
        if (!await OwnsStoreAsync(uid, storeId, ct)) return OpResult.Fail(403, "Bu mağaza sizin deyil");

        var p = await _db.Problems.FirstOrDefaultAsync(x => x.Id == problemId && x.StoreId == storeId, ct);
        if (p is null) return OpResult.Fail(404, "Problem tapılmadı");
        if (p.Status != ProblemStatus.AwaitingStore)
            return OpResult.Fail(409, "Bu problemə artıq cavab verilib və ya cavab pəncərəsi bağlanıb");

        var note = InputSanitizer.CleanMultiline(dto.Note ?? "");
        if (!dto.Accept && note.Length < 5)
            return OpResult.Fail(400, "Rədd səbəbini yazın (min 5 simvol)");

        p.StoreRespondedAt = DateTime.UtcNow;
        p.StoreResponseNote = note;

        if (dto.Accept)
        {
            // Satıcı qəbul etdi → admin qaytarma logistikası + xərc qərarı verir.
            p.Status = ProblemStatus.StoreAccepted;
            AddEvent(p, ProblemStatus.StoreAccepted, "Mağaza", note);
            _notify.Notify(p.UserId, "problem", "Problem qəbul edildi",
                $"{p.OrderNo} sifarişi üzrə probleminizi satıcı qəbul etdi. Qaytarma prosesi tezliklə başlayacaq.");
            foreach (var aid in await AdminIdsAsync(ct))
                _notify.Notify(aid, "problem", "Satıcı problemi qəbul etdi",
                    $"{p.OrderNo}: satıcı qəbul etdi — qaytarma kuryeri və xərc qərarı gözlənilir.");
        }
        else
        {
            // Satıcı rədd etdi → arbitraj.
            p.Status = ProblemStatus.Arbitration;
            AddEvent(p, ProblemStatus.Arbitration, "Mağaza", $"Satıcı rədd etdi: {note}");
            _notify.Notify(p.UserId, "problem", "Problem arbitraja keçdi",
                $"{p.OrderNo} sifarişi üzrə probleminizi satıcı rədd etdi — iş platforma arbitrajına keçdi.");
            foreach (var aid in await AdminIdsAsync(ct))
                _notify.Notify(aid, "problem", "Arbitraj tələb olunur",
                    $"{p.OrderNo}: satıcı problemi rədd etdi — {note}");
        }

        await _db.SaveChangesAsync(ct);
        return OpResult.Ok(new { id = p.Id, status = p.Status });
    }

    public async Task<OpResult> StoreReceivedAsync(long uid, int storeId, long problemId, CancellationToken ct = default)
    {
        if (!await OwnsStoreAsync(uid, storeId, ct)) return OpResult.Fail(403, "Bu mağaza sizin deyil");

        var p = await _db.Problems.FirstOrDefaultAsync(x => x.Id == problemId && x.StoreId == storeId, ct);
        if (p is null) return OpResult.Fail(404, "Problem tapılmadı");
        if (p.Status != ProblemStatus.ReturnInProgress)
            return OpResult.Fail(409, "Bu problem qaytarma mərhələsində deyil");

        // Mal satıcıya çatdı → avtomatik refund.
        p.ReturnReceivedAt = DateTime.UtcNow;
        AddEvent(p, ProblemStatus.ReturnInProgress, "Mağaza", "Satıcı qaytarılan malı təhvil aldı");
        await RefundOrderAsync(p, ct);
        Close(p, ProblemStatus.Refunded, "refund");
        AddEvent(p, ProblemStatus.Refunded, "Sistem", "Mal satıcıya çatdı — ödəniş avtomatik geri qaytarıldı");
        _notify.Notify(p.UserId, "problem", "Ödəniş geri qaytarıldı",
            $"{p.OrderNo} sifarişi üzrə qaytardığınız mal satıcıya çatdı — ödənişiniz geri qaytarıldı.");

        await _db.SaveChangesAsync(ct);
        return OpResult.Ok(new { id = p.Id, status = p.Status });
    }

    // ── Admin ──

    public async Task<List<ProblemView>> AdminListAsync(string? status, CancellationToken ct = default)
    {
        var q = _db.Problems.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(status)) q = q.Where(p => p.Status == status);
        var rows = await q.OrderByDescending(p => p.Id).Take(200).ToListAsync(ct);
        return await ToViewsAsync(rows, withEvents: true, ct);
    }

    public async Task<OpResult> AdminDecideAsync(long adminId, long problemId, ProblemDecideDto dto, CancellationToken ct = default)
    {
        var action = (dto.Action ?? "").Trim().ToLowerInvariant();
        if (action is not ("return" or "refund" or "reject" or "freeze"))
            return OpResult.Fail(400, "Naməlum əməliyyat (return | refund | reject | freeze)");

        var p = await _db.Problems.FirstOrDefaultAsync(x => x.Id == problemId, ct);
        if (p is null) return OpResult.Fail(404, "Problem tapılmadı");
        if (ProblemStatus.IsTerminal(p.Status)) return OpResult.Fail(409, "Problem artıq bağlanıb");

        var note = InputSanitizer.CleanMultiline(dto.Note ?? "");
        var adminName = (await _db.Users.AsNoTracking().Where(u => u.Id == adminId)
            .Select(u => (u.FirstName + " " + u.LastName).Trim()).FirstOrDefaultAsync(ct)) ?? "Admin";

        switch (action)
        {
            case "return":
            {
                var payer = (dto.CostPayer ?? "").Trim();
                if (!Gardrop.Core.Domain.Enums.ReturnCostPayer.All.Contains(payer))
                    return OpResult.Fail(400, "Kuryer xərcini kimin ödəyəcəyi seçilməlidir (Mağaza | Müştəri)");
                if (p.Status == ProblemStatus.ReturnInProgress)
                    return OpResult.Fail(409, "Qaytarma artıq başladılıb");

                p.ReturnRequired = true;
                p.ReturnCostPayer = payer;
                p.ReturnStartedAt = DateTime.UtcNow;
                p.Status = ProblemStatus.ReturnInProgress;
                AddEvent(p, ProblemStatus.ReturnInProgress, "Admin",
                    $"Kuryer qaytarması başladıldı — xərci {payer} ödəyir{(note.Length > 0 ? $". {note}" : "")}");
                _notify.Notify(p.UserId, "problem", "Qaytarma başladı",
                    $"{p.OrderNo}: kuryer malı götürmək üçün sizinlə əlaqə saxlayacaq. Kuryer xərcini {payer.ToLowerInvariant()} ödəyir.");
                await NotifyStoreOwnerAsync(p, "Qaytarma kuryeri yoldadır",
                    $"{p.OrderNo}: qaytarılan mal kuryerlə sizə göndəriləcək (xərc: {payer}). Malı təhvil alanda paneldə təsdiqləyin.", ct);
                break;
            }
            case "refund":
            {
                await RefundOrderAsync(p, ct);
                Close(p, ProblemStatus.Refunded, note.Length > 0 ? $"refund: {note}" : "refund");
                AddEvent(p, ProblemStatus.Refunded, "Admin", note.Length > 0 ? note : "Ödəniş geri qaytarıldı");
                _notify.Notify(p.UserId, "problem", "Ödəniş geri qaytarıldı",
                    $"{p.OrderNo} sifarişi üzrə probleminiz həll olundu — ödəniş geri qaytarıldı.");
                await NotifyStoreOwnerAsync(p, "Problem refund ilə bağlandı",
                    $"{p.OrderNo}: admin qərarı ilə müştəriyə ödəniş geri qaytarıldı.", ct);
                break;
            }
            case "reject":
            {
                Close(p, ProblemStatus.Rejected, note.Length > 0 ? $"reject: {note}" : "reject");
                AddEvent(p, ProblemStatus.Rejected, "Admin", note.Length > 0 ? note : "Problem əsassız sayıldı");
                _notify.Notify(p.UserId, "problem", "Problem rədd edildi",
                    $"{p.OrderNo} sifarişi üzrə probleminiz araşdırıldı və əsassız sayıldı{(note.Length > 0 ? $": {note}" : ".")}");
                break;
            }
            case "freeze":
            {
                if (p.StoreId is not int sid) return OpResult.Fail(409, "Problemin aid olduğu mağaza yoxdur");
                var store = await _db.Stores.FirstOrDefaultAsync(s => s.Id == sid, ct);
                if (store is not null) store.PayoutFrozen = true;
                AddEvent(p, p.Status, "Admin", "Araşdırma üçün mağaza ödənişləri donduruldu");
                break;
            }
        }

        _activity.Log(adminId, adminName, "problem.decide", "problem", p.Id.ToString(),
            $"{p.OrderNo} problemi üzrə «{action}» qərarı{(note.Length > 0 ? $" — {note}" : "")}");
        await _db.SaveChangesAsync(ct);
        return OpResult.Ok(new { id = p.Id, status = p.Status, resolution = p.Resolution });
    }

    // ── Fon sweep ──

    public async Task<int> EscalateOverdueAsync(CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var overdue = await _db.Problems
            .Where(p => p.Status == ProblemStatus.AwaitingStore && p.StoreDeadline < now)
            .ToListAsync(ct);
        if (overdue.Count == 0) return 0;

        var adminIds = await AdminIdsAsync(ct);
        foreach (var p in overdue)
        {
            p.Status = ProblemStatus.Arbitration;
            AddEvent(p, ProblemStatus.Arbitration, "Sistem", "Satıcı 48 saat ərzində cavab vermədi — iş arbitraja keçdi");
            _notify.Notify(p.UserId, "problem", "Problem arbitraja keçdi",
                $"{p.OrderNo}: satıcı vaxtında cavab vermədiyi üçün probleminiz platforma arbitrajına keçdi.");
            foreach (var aid in adminIds)
                _notify.Notify(aid, "problem", "Arbitraj tələb olunur (48 saat bitdi)",
                    $"{p.OrderNo}: satıcı 48 saat ərzində cavab vermədi.");
        }
        await _db.SaveChangesAsync(ct);
        return overdue.Count;
    }

    // ── Köməkçilər ──

    private void AddEvent(Problem p, string status, string actorRole, string note) =>
        _db.ProblemEvents.Add(new ProblemEvent
        {
            ProblemId = p.Id, Status = status, ActorRole = actorRole,
            Note = InputSanitizer.CleanMultiline(note),
        });

    private static void Close(Problem p, string status, string resolution)
    {
        p.Status = status;
        p.Resolution = resolution;
        p.ResolvedAt = DateTime.UtcNow;
    }

    private async Task RefundOrderAsync(Problem p, CancellationToken ct)
    {
        var order = await _db.Orders.FirstOrDefaultAsync(o => o.Id == p.OrderId, ct);
        if (order is not null) order.PaymentStatus = PaymentStatus.Refunded;
    }

    private Task<bool> OwnsStoreAsync(long uid, int storeId, CancellationToken ct) =>
        _db.Stores.AsNoTracking().AnyAsync(s => s.Id == storeId && s.OwnerUserId == uid, ct);

    private Task<List<long>> AdminIdsAsync(CancellationToken ct) =>
        _db.Users.AsNoTracking().Where(u => u.IsAdmin).Select(u => u.Id).ToListAsync(ct);

    private async Task NotifyStoreOwnerAsync(Problem p, string title, string body, CancellationToken ct)
    {
        if (p.StoreId is not int sid) return;
        var ownerId = await _db.Stores.AsNoTracking().Where(s => s.Id == sid)
            .Select(s => s.OwnerUserId).FirstOrDefaultAsync(ct);
        if (ownerId is long oid) _notify.Notify(oid, "problem", title, body);
    }

    private async Task<List<ProblemView>> ToViewsAsync(List<Problem> rows, bool withEvents, CancellationToken ct)
    {
        var userIds = rows.Select(p => p.UserId).Distinct().ToList();
        var storeIds = rows.Where(p => p.StoreId != null).Select(p => p.StoreId!.Value).Distinct().ToList();
        var users = await _db.Users.AsNoTracking().Where(u => userIds.Contains(u.Id))
            .Select(u => new { u.Id, Name = (u.FirstName + " " + u.LastName).Trim(), u.Email })
            .ToDictionaryAsync(u => u.Id, ct);
        var stores = await _db.Stores.AsNoTracking().Where(s => storeIds.Contains(s.Id))
            .Select(s => new { s.Id, s.Name }).ToDictionaryAsync(s => s.Id, s => s.Name, ct);

        Dictionary<long, List<ProblemEventView>> events = new();
        if (withEvents && rows.Count > 0)
        {
            var ids = rows.Select(p => p.Id).ToList();
            events = (await _db.ProblemEvents.AsNoTracking()
                    .Where(e => ids.Contains(e.ProblemId)).OrderBy(e => e.Id).ToListAsync(ct))
                .GroupBy(e => e.ProblemId)
                .ToDictionary(g => g.Key, g => g.Select(e =>
                    new ProblemEventView(e.Status, e.ActorRole, e.Note, e.CreatedAt)).ToList());
        }

        return rows.Select(p => new ProblemView(
            p.Id, p.OrderId, p.OrderNo, p.UserId,
            users.TryGetValue(p.UserId, out var u) ? (string.IsNullOrWhiteSpace(u.Name) ? u.Email : u.Name) : "—",
            p.StoreId, p.StoreId != null && stores.TryGetValue(p.StoreId.Value, out var sn) ? sn : "",
            p.Reason, p.Description, p.Photos,
            p.Status, p.StoreDeadline, p.StoreResponseNote, p.StoreRespondedAt,
            p.ReturnRequired, p.ReturnCostPayer, p.ReturnStartedAt, p.ReturnReceivedAt,
            p.Resolution, p.ResolvedAt, p.CreatedAt,
            withEvents ? (events.TryGetValue(p.Id, out var ev) ? ev : new List<ProblemEventView>()) : null)).ToList();
    }
}
