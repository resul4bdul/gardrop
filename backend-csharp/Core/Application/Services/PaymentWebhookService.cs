using Gardrop.Core.Application.Common.Interfaces;
using Gardrop.Core.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Core.Application.Services;

/// <summary>Şlüz webhook-unu sifariş ödəniş vəziyyətinə tətbiq edir (intent id ilə eşləyir). Bax A.1.</summary>
public class PaymentWebhookService : IPaymentWebhookService
{
    private readonly IAppDbContext _db;
    private readonly IPaymentService _payment;
    public PaymentWebhookService(IAppDbContext db, IPaymentService payment) { _db = db; _payment = payment; }

    public async Task<bool> HandleAsync(string payload, IReadOnlyDictionary<string, string> headers, CancellationToken ct = default)
    {
        var ev = await _payment.HandleWebhookAsync(payload, headers, ct);
        if (!ev.Handled || string.IsNullOrEmpty(ev.IntentId)) return ev.Handled;

        var order = await _db.Orders.FirstOrDefaultAsync(o => o.PaymentIntentId == ev.IntentId, ct);
        if (order is null) return true;   // bizə aid event, amma sifariş tapılmadı (idempotent yox-op)

        switch (ev.Status)
        {
            case PaymentStatus.Paid:
                if (order.PaymentStatus != PaymentStatus.Paid)
                {
                    order.PaymentStatus = PaymentStatus.Paid;
                    order.PaidAt ??= DateTime.UtcNow;
                }
                break;
            case PaymentStatus.Failed:
                order.PaymentStatus = PaymentStatus.Failed;
                break;
            case PaymentStatus.Refunded:
                order.PaymentStatus = PaymentStatus.Refunded;
                break;
        }
        await _db.SaveChangesAsync(ct);
        return true;
    }
}
