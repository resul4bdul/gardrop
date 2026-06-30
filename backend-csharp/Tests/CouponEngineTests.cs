using Gardrop.Core.Domain.Models;
using Gardrop.Core.Domain.Enums;
using Gardrop.Core.Application.Services;

namespace Gardrop.Tests;

public class CouponEngineTests
{
    private readonly CouponEngine _sut = new();

    [Fact]
    public void Null_coupon_fails()
    {
        var r = _sut.Evaluate(null, 100);
        Assert.False(r.Ok);
        Assert.Equal(0m, r.Discount);
    }

    [Fact]
    public void Inactive_coupon_fails()
    {
        var r = _sut.Evaluate(new Coupon { Active = false, Type = CouponType.amount, Value = 10 }, 100);
        Assert.False(r.Ok);
    }

    [Fact]
    public void Expired_coupon_fails()
    {
        var c = new Coupon { Active = true, Type = CouponType.amount, Value = 10, ExpiresAt = DateTime.UtcNow.AddDays(-1) };
        Assert.False(_sut.Evaluate(c, 100).Ok);
    }

    [Fact]
    public void Max_uses_reached_fails()
    {
        var c = new Coupon { Active = true, Type = CouponType.amount, Value = 10, MaxUses = 5, Used = 5 };
        Assert.False(_sut.Evaluate(c, 100).Ok);
    }

    [Fact]
    public void Below_min_order_fails()
    {
        var c = new Coupon { Active = true, Type = CouponType.amount, Value = 10, MinOrder = 50 };
        Assert.False(_sut.Evaluate(c, 40).Ok);
    }

    [Fact]
    public void Percent_discount_is_proportional()
    {
        var c = new Coupon { Active = true, Type = CouponType.percent, Value = 20 };
        var r = _sut.Evaluate(c, 150);
        Assert.True(r.Ok);
        Assert.Equal(30m, r.Discount);
    }

    [Fact]
    public void Percent_is_clamped_to_100()
    {
        var c = new Coupon { Active = true, Type = CouponType.percent, Value = 250 };
        var r = _sut.Evaluate(c, 80);
        Assert.Equal(80m, r.Discount);
    }

    [Fact]
    public void Amount_discount_never_exceeds_subtotal()
    {
        var c = new Coupon { Active = true, Type = CouponType.amount, Value = 100 };
        var r = _sut.Evaluate(c, 60);
        Assert.Equal(60m, r.Discount);
    }
}
