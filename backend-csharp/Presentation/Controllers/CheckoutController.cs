using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Gardrop.Core.Application.Common.Interfaces;

namespace Gardrop.Presentation.Controllers;

/// <summary>Checkout köməkçiləri (kupon/çatdırılma). Nazik controller — məntiq ICheckoutService-də (D1/D2).</summary>
[ApiController]
[Route("api")]
public class CheckoutController : ControllerBase
{
    private readonly ICheckoutService _checkout;
    public CheckoutController(ICheckoutService checkout) => _checkout = checkout;

    // POST /api/coupons/validate  { code, subtotal }
    // Rate-limit "coupon" (IP üzrə 8/dəq) — kod brute-force/enumeration qarşısı.
    [EnableRateLimiting("coupon")]
    [HttpPost("coupons/validate")]
    public async Task<IActionResult> ValidateCoupon([FromBody] CouponCheckDto dto, CancellationToken ct)
    {
        var r = await _checkout.ValidateCouponAsync(dto, ct);
        return r.IsSuccess ? Ok(r.Data) : BadRequest(new { valid = false, error = r.Error });
    }

    // POST /api/delivery/quote  { lat, lng } — server səbətindən, hər mağazadan ayrıca
    [Authorize]
    [HttpPost("delivery/quote")]
    public async Task<IActionResult> DeliveryQuote([FromBody] DeliveryQuoteDto dto, CancellationToken ct) =>
        Ok(await _checkout.DeliveryQuoteAsync(User.GetUserId()!.Value, dto, ct));
}
