using System.Security.Cryptography;
using System.Text;
using Gardrop.Core.Domain.Enums;
using Gardrop.Infrastructure.Services;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Xunit;

namespace Gardrop.Tests;

// Stripe webhook imza doğrulaması + status eşləməsi (A.1). Şəbəkə yoxdur — HandleWebhookAsync saf.
public class StripePaymentServiceTests
{
    private const string Secret = "whsec_test_123";

    private static StripePaymentService Build()
    {
        var opt = Options.Create(new PaymentOptions { Provider = "stripe", Stripe = new StripeOptions { WebhookSecret = Secret } });
        return new StripePaymentService(new StubHttpFactory(), opt, NullLogger<StripePaymentService>.Instance);
    }

    // Stripe-Signature header-i real formatda qurur: "t=...,v1=HMAC-SHA256(secret, t.payload)".
    private static string Sign(string payload, string secret, long? ts = null)
    {
        var t = (ts ?? DateTimeOffset.UtcNow.ToUnixTimeSeconds()).ToString();
        var mac = HMACSHA256.HashData(Encoding.UTF8.GetBytes(secret), Encoding.UTF8.GetBytes($"{t}.{payload}"));
        return $"t={t},v1={Convert.ToHexStringLower(mac)}";
    }

    [Fact]
    public async Task ValidSignature_SessionCompleted_MapsToPaid()
    {
        var svc = Build();
        var payload = """{"type":"checkout.session.completed","data":{"object":{"id":"cs_123"}}}""";
        var headers = new Dictionary<string, string> { ["Stripe-Signature"] = Sign(payload, Secret) };

        var r = await svc.HandleWebhookAsync(payload, headers);

        Assert.True(r.Handled);
        Assert.Equal("cs_123", r.IntentId);
        Assert.Equal(PaymentStatus.Paid, r.Status);
    }

    [Fact]
    public async Task BadSignature_NotHandled()
    {
        var svc = Build();
        var payload = """{"type":"checkout.session.completed","data":{"object":{"id":"cs_123"}}}""";
        var headers = new Dictionary<string, string> { ["Stripe-Signature"] = Sign(payload, "whsec_WRONG") };

        var r = await svc.HandleWebhookAsync(payload, headers);

        Assert.False(r.Handled);
    }

    [Fact]
    public async Task RefundEvent_UsesPaymentIntentField_MapsToRefunded()
    {
        var svc = Build();
        var payload = """{"type":"charge.refunded","data":{"object":{"id":"ch_9","payment_intent":"pi_456"}}}""";
        var headers = new Dictionary<string, string> { ["Stripe-Signature"] = Sign(payload, Secret) };

        var r = await svc.HandleWebhookAsync(payload, headers);

        Assert.True(r.Handled);
        Assert.Equal("pi_456", r.IntentId);
        Assert.Equal(PaymentStatus.Refunded, r.Status);
    }

    [Fact]
    public async Task UnknownEvent_NotHandled()
    {
        var svc = Build();
        var payload = """{"type":"customer.created","data":{"object":{"id":"cus_1"}}}""";
        var headers = new Dictionary<string, string> { ["Stripe-Signature"] = Sign(payload, Secret) };

        var r = await svc.HandleWebhookAsync(payload, headers);

        Assert.False(r.Handled);
    }

    private sealed class StubHttpFactory : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => new();
    }
}
