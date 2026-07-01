using Gardrop.Core.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Core.Application.Services;

/// <summary>Public mağaza kataloqu (Scoped).</summary>
public class StoreCatalogService : IStoreCatalogService
{
    private readonly IAppDbContext _db;
    public StoreCatalogService(IAppDbContext db) => _db = db;

    public async Task<List<StoreView>> ListAsync(CancellationToken ct = default) =>
        (await _db.Stores.AsNoTracking().OrderBy(s => s.Id).ToListAsync(ct)).ToViews();

    public async Task<StoreView?> GetAsync(int id, CancellationToken ct = default)
    {
        var s = await _db.Stores.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        return s is null ? null : StoreView.From(s);
    }

    public async Task<StoreView?> GetByUrlAsync(string url, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(url)) return null;
        var s = await _db.Stores.AsNoTracking().FirstOrDefaultAsync(x => x.Url == url, ct);
        return s is null ? null : StoreView.From(s);
    }
}
