using Gardrop.Core.Application.Common.Interfaces;
using Gardrop.Core.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Core.Application.Services;

/// <summary>Komissiya idarəsi + net gəlir faktoru (Scoped).</summary>
public class CommissionService : ICommissionService
{
    private readonly IAppDbContext _db;
    public CommissionService(IAppDbContext db) => _db = db;

    public async Task<Dictionary<int, decimal>> NetFactorsAsync(int storeId, CancellationToken ct = default)
    {
        // Silinmiş məhsul da daxil — keçmiş satışların komissiya faktoru düzgün hesablansın (yoxsa F=1 → sıfır komissiya).
        var prods = await _db.Products.AsNoTracking().IgnoreQueryFilters().Where(p => p.StoreId == storeId)
            .Select(p => new { p.Id, p.Category }).ToListAsync(ct);
        var coms = await _db.StoreCommissions.AsNoTracking().Where(c => c.StoreId == storeId).ToListAsync(ct);
        var byCat = coms.Where(c => c.Category != "").ToDictionary(c => c.Category, c => c.Percent);
        var def = coms.FirstOrDefault(c => c.Category == "")?.Percent ?? 0m;
        decimal Factor(string? cat) => 1m - (byCat.TryGetValue(cat ?? "", out var pc) ? pc : def) / 100m;
        return prods.ToDictionary(p => p.Id, p => Math.Clamp(Factor(p.Category), 0m, 1m));
    }

    public async Task<List<StoreCommissionDto>> ListAsync(int storeId, CancellationToken ct = default) =>
        await _db.StoreCommissions.AsNoTracking().Where(c => c.StoreId == storeId)
            .OrderBy(c => c.Category).Select(c => new StoreCommissionDto(c.Category, c.Percent)).ToListAsync(ct);

    public async Task ReplaceAsync(int storeId, List<StoreCommissionDto> rows, CancellationToken ct = default)
    {
        var existing = await _db.StoreCommissions.Where(c => c.StoreId == storeId).ToListAsync(ct);
        _db.StoreCommissions.RemoveRange(existing);
        var seen = new HashSet<string>();
        foreach (var r in rows ?? new())
        {
            var cat = (r.Category ?? "").Trim();
            if (!seen.Add(cat)) continue;                       // təkrar kateqoriya → atla
            var pct = Math.Clamp(r.Percent, 0m, 100m);
            _db.StoreCommissions.Add(new StoreCommission { StoreId = storeId, Category = cat, Percent = pct });
        }
        await _db.SaveChangesAsync(ct);
    }
}
