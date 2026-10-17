using Gardrop.Core.Application.Common.Interfaces;
using Gardrop.Core.Domain.Enums;
using Gardrop.Core.Domain.Models;

namespace Gardrop.Core.Application.Services;

/// <summary>
/// Defolt ödəniş provayderi: COD (qapıda nağd). Onlayn tutma yoxdur — ödəniş
/// çatdırılmada yığılır (OrderOps Delivered → PaymentStatus.Paid). Bax A.1.
/// Onlayn şlüz qoşulanda yalnız DI qeydiyyatı dəyişir (IStorageService modeli ilə eyni).
/// </summary>
public class CodPaymentService : IPaymentService
{
    public string Provider => "cod";
    public bool IsOnline => false;

    public Task<PaymentIntentResult> CreateIntentAsync(Order order, CancellationToken ct = default)
        => Task.FromResult(new PaymentIntentResult(Provider, PaymentStatus.Pending));

    public Task<PaymentWebhookResult> HandleWebhookAsync(string payload, IReadOnlyDictionary<string, string> headers, CancellationToken ct = default)
        => Task.FromResult(new PaymentWebhookResult(Handled: false));
}
