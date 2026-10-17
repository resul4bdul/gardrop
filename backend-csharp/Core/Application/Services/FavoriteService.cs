using Gardrop.Core.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Core.Application.Services;

/// <summary>Favorit əməliyyatlarının EF implementasiyası (Scoped — DbContext inject olunur).</summary>
public class FavoriteService : IFavoriteService
{
    private readonly IAppDbContext _db;
    public FavoriteService(IAppDbContext db) => _db = db;

    public async Task<List<int>> GetIdsAsync(long userId, CancellationToken ct = default) =>
        await _db.Favorites.AsNoTracking().Where(f => f.UserId == userId).Select(f => f.ProductId).ToListAsync(ct);

    public async Task<List<ProductView>> GetProductsAsync(long userId, CancellationToken ct = default)
    {
        var ids = await GetIdsAsync(userId, ct);
        var products = await _db.Products.AsNoTracking().ToListAsync(ct);
        return ids.Select(id => products.FirstOrDefault(p => p.Id == id)).Where(p => p is not null).Select(p => p!).ToViews();
    }

    public async Task<(bool Added, List<int> Favorites)?> ToggleAsync(long userId, int productId, CancellationToken ct = default)
    {
        if (!await _db.Products.AnyAsync(p => p.Id == productId, ct)) return null;

        var existing = await _db.Favorites.FirstOrDefaultAsync(f => f.UserId == userId && f.ProductId == productId, ct);
        bool added;
        if (existing is not null) { _db.Favorites.Remove(existing); added = false; }
        else { _db.Favorites.Add(new Favorite { UserId = userId, ProductId = productId }); added = true; }

        await _db.SaveChangesAsync(ct);
        return (added, await GetIdsAsync(userId, ct));
    }

    public async Task<List<int>> ClearAsync(long userId, CancellationToken ct = default)
    {
        _db.Favorites.RemoveRange(_db.Favorites.Where(f => f.UserId == userId));
        await _db.SaveChangesAsync(ct);
        return new List<int>();
    }

    public async Task<List<int>> RemoveAsync(long userId, int productId, CancellationToken ct = default)
    {
        var existing = await _db.Favorites.FirstOrDefaultAsync(f => f.UserId == userId && f.ProductId == productId, ct);
        if (existing is not null) { _db.Favorites.Remove(existing); await _db.SaveChangesAsync(ct); }
        return await GetIdsAsync(userId, ct);
    }
}
