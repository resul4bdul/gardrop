using Gardrop.Core.Application.Common;

namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>Checkout köməkçiləri: kupon yoxlama + çatdırılma xərci (bax menfiler D1/D2).</summary>
public interface ICheckoutService
{
    Task<OpResult> ValidateCouponAsync(CouponCheckDto dto, CancellationToken ct = default);
    Task<DeliveryQuoteResult> DeliveryQuoteAsync(long userId, DeliveryQuoteDto dto, CancellationToken ct = default);
}
