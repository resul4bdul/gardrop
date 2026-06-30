namespace Gardrop.Infrastructure.Services;

/// <summary>Ödəniş konfiqurasiyası ("Payment" bölməsi). Provider="cod" → qapıda nağd (default).</summary>
public sealed class PaymentOptions
{
    public string Provider { get; set; } = "cod";   // "cod" | "stripe" | ...
    public string Currency { get; set; } = "AZN";
    public StripeOptions Stripe { get; set; } = new();
}

/// <summary>Stripe açarları ("Payment:Stripe" bölməsi). Sirlər env/user-secrets-də saxlanılır.</summary>
public sealed class StripeOptions
{
    public string SecretKey { get; set; } = "";        // sk_... (server)
    public string PublishableKey { get; set; } = "";   // pk_... (frontend-ə verilir)
    public string WebhookSecret { get; set; } = "";    // whsec_... (webhook imza doğrulaması)
    public string SuccessUrl { get; set; } = "http://localhost:5173/#/order-success";  // ödəniş uğurlu → app
    public string CancelUrl { get; set; } = "http://localhost:5173/#/checkout";        // imtina → checkout
}
