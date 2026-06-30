using Gardrop.Core.Application.Common;
using Gardrop.Core.Application.Common.DTOs;
using Gardrop.Core.Application.Common.Interfaces;
using Gardrop.Core.Domain.Enums;
using Gardrop.Core.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Core.Application.Services;

/// <summary>Mağazaya ödəniş (settlement) idarəsi (Scoped) — admin CRUD. Bax [[gardrop-commission-orders]].</summary>
public class StorePayoutService : IStorePayoutService
{
    private readonly IAppDbContext _db;
    public StorePayoutService(IAppDbContext db) => _db = db;

    public async Task<List<PayoutView>> ListAsync(int storeId, CancellationToken ct = default) =>
        (await _db.StorePayouts.AsNoTracking().Where(p => p.StoreId == storeId)
            .OrderByDescending(p => p.PeriodEnd).ThenByDescending(p => p.Id).ToListAsync(ct))
            .Select(PayoutView.From).ToList();

    public async Task<OpResult> CreateAsync(AdminPayoutDto dto, CancellationToken ct = default)
    {
        if (!await _db.Stores.AnyAsync(s => s.Id == dto.StoreId, ct))
            return OpResult.Fail(404, "Mağaza tapılmadı");
        if (dto.Amount is not > 0)
            return OpResult.Fail(400, "Məbləğ 0-dan böyük olmalıdır");

        var status = dto.Status == PayoutStatus.Paid ? PayoutStatus.Paid : PayoutStatus.Pending;
        var start = Utc(dto.PeriodStart) ?? DateTime.UtcNow.Date;
        var end = Utc(dto.PeriodEnd) ?? DateTime.UtcNow.Date;

        var payout = new StorePayout
        {
            StoreId = dto.StoreId,
            PeriodStart = start,
            PeriodEnd = end,
            Amount = Math.Round(dto.Amount!.Value, 2),
            Status = status,
            PaidAt = status == PayoutStatus.Paid ? DateTime.UtcNow : null,
            Method = (dto.Method ?? "").Trim(),
            Reference = (dto.Reference ?? "").Trim(),
            Note = (dto.Note ?? "").Trim(),
        };
        _db.StorePayouts.Add(payout);
        await _db.SaveChangesAsync(ct);
        return OpResult.Created(PayoutView.From(payout));
    }

    public async Task<OpResult> DeleteAsync(long id, CancellationToken ct = default)
    {
        var payout = await _db.StorePayouts.FirstOrDefaultAsync(p => p.Id == id, ct);
        if (payout is null) return OpResult.Fail(404, "Ödəniş tapılmadı");
        _db.StorePayouts.Remove(payout);   // qlobal soft-delete (IsDeleted=true)
        await _db.SaveChangesAsync(ct);
        return OpResult.Ok(new { id });
    }

    // Naive (Kind=Unspecified) tarixləri UTC kimi işarələ — Npgsql timestamptz tələbi.
    private static DateTime? Utc(DateTime? d) =>
        d is null ? null : DateTime.SpecifyKind(d.Value, DateTimeKind.Utc);
}
