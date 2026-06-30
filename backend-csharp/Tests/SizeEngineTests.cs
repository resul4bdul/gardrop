using Gardrop.Core.Domain.Models;
using Gardrop.Core.Domain.Enums;
using Gardrop.Core.Application.Services;

namespace Gardrop.Tests;

public class SizeEngineTests
{
    private readonly SizeEngine _sut = new();

    // Nəticə anonim obyektdir — sahələri reflection ilə oxuyuruq.
    private static T Get<T>(object o, string name) => (T)o.GetType().GetProperty(name)!.GetValue(o)!;

    [Fact]
    public void Shoe_exact_size_is_recommended_and_available()
    {
        var user = new User { ShoeSize = 42 };
        var product = new Product { Category = "Ayaqqabı", SizeSystem = "EU", Sizes = new() { "40", "41", "42", "43" } };

        var r = _sut.Recommend(user, product);

        Assert.Equal("42", Get<string>(r, "size"));
        Assert.True(Get<bool>(r, "available"));
        Assert.True(Get<bool>(r, "fits"));
    }

    [Fact]
    public void Shoe_snaps_to_nearest_available_size()
    {
        var user = new User { ShoeSize = 42 };
        var product = new Product { Category = "Ayaqqabı", SizeSystem = "EU", Sizes = new() { "40", "44" } };

        var r = _sut.Recommend(user, product);

        // 42 yoxdur → ən yaxın (bərabər məsafədə böyüyə üstünlük) = 44
        Assert.Equal("44", Get<string>(r, "size"));
        Assert.False(Get<bool>(r, "available"));
    }

    [Fact]
    public void Gender_mismatch_reports_not_fitting()
    {
        var user = new User { Gender = Gender.Male, Height = 175, Weight = 70 };
        var product = new Product { Category = "Geyim", Gender = Gender.Female, SizeSystem = "INT", Sizes = new() { "S", "M", "L" } };

        var r = _sut.Recommend(user, product);

        Assert.False(Get<bool>(r, "fits"));
        Assert.False(Get<bool>(r, "available"));
    }

    [Fact]
    public void Missing_measurements_lowers_confidence()
    {
        var user = new User(); // heç bir ölçü yoxdur
        var product = new Product { Category = "Geyim", SizeSystem = "INT", Sizes = new() { "S", "M", "L" } };

        var r = _sut.Recommend(user, product);

        Assert.False(Get<bool>(r, "hasMeasurements"));
    }
}
