using Gardrop.Core.Domain.Models;
using Gardrop.Core.Application.Services;

namespace Gardrop.Tests;

public class DeliveryEngineTests
{
    private readonly DeliveryEngine _sut = new();

    [Fact]
    public void Same_point_distance_is_zero()
    {
        Assert.Equal(0, DeliveryEngine.DistanceKm(40.4, 49.8, 40.4, 49.8), 6);
    }

    [Fact]
    public void RawFee_uses_near_then_far_tariff()
    {
        // 5 km × 0.60 = 3.0; +5 km × 0.50 = 2.5 → 5.5
        Assert.Equal(5.5, DeliveryEngine.RawFeeForDistance(10), 2);
    }

    [Fact]
    public void No_coordinates_yields_base_fee()
    {
        var stores = new[] { new Store { Id = 1, Name = "A" } };
        var q = _sut.Quote(stores, null, null, subtotal: 50);
        Assert.Equal(DeliveryEngine.BaseFee, q.StandardFee);
        Assert.Null(q.Km);
    }

    [Fact]
    public void Standard_fee_is_clamped_to_cap()
    {
        // Çox uzaq mağaza → cap (10 ₼)
        var stores = new[] { new Store { Id = 1, Name = "A", Lat = 41.0, Lng = 50.0 } };
        var q = _sut.Quote(stores, 40.0, 49.0, subtotal: 50);
        Assert.Equal(DeliveryEngine.StandardCap, q.StandardFee);
    }

    [Fact]
    public void Free_over_threshold_makes_standard_zero()
    {
        var stores = new[] { new Store { Id = 1, Name = "A", Lat = 40.41, Lng = 49.81 } };
        var q = _sut.Quote(stores, 40.40, 49.80, subtotal: 250);
        Assert.True(q.Free);
        Assert.Equal(0m, q.StandardFee);
    }

    [Fact]
    public void Express_adds_surcharge_even_when_free()
    {
        var stores = new[] { new Store { Id = 1, Name = "A", Lat = 40.41, Lng = 49.81 } };
        var q = _sut.Quote(stores, 40.40, 49.80, subtotal: 250, express: true);
        Assert.Equal(DeliveryEngine.ExpressSurcharge, q.Total);
    }
}
