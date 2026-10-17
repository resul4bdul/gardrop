using Gardrop.Core.Application.Common.DTOs;
using Gardrop.Core.Application.Common.Interfaces;
using Gardrop.Core.Domain.Enums;

namespace Gardrop.Core.Application.Services;

/// <summary>Geyim strategiyalarının ortaq preamble-ı: ölçü sistemi + cinsiyyət uyğunsuzluğu.</summary>
public abstract class ClothingStrategyBase : ISizeRecommenderStrategy
{
    public abstract bool CanHandle(ProductSizeDto product);
    public abstract object Recommend(UserSizeDto user, ProductSizeDto product);

    protected static bool IsShoe(ProductSizeDto p) => p.Category == "Ayaqqabı";

    // Ölçü sistemini həll et → (sys, isTr, isCustom, system-etiketi).
    protected static (string sys, bool isTr, bool isCustom, string system) ResolveSystem(ProductSizeDto p)
    {
        var sys = (p.SizeSystem ?? "INT").Trim().ToUpperInvariant();
        var isTr = sys == "TR";
        var isCustom = sys != "TR" && sys != "INT";
        var system = isCustom ? (p.SizeSystem ?? "Custom") : (isTr ? "TR" : "INT");
        return (sys, isTr, isCustom, system);
    }

    protected static bool IsCustomSystem(ProductSizeDto p) => ResolveSystem(p).isCustom;

    // Məhsul qadın geyimidirmi (məhsul cinsi üstündür, sonra istifadəçi cinsi).
    protected static bool IsWomenGarment(UserSizeDto u, ProductSizeDto p) =>
        p.Gender == Gender.Female || (p.Gender != Gender.Male && u.Gender == Gender.Female);

    // Cinsiyyət uyğunsuzluğu → not-fit nəticəsi (null = uyğundur).
    protected static object? GenderMismatch(UserSizeDto u, ProductSizeDto p, string system)
    {
        if ((p.Gender == Gender.Female && u.Gender == Gender.Male)
         || (p.Gender == Gender.Male && u.Gender == Gender.Female))
            return SizeMath.Result("—", null, 0, true,
                $"Bu geyim {CatalogEnumParsing.GenderToWire(p.Gender)} üçün nəzərdə tutulub — sizə uyğun deyil.",
                "", new(), new(), system, false, fits: false);
        return null;
    }
}
