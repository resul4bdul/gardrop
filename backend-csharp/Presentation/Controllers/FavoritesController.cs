using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Gardrop.Core.Application.Common.Interfaces;

namespace Gardrop.Presentation.Controllers;

// Nazik controller — biznes məntiqi IFavoriteService-dədir (Application qatı, bax menfiler D1/D2).
[ApiController]
[Authorize]
[Route("api/favorites")]
public class FavoritesController : ControllerBase
{
    private readonly IFavoriteService _favorites;
    public FavoritesController(IFavoriteService favorites) => _favorites = favorites;

    // GET /api/favorites  → tam məhsullar
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct) =>
        Ok(await _favorites.GetProductsAsync(User.GetUserId()!.Value, ct));

    // GET /api/favorites/ids  → yalnız id massivi
    [HttpGet("ids")]
    public async Task<IActionResult> GetIds(CancellationToken ct) =>
        Ok(await _favorites.GetIdsAsync(User.GetUserId()!.Value, ct));

    // POST /api/favorites/:productId  (toggle)
    [HttpPost("{productId:int}")]
    public async Task<IActionResult> Toggle(int productId, CancellationToken ct)
    {
        var res = await _favorites.ToggleAsync(User.GetUserId()!.Value, productId, ct);
        if (res is null) return NotFound(new { error = "Məhsul tapılmadı" });
        return Ok(new { added = res.Value.Added, favorites = res.Value.Favorites });
    }

    // DELETE /api/favorites  — hamısını sil (atomik)
    [HttpDelete]
    public async Task<IActionResult> Clear(CancellationToken ct) =>
        Ok(new { favorites = await _favorites.ClearAsync(User.GetUserId()!.Value, ct) });

    // DELETE /api/favorites/:productId
    [HttpDelete("{productId:int}")]
    public async Task<IActionResult> Remove(int productId, CancellationToken ct) =>
        Ok(new { favorites = await _favorites.RemoveAsync(User.GetUserId()!.Value, productId, ct) });
}
