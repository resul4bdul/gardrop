namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>
/// Favorit (sevimli məhsul) əməliyyatları — biznes məntiqi controller-dən Application qatına
/// köçürülüb (bax menfiler D1/D2: nazik controller, məntiq servisdə).
/// </summary>
public interface IFavoriteService
{
    Task<List<int>> GetIdsAsync(long userId, CancellationToken ct = default);
    Task<List<ProductView>> GetProductsAsync(long userId, CancellationToken ct = default);

    /// <summary>Toggle. Məhsul yoxdursa null qaytarır.</summary>
    Task<(bool Added, List<int> Favorites)?> ToggleAsync(long userId, int productId, CancellationToken ct = default);

    Task<List<int>> ClearAsync(long userId, CancellationToken ct = default);
    Task<List<int>> RemoveAsync(long userId, int productId, CancellationToken ct = default);
}
