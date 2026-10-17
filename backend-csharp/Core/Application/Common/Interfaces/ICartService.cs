namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>Səbət əməliyyatları — biznes məntiqi Application qatında (bax menfiler D1/D2).</summary>
public interface ICartService
{
    Task<List<CartItemView>> GetAsync(long userId, CancellationToken ct = default);

    /// <summary>Səbətə əlavə. Məhsul yoxdursa null.</summary>
    Task<List<CartItemView>?> AddAsync(long userId, CartAddDto dto, CancellationToken ct = default);

    /// <summary>Sayı yenilə (0 → sil). Səbətdə yoxdursa null.</summary>
    Task<List<CartItemView>?> UpdateAsync(long userId, int productId, CartQtyDto dto, CancellationToken ct = default);

    Task<List<CartItemView>> RemoveAsync(long userId, int productId, CancellationToken ct = default);
    Task ClearAsync(long userId, CancellationToken ct = default);
}
