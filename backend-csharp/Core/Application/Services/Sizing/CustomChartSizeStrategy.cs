using Gardrop.Core.Application.Common.DTOs;

namespace Gardrop.Core.Application.Services;

/// <summary>Mağazanın öz ölçü cədvəli (Custom Size System) — boy/çəkini cədvələ uyğunlaşdırır.</summary>
public sealed class CustomChartSizeStrategy : ClothingStrategyBase
{
    public override bool CanHandle(ProductSizeDto product) => !IsShoe(product) && IsCustomSystem(product);

    public override object Recommend(UserSizeDto user, ProductSizeDto product)
    {
        var sizes = product.Sizes.Count > 0 ? product.Sizes : new List<string> { "S", "M", "L", "XL", "XXL" };
        var (_, _, _, system) = ResolveSystem(product);

        var mismatch = GenderMismatch(user, product, system);
        if (mismatch is not null) return mismatch;

        var chart = product.SizeChart;
        if (chart == null || chart.Count == 0)
            return SizeMath.Result(sizes.FirstOrDefault() ?? product.Size ?? "", null, 50, false,
                "Bu mağaza öz ölçü sistemindən istifadə edir — dəqiq ölçü üçün məhsulun ölçü cədvəlinə baxın.",
                "", new(), new(), system, true);

        double boy = user.Height ?? 0, ceki = user.Weight ?? 0;
        if (boy <= 0 && ceki <= 0)
            return SizeMath.Result(sizes.FirstOrDefault() ?? product.Size ?? "", null, 50, false,
                "Mağazanın ölçü cədvəlinə görə tövsiyə üçün boy və/və ya çəkinizi profilinizdə qeyd edin.",
                "", new(), new(), system, true);

        bool In(double v, double? mn, double? mx) => v > 0 && (mn == null || v >= mn.Value) && (mx == null || v <= mx.Value);

        // Əvvəl həm boy, həm çəki uyğun; sonra yalnız çəki; sonra yalnız boy.
        var row = chart.FirstOrDefault(r => In(ceki, r.CekiMin, r.CekiMax) && In(boy, r.BoyMin, r.BoyMax))
               ?? chart.FirstOrDefault(r => In(ceki, r.CekiMin, r.CekiMax))
               ?? chart.FirstOrDefault(r => In(boy, r.BoyMin, r.BoyMax));

        var factors = new List<string>();
        if (boy > 0) factors.Add("Boy");
        if (ceki > 0) factors.Add("Çəki");

        if (row == null)
            return SizeMath.Result("—", null, 60, true,
                "Mağazanın ölçü cədvəlində sizin boy/çəkinizə uyğun ölçü tapılmadı — bu məhsul sizə uyğun olmaya bilər.",
                "", new(), new() { "Boy/çəkiniz mağazanın cədvəl aralıqlarından kənardır." }, system, available: false, fits: false, factors: factors);

        var available = sizes.Count == 0 || sizes.Contains(row.Size);
        var both = In(ceki, row.CekiMin, row.CekiMax) && In(boy, row.BoyMin, row.BoyMax);
        var conf = both ? 90 : 80;
        if (!available) conf -= 8;

        var reasons = new List<string> { "Mağazanın ölçü cədvəlinə görə hesablandı." };
        if (In(ceki, row.CekiMin, row.CekiMax)) reasons.Add($"Çəkiniz ({ceki:0} kg) → {row.Size}.");
        if (In(boy, row.BoyMin, row.BoyMax)) reasons.Add($"Boyunuz ({boy:0} sm) bu ölçü aralığındadır.");
        if (factors.Count > 0) reasons.Add($"Hesablamaya təsir edən ölçülər: {string.Join(", ", factors)}.");

        var risks = new List<string>();
        if (!available) risks.Add("Bu ölçü hazırda stokda yoxdur.");

        return SizeMath.Result(row.Size, null, conf, true,
            $"Mağazanın ölçü cədvəlinə görə sizə {row.Size} uyğun gəlir.",
            "Mağaza cədvəlinə görə", reasons, risks, system, available, fits: true, factors: factors);
    }
}
