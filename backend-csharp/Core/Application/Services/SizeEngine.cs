using Gardrop.Core.Application.Common.DTOs;
using Gardrop.Core.Application.Common.Interfaces;
using Gardrop.Core.Domain.Models;

namespace Gardrop.Core.Application.Services;

/// <summary>
/// AI ölçü tövsiyə Context/Factory — məhsula uyğun <see cref="ISizeRecommenderStrategy"/> seçib icra edir
/// (Strategy pattern). Strategiyalar DTO üzərində işləyir; ölçü bantları/brend davranışı provider-lərdən.
/// Parametrsiz ctor static provider-lərlə qurur (test/istifadə); DI ctor strategiyaları enjekt edir.
/// Nəticə forması frontend ilə BİT-BİT eynidir.
/// </summary>
public class SizeEngine : ISizeRecommender
{
    private readonly IReadOnlyList<ISizeRecommenderStrategy> _strategies;

    public SizeEngine(IEnumerable<ISizeRecommenderStrategy> strategies) => _strategies = strategies.ToList();

    // Default (static provider-lər) — testlər və DI-siz istifadə üçün.
    public SizeEngine() : this(DefaultStrategies()) { }

    private static IEnumerable<ISizeRecommenderStrategy> DefaultStrategies()
    {
        var chart = new StaticSizeChartProvider();
        var brand = new StaticBrandBehaviorProvider();
        return new ISizeRecommenderStrategy[]
        {
            new ShoeSizeStrategy(),
            new CustomChartSizeStrategy(),
            new ClothingSizeStrategy(chart, brand),
        };
    }

    public object Recommend(User user, Product product) =>
        Recommend(ToUserDto(user), ToProductDto(product));

    public object Recommend(UserSizeDto user, ProductSizeDto product)
    {
        var strategy = _strategies.FirstOrDefault(s => s.CanHandle(product))
            ?? _strategies.OfType<ClothingSizeStrategy>().FirstOrDefault();
        // Heç bir strategiya uyğun deyilsə (nəzəri) — geyim strategiyası fallback.
        return (strategy ?? new ClothingSizeStrategy(new StaticSizeChartProvider(), new StaticBrandBehaviorProvider()))
            .Recommend(user, product);
    }

    // ── Entity → yüngül DTO proyeksiyaları (SizeService EF .Select ilə birbaşa da doldura bilər) ──
    public static UserSizeDto ToUserDto(User u) => new(
        u.Gender, u.Height, u.Weight, u.Chest, u.Waist, u.Hip, u.ShoeSize, u.Age,
        u.ChestFit, u.WaistFit, u.BellyFit, u.HipFit, u.FootFit, u.FitPreference);

    public static ProductSizeDto ToProductDto(Product p) => new(
        p.Category, p.Subcategory, p.Gender, p.SizeSystem, p.Sizes, p.Size,
        p.FitType, p.Stretch, p.SizeBehavior, p.Brand, p.Material, p.WashShrink, p.SizeChart);
}
