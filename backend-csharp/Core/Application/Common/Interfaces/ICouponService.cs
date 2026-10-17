namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>Kupon qiymətləndirmə nəticəsi.</summary>
public record CouponResult(bool Ok, string? Error, decimal Discount);

/// <summary>Kuponu səbət cəminə görə qiymətləndirir və endirim məbləğini (₼) qaytarır.</summary>
public interface ICouponService
{
    CouponResult Evaluate(Coupon? coupon, decimal subtotal);
}
