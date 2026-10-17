using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Gardrop.Core.Application.Common.Interfaces;
using Gardrop.Infrastructure.Services;

namespace Gardrop.Presentation.Controllers;

/// <summary>
/// Ödəniş şlüzü webhook-u (bax A.1). Şlüz ödənişi təsdiqləyəndə sifariş PaymentStatus
/// → Paid olur. İmza header-lərdə doğrulanır (IPaymentService implementasiyasında).
/// COD provayderində webhook gəlmir (Handled=false).
/// </summary>
[ApiController]
[Route("api/payments")]
public class PaymentController : ControllerBase
{
    private readonly IPaymentWebhookService _webhook;
    private readonly IPaymentService _payment;
    private readonly PaymentOptions _opt;
    public PaymentController(IPaymentWebhookService webhook, IPaymentService payment, IOptions<PaymentOptions> opt)
    { _webhook = webhook; _payment = payment; _opt = opt.Value; }

    // GET /api/payments/config  (frontend checkout: provider + onlayn? + publishable key)
    [HttpGet("config")]
    [AllowAnonymous]
    public IActionResult Config() => Ok(new
    {
        provider = _payment.Provider,
        online = _payment.IsOnline,
        publishableKey = _payment.IsOnline ? _opt.Stripe.PublishableKey : "",
    });

    // POST /api/payments/webhook  (şlüz çağırır — anonim, imza ilə doğrulanır)
    [HttpPost("webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> Webhook(CancellationToken ct)
    {
        using var reader = new StreamReader(Request.Body);
        var payload = await reader.ReadToEndAsync(ct);
        var headers = Request.Headers.ToDictionary(h => h.Key, h => h.Value.ToString());
        var handled = await _webhook.HandleAsync(payload, headers, ct);
        return Ok(new { handled });
    }
}
