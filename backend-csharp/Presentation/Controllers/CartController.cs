using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Gardrop.Core.Application.Common.Interfaces;

namespace Gardrop.Presentation.Controllers;

// Nazik controller — məntiq ICartService-dədir (Application qatı, bax menfiler D1/D2).
[ApiController]
[Authorize]
[Route("api/cart")]
public class CartController : ControllerBase
{
    private readonly ICartService _cart;
    public CartController(ICartService cart) => _cart = cart;

    // GET /api/cart
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct) =>
        Ok(await _cart.GetAsync(User.GetUserId()!.Value, ct));

    // POST /api/cart  { productId, qty?, size? }
    [HttpPost]
    public async Task<IActionResult> Add([FromBody] CartAddDto dto, CancellationToken ct)
    {
        var result = await _cart.AddAsync(User.GetUserId()!.Value, dto, ct);
        if (result is null) return NotFound(new { error = "Məhsul tapılmadı" });
        return StatusCode(201, result);
    }

    // PUT /api/cart/:productId  { qty }
    [HttpPut("{productId:int}")]
    public async Task<IActionResult> Update(int productId, [FromBody] CartQtyDto dto, CancellationToken ct)
    {
        var result = await _cart.UpdateAsync(User.GetUserId()!.Value, productId, dto, ct);
        if (result is null) return NotFound(new { error = "Səbətdə tapılmadı" });
        return Ok(result);
    }

    // DELETE /api/cart/:productId
    [HttpDelete("{productId:int}")]
    public async Task<IActionResult> Remove(int productId, CancellationToken ct) =>
        Ok(await _cart.RemoveAsync(User.GetUserId()!.Value, productId, ct));

    // DELETE /api/cart  (clear)
    [HttpDelete]
    public async Task<IActionResult> Clear(CancellationToken ct)
    {
        await _cart.ClearAsync(User.GetUserId()!.Value, ct);
        return Ok(Array.Empty<object>());
    }
}
