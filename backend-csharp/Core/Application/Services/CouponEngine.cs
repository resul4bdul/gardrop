using Gardrop.Core.Domain.Enums;

namespace Gardrop.Core.Application.Services;

public class CouponEngine : ICouponService
{
    /// <summary>Kuponu səbət cəminə görə qiymətləndirir və endirim məbləğini (₼) qaytarır.</summary>
    public CouponResult Evaluate(Coupon? c, decimal subtotal)
    {
        if (c is null) return new(false, "Kupon tapılmadı", 0);
        if (!c.Active) return new(false, "Kupon deaktivdir", 0);
        if (c.ExpiresAt is { } exp && exp < DateTime.UtcNow) return new(false, "Kuponun vaxtı bitib", 0);
        if (c.MaxUses is { } max && c.Used >= max) return new(false, "Kupon istifadə limitinə çatıb", 0);
        if (subtotal < c.MinOrder)
            return new(false, $"Bu kupon {c.MinOrder:0.##} ₼-dən yuxarı sifarişlərdə işləyir", 0);

        decimal discount = c.Type == CouponType.percent
            ? Math.Round(subtotal * Math.Clamp(c.Value, 0, 100) / 100m, 2)
            : Math.Min(c.Value, subtotal);

        discount = Math.Max(0, Math.Round(discount, 2));
        return new(true, null, discount);
    }
}
