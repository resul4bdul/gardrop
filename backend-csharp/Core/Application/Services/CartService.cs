using Gardrop.Core.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Core.Application.Services;

/// <summary>Səbət əməliyyatlarının EF implementasiyası (Scoped).</summary>
public class CartService : ICartService
{
    private readonly IAppDbContext _db;
    public CartService(IAppDbContext db) => _db = db;

    private async Task<List<CartItemView>> HydrateAsync(long userId, CancellationToken ct = default)
    {
        var rows = await _db.CartItems.AsNoTracking().Where(c => c.UserId == userId).ToListAsync(ct);
        var products = await _db.Products.AsNoTracking().ToListAsync(ct);
        var result = new List<CartItemView>();
        foreach (var row in rows)
        {
            var p = products.FirstOrDefault(x => x.Id == row.ProductId);
            if (p is null) continue;
            result.Add(CartItemView.From(p, row.Qty, row.Size ?? p.Size));
        }
        return result;
    }

    public Task<List<CartItemView>> GetAsync(long userId, CancellationToken ct = default) => HydrateAsync(userId, ct);

    public async Task<List<CartItemView>?> AddAsync(long userId, CartAddDto dto, CancellationToken ct = default)
    {
        var product = await _db.Products.FindAsync([dto.ProductId], ct);
        if (product is null) return null;

        var qty = dto.Qty is > 0 ? dto.Qty.Value : 1;
        var existing = await _db.CartItems.FirstOrDefaultAsync(c => c.UserId == userId && c.ProductId == dto.ProductId, ct);
        if (existing is not null) existing.Qty += qty;
        else _db.CartItems.Add(new CartItem { UserId = userId, ProductId = dto.ProductId, Qty = qty, Size = dto.Size ?? product.Size });

        await _db.SaveChangesAsync(ct);
        return await HydrateAsync(userId, ct);
    }

    public async Task<List<CartItemView>?> UpdateAsync(long userId, int productId, CartQtyDto dto, CancellationToken ct = default)
    {
        var row = await _db.CartItems.FirstOrDefaultAsync(c => c.UserId == userId && c.ProductId == productId, ct);
        if (row is null) return null;

        var qty = dto.Qty ?? 0;
        if (qty <= 0) _db.CartItems.Remove(row);
        else row.Qty = qty;

        await _db.SaveChangesAsync(ct);
        return await HydrateAsync(userId, ct);
    }

    public async Task<List<CartItemView>> RemoveAsync(long userId, int productId, CancellationToken ct = default)
    {
        var row = await _db.CartItems.FirstOrDefaultAsync(c => c.UserId == userId && c.ProductId == productId, ct);
        if (row is not null) { _db.CartItems.Remove(row); await _db.SaveChangesAsync(ct); }
        return await HydrateAsync(userId, ct);
    }

    public async Task ClearAsync(long userId, CancellationToken ct = default)
    {
        _db.CartItems.RemoveRange(_db.CartItems.Where(c => c.UserId == userId));
        await _db.SaveChangesAsync(ct);
    }
}
