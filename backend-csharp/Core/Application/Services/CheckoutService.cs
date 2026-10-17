using Gardrop.Core.Application.Common;
using Gardrop.Core.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Core.Application.Services;

/// <summary>Checkout köməkçiləri — EF implementasiyası (Scoped).</summary>
public class CheckoutService : ICheckoutService
{
    private readonly IAppDbContext _db;
    private readonly ICouponService _coupon;
    private readonly IDeliveryService _delivery;
    public CheckoutService(IAppDbContext db, ICouponService coupon, IDeliveryService delivery)
    { _db = db; _coupon = coupon; _delivery = delivery; }

    public async Task<OpResult> ValidateCouponAsync(CouponCheckDto dto, CancellationToken ct = default)
    {
        var code = (dto.Code ?? "").Trim().ToUpperInvariant();
        if (code.Length == 0) return OpResult.Fail(400, "Kupon kodu boşdur");

        var coupon = await _db.Coupons.AsNoTracking().FirstOrDefaultAsync(c => c.Code == code, ct);
        var res = _coupon.Evaluate(coupon, dto.Subtotal ?? 0);
        if (!res.Ok) return OpResult.Ok(CouponValidationResult.Invalid(res.Error));

        return OpResult.Ok(new CouponValidationResult
        {
            Valid = true,
            Code = coupon!.Code,
            Type = coupon.Type.ToString(),
            Value = coupon.Value,
            Discount = res.Discount,
        });
    }

    public async Task<DeliveryQuoteResult> DeliveryQuoteAsync(long userId, DeliveryQuoteDto dto, CancellationToken ct = default)
    {
        var storeIds = await (
            from c in _db.CartItems.AsNoTracking().Where(c => c.UserId == userId)
            join p in _db.Products.AsNoTracking() on c.ProductId equals p.Id
            select p.StoreId).Distinct().ToListAsync(ct);

        var stores = await _db.Stores.AsNoTracking().Where(s => storeIds.Contains(s.Id)).ToListAsync(ct);
        var q = _delivery.Quote(stores, dto.Lat, dto.Lng, dto.Subtotal ?? 0, express: false);
        return DeliveryQuoteResult.From(q, multiStore: stores.Count > 1, hasCoords: dto.Lat != null && dto.Lng != null);
    }
}
