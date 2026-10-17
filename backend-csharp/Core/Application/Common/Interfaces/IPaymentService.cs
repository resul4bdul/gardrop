using Gardrop.Core.Domain.Models;

namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>Ödəniş niyyəti nəticəsi — onlayn şlüz üçün client secret/redirect; COD üçün sadəcə status.</summary>
public record PaymentIntentResult(
    string Provider, string Status, string? IntentId = null,
    string? ClientSecret = null, string? CheckoutUrl = null, bool RequiresAction = false);

/// <summary>Webhook parse nəticəsi — hansı intent hansı statusa keçdi (Handled=false → bizə aid deyil).</summary>
public record PaymentWebhookResult(bool Handled, string? IntentId = null, string? Status = null);

/// <summary>
/// Ödəniş şlüzü abstraksiyası (bax A.1). Defolt: COD (qapıda nağd, onlayn tutma yox).
/// Onlayn provayder (Stripe/PayPal/bank) bu interfeysi həyata keçirib DI-da qoşulur.
/// </summary>
public interface IPaymentService
{
    /// <summary>Provayder açarı (Order.PaymentProvider-ə yazılır): "cod" / "stripe" / ...</summary>
    string Provider { get; }

    /// <summary>true → onlayn tutma (frontend client secret/redirect istifadə edir); false → COD.</summary>
    bool IsOnline { get; }

    /// <summary>Sifariş üçün ödəniş niyyəti yaradır (onlayn) və ya COD vəziyyətini qaytarır.</summary>
    Task<PaymentIntentResult> CreateIntentAsync(Order order, CancellationToken ct = default);

    /// <summary>Şlüz webhook-unu doğrulayıb parse edir (imza header-lərdə).</summary>
    Task<PaymentWebhookResult> HandleWebhookAsync(string payload, IReadOnlyDictionary<string, string> headers, CancellationToken ct = default);
}

/// <summary>Webhook-u sifariş ödəniş vəziyyətinə tətbiq edən tətbiq servisi (controller nazik qalır).</summary>
public interface IPaymentWebhookService
{
    /// <returns>true → event bizə aiddir və işləndi.</returns>
    Task<bool> HandleAsync(string payload, IReadOnlyDictionary<string, string> headers, CancellationToken ct = default);
}
