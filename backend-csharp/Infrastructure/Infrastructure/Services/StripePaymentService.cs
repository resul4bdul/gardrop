using System.Globalization;
using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Gardrop.Core.Application.Common.Interfaces;
using Gardrop.Core.Domain.Enums;
using Gardrop.Core.Domain.Models;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Gardrop.Infrastructure.Services;

/// <summary>
/// ⚠️ REFERANS İMPLEMENTASİYA — DI-da QOŞULMAYIB (default COD). Yerli bank gateway-i
/// (Azericard/Kapital/Pasha) eyni IPaymentService seam ilə yazmaq üçün canlı şablon:
/// SDK-sız HttpClient (hosted-page redirect) + HMAC-SHA256 webhook imza doğrulaması nümunəsi.
/// Yerli bankın inteqrasiya sənədinə görə: REST endpoint, imza alqoritmi və callback formatını
/// dəyişib öz servisini yaz, DI switch-ə case əlavə et. CheckoutUrl/webhook axını eynidir.
/// </summary>
public sealed class StripePaymentService : IPaymentService
{
    private const string ApiBase = "https://api.stripe.com/v1";
    // Stripe webhook imzasının köhnəlmə həddi (replay qoruması).
    private static readonly TimeSpan SignatureTolerance = TimeSpan.FromMinutes(5);

    private readonly IHttpClientFactory _http;
    private readonly StripeOptions _opt;
    private readonly string _currency;
    private readonly ILogger<StripePaymentService> _log;

    public StripePaymentService(IHttpClientFactory http, IOptions<PaymentOptions> opt, ILogger<StripePaymentService> log)
    {
        _http = http;
        _opt = opt.Value.Stripe;
        _currency = (opt.Value.Currency ?? "AZN").ToLowerInvariant();
        _log = log;
    }

    public string Provider => "stripe";
    public bool IsOnline => true;

    public async Task<PaymentIntentResult> CreateIntentAsync(Order order, CancellationToken ct = default)
    {
        if (string.IsNullOrEmpty(_opt.SecretKey))
            throw new InvalidOperationException("Stripe SecretKey konfiqurasiya olunmayıb (Payment:Stripe:SecretKey).");

        // Məbləğ ən kiçik vahiddə (qəpik/cent) — Stripe tam ədəd gözləyir.
        var minor = (long)Math.Round(order.Total * 100m, MidpointRounding.AwayFromZero);
        var form = new Dictionary<string, string>
        {
            ["mode"] = "payment",
            ["success_url"] = _opt.SuccessUrl,
            ["cancel_url"] = _opt.CancelUrl,
            ["line_items[0][quantity]"] = "1",
            ["line_items[0][price_data][currency]"] = _currency,
            ["line_items[0][price_data][unit_amount]"] = minor.ToString(CultureInfo.InvariantCulture),
            ["line_items[0][price_data][product_data][name]"] = $"Gardrop sifariş {order.OrderNo}",
            ["metadata[orderNo]"] = order.OrderNo,
            ["payment_intent_data[metadata][orderNo]"] = order.OrderNo,
        };

        var client = _http.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _opt.SecretKey);
        using var resp = await client.PostAsync($"{ApiBase}/checkout/sessions", new FormUrlEncodedContent(form), ct);
        var body = await resp.Content.ReadAsStringAsync(ct);
        if (!resp.IsSuccessStatusCode)
        {
            _log.LogError("Stripe Checkout Session xətası ({Status}): {Body}", (int)resp.StatusCode, body);
            throw new InvalidOperationException("Ödəniş sessiyası yaradıla bilmədi (şlüz xətası).");
        }

        using var doc = JsonDocument.Parse(body);
        var root = doc.RootElement;
        var sessionId = root.GetProperty("id").GetString();          // cs_... — webhook eşləməsi
        var url = root.TryGetProperty("url", out var u) ? u.GetString() : null;   // Stripe hosted ödəniş səhifəsi

        // Sessiya yaradıldı, ödəniş hələ yoxdur → Gözləyir; frontend url-ə redirect edir.
        return new PaymentIntentResult(Provider, PaymentStatus.Pending, sessionId, ClientSecret: null, CheckoutUrl: url, RequiresAction: true);
    }

    public Task<PaymentWebhookResult> HandleWebhookAsync(string payload, IReadOnlyDictionary<string, string> headers, CancellationToken ct = default)
    {
        if (string.IsNullOrEmpty(_opt.WebhookSecret))
            throw new InvalidOperationException("Stripe WebhookSecret konfiqurasiya olunmayıb (Payment:Stripe:WebhookSecret).");

        if (!TryGetHeader(headers, "Stripe-Signature", out var sigHeader) || !VerifySignature(payload, sigHeader))
        {
            _log.LogWarning("Stripe webhook imzası doğrulanmadı — event atıldı.");
            return Task.FromResult(new PaymentWebhookResult(Handled: false));
        }

        using var doc = JsonDocument.Parse(payload);
        var root = doc.RootElement;
        var type = root.TryGetProperty("type", out var t) ? t.GetString() : null;
        var obj = root.GetProperty("data").GetProperty("object");

        // checkout.session.* → object.id (sessiya id, PaymentIntentId-də saxlanılıb);
        // charge.refunded → object.payment_intent (sessiya id-yə uyğun gəlməyə bilər → no-op).
        string? intentId = type switch
        {
            "charge.refunded" => obj.TryGetProperty("payment_intent", out var pi) ? pi.GetString() : null,
            _ => obj.TryGetProperty("id", out var idEl) ? idEl.GetString() : null,
        };
        string? status = type switch
        {
            "checkout.session.completed" => PaymentStatus.Paid,
            "checkout.session.async_payment_failed" => PaymentStatus.Failed,
            "checkout.session.expired" => PaymentStatus.Failed,
            "charge.refunded" => PaymentStatus.Refunded,
            _ => null,
        };
        if (status is null) return Task.FromResult(new PaymentWebhookResult(Handled: false));
        return Task.FromResult(new PaymentWebhookResult(Handled: true, intentId, status));
    }

    private static bool TryGetHeader(IReadOnlyDictionary<string, string> headers, string name, out string value)
    {
        foreach (var kv in headers)
            if (string.Equals(kv.Key, name, StringComparison.OrdinalIgnoreCase)) { value = kv.Value; return true; }
        value = ""; return false;
    }

    /// <summary>Stripe-Signature: "t=TIMESTAMP,v1=HEX". HMAC-SHA256(secret, "t.payload") = v1, timing-safe müqayisə.</summary>
    private bool VerifySignature(string payload, string sigHeader)
    {
        string? ts = null; var v1 = new List<string>();
        foreach (var part in sigHeader.Split(','))
        {
            var i = part.IndexOf('=');
            if (i <= 0) continue;
            var k = part[..i].Trim(); var v = part[(i + 1)..].Trim();
            if (k == "t") ts = v; else if (k == "v1") v1.Add(v);
        }
        if (ts is null || v1.Count == 0) return false;

        // Replay qoruması: timestamp tolerans daxilində olmalıdır.
        if (long.TryParse(ts, out var epoch))
        {
            var age = DateTimeOffset.UtcNow - DateTimeOffset.FromUnixTimeSeconds(epoch);
            if (age > SignatureTolerance || age < -SignatureTolerance) return false;
        }
        else return false;

        var key = Encoding.UTF8.GetBytes(_opt.WebhookSecret);
        var expected = HMACSHA256.HashData(key, Encoding.UTF8.GetBytes($"{ts}.{payload}"));
        foreach (var sig in v1)
        {
            byte[] actual;
            try { actual = Convert.FromHexString(sig); } catch { continue; }
            if (CryptographicOperations.FixedTimeEquals(expected, actual)) return true;
        }
        return false;
    }
}
