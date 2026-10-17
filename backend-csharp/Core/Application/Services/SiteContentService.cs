using Gardrop.Core.Application.Common.Interfaces;
using Gardrop.Core.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Core.Application.Services;

/// <summary>Sayt məzmunu (CMS) anbarı — sadə key-value upsert (Scoped).</summary>
public class SiteContentService : ISiteContentService
{
    private readonly IAppDbContext _db;
    public SiteContentService(IAppDbContext db) => _db = db;

    public async Task<Dictionary<string, string>> AllAsync(CancellationToken ct = default) =>
        await _db.SiteContents.AsNoTracking().ToDictionaryAsync(c => c.Key, c => c.Json, ct);

    public async Task<string?> GetAsync(string key, CancellationToken ct = default) =>
        (await _db.SiteContents.AsNoTracking().FirstOrDefaultAsync(c => c.Key == key, ct))?.Json;

    public async Task SetAsync(string key, string json, CancellationToken ct = default)
    {
        var row = await _db.SiteContents.FirstOrDefaultAsync(c => c.Key == key, ct);
        if (row is null)
            _db.SiteContents.Add(new SiteContent { Key = key, Json = json, UpdatedAt = DateTime.UtcNow });
        else { row.Json = json; row.UpdatedAt = DateTime.UtcNow; }
        await _db.SaveChangesAsync(ct);
    }
}
