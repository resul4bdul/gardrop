using System.Globalization;
using Gardrop.Core.Application.Common.DTOs;
using Gardrop.Core.Application.Common.Interfaces;

namespace Gardrop.Core.Application.Services;

/// <summary>Ayaqqabı: istifadəçi EU ölçüsünü birbaşa bilir → mövcud ölçülərə yapışdırılır.</summary>
public sealed class ShoeSizeStrategy : ISizeRecommenderStrategy
{
    public bool CanHandle(ProductSizeDto product) => product.Category == "Ayaqqabı";

    public object Recommend(UserSizeDto user, ProductSizeDto product)
    {
        var sizes = product.Sizes;
        var eu = user.ShoeSize ?? 0;
        var system = string.Equals(product.SizeSystem, "INT", StringComparison.OrdinalIgnoreCase) ? "INT" : "EU";

        if (eu <= 0)
            return SizeMath.Result(product.Size ?? "", null, 58, false,
                "Ayaqqabı ölçünüzü (məs. 42) profilinizdə qeyd edin.",
                "Standart oturuş", new List<string>(), new List<string>(), system, true);

        var snap = SizeMath.SnapNumeric(eu, sizes);
        if (snap is null)
            return SizeMath.Result(eu.ToString(), null, 90, true, $"Sizin ölçünüz: {eu}.", "Standart oturuş",
                new List<string> { $"Profil ayaqqabı ölçünüz EU {eu}." }, new List<string>(), system, true);

        var n = double.Parse(snap, CultureInfo.InvariantCulture);
        var diff = Math.Abs(n - eu);
        var conf = (int)Math.Clamp(99 - diff * 7, 75, 99);
        var available = sizes.Contains(eu.ToString());

        var reasons = new List<string>
        {
            diff == 0
                ? $"Profil ölçünüz EU {eu} bu məhsulda mövcuddur."
                : $"Profil ölçünüz EU {eu}, ən yaxın mövcud ölçü {snap}.",
        };
        var risks = new List<string>();
        if (!available) risks.Add($"Dəqiq ölçünüz ({eu}) stokda yoxdur — ən yaxını {snap} seçildi.");
        if ((product.Material ?? "").ToLowerInvariant().Contains("dəri"))
            risks.Add("Təbii dəri vaxtla bir az genişlənir — ölçüsündə qalsanız ideal olar.");

        var alt = SizeMath.AltNumeric(eu, sizes, snap);
        return SizeMath.Result(snap, alt, conf, true,
            diff == 0 ? $"Sizin ölçünüz {eu} — mövcuddur." : $"Ölçünüz {eu}, ən yaxın mövcud {snap}.",
            "Standart oturuş", reasons, risks, system, available);
    }
}
