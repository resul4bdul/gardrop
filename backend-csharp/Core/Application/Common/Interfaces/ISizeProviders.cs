using Gardrop.Core.Application.Common.DTOs;
using Gardrop.Core.Domain.Enums;

namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>
/// Ölçü cədvəli mənbəyi — kateqoriya/cinsiyyət/brendə görə bədən ölçü bantları (min–max sm).
/// Hazırda static (EN 13402 / TR); gələcəkdə DB-dən oxuyan impl ilə əvəzlənə bilər (drop-in).
/// </summary>
public interface ISizeChartProvider
{
    /// <summary>Kanonik ölçü bantları (0=XS … 6=3XL). Sinə/bel/omba min–max sm.</summary>
    IReadOnlyList<SizeChartBandDto> GetBands(string category, Gender gender, string? brand);
}

/// <summary>Brend kəsim davranışı mənbəyi — "Standard"/"RunsSmall"/"RunsLarge"/"Oversize".</summary>
public interface IBrandBehaviorProvider
{
    string GetBehavior(string? brand);
}

/// <summary>
/// Bir ölçü-tövsiyə strategiyası (Strategy pattern). Hər strategiya bir məhsul tipini idarə edir
/// (geyim / ayaqqabı / mağazanın öz cədvəli). Nəticə frontend-in gözlədiyi eyni anonim formadır.
/// </summary>
public interface ISizeRecommenderStrategy
{
    /// <summary>Bu strategiya verilən məhsula uyğundurmu?</summary>
    bool CanHandle(ProductSizeDto product);
    object Recommend(UserSizeDto user, ProductSizeDto product);
}
