using Gardrop.Core.Application.Common.DTOs;

namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>AI ölçü tövsiyə mühərriki (Context/Factory) — məhsula uyğun strategiyanı seçib icra edir.</summary>
public interface ISizeRecommender
{
    /// <summary>Entity ilə (geriyə-uyğun; daxildə DTO-ya proyeksiya olunur).</summary>
    object Recommend(User user, Product product);
    /// <summary>Yüngül DTO ilə (SizeService EF .Select proyeksiyası — ağır entity yüklənmir).</summary>
    object Recommend(UserSizeDto user, ProductSizeDto product);
}
