using Gardrop.Core.Application.Common.DTOs;
using Gardrop.Core.Application.Common.Interfaces;
using Gardrop.Core.Domain.Enums;

namespace Gardrop.Core.Application.Services;

/// <summary>
/// Standart geyim (INT hərf / TR rəqəm). Bədən BİR DƏFƏ kanonik şkalada hesablanır (0=XS…6=3XL),
/// sonra məhsulun sisteminə proyeksiya + mövcud ölçülərə yapışdırılır. Ölçü bantları
/// <see cref="ISizeChartProvider"/>, brend davranışı <see cref="IBrandBehaviorProvider"/>-dən gəlir.
/// </summary>
public sealed class ClothingSizeStrategy : ClothingStrategyBase
{
    private readonly ISizeChartProvider _chart;
    private readonly IBrandBehaviorProvider _brand;
    public ClothingSizeStrategy(ISizeChartProvider chart, IBrandBehaviorProvider brand) { _chart = chart; _brand = brand; }

    public override bool CanHandle(ProductSizeDto product) => !IsShoe(product) && !IsCustomSystem(product);

    // ── Ölçü düzəliş sabitləri (vahid = kanonik indeks; +1.0 ≈ bir ölçü böyük) ──
    private const double NeutralBaseIndex = 2.0;
    private const double SecondMeasureBand = 0.5;
    private const double AgeBiasOver45 = 0.25;
    private const double CoatComfortMargin = 0.3;
    private const double WideShoulderJacketBump = 0.25;
    private const double BorderlineThreshold = 0.33;
    private const double RunsSmallBump = 0.5;
    private const double RunsLargeBump = -0.5;
    private const double OversizeBehaviorBump = -0.6;
    private const double SlimCutBump = 0.5;
    private const double RelaxedCutBump = -0.2;
    private const double OversizeCutBump = -0.5;
    private const double NoStretchBump = 0.3;
    private const double LowStretchBump = 0.15;
    private const double HighStretchBump = -0.2;
    private const double PrefSlimBump = -0.3;
    private const double PrefRelaxedBump = 0.4;
    private const double PrefOversizeBump = 0.8;

    private static readonly string[] BottomSubcats = { "Şalvar", "Şort", "Ətək", "Cins", "Tayt", "Leqqins", "Leggings" };
    private static readonly string[] JacketSubcats = { "Pencək", "Blazer", "Jaket", "Gödəkçə", "Kostyum" };
    private static readonly string[] CoatSubcats = { "Palto", "Trenç", "Plaş", "Kürk" };

    // Çəki→indeks düyünləri (piecewise-linear; köhnə pilləli bantların mərkəzləri → hamar keçid).
    private static readonly (double X, double Y)[] WomenWeightPts = { (50, 1), (60, 2), (71, 3), (83.5, 4), (95, 5) };
    private static readonly (double X, double Y)[] MenWeightPts = { (52, 1), (66, 2), (78.5, 3), (92.5, 4), (105, 5) };

    public override object Recommend(UserSizeDto user, ProductSizeDto product)
    {
        var sizes = product.Sizes.Count > 0 ? product.Sizes : new List<string> { "S", "M", "L", "XL", "XXL" };
        var (_, isTr, _, system) = ResolveSystem(product);

        var mismatch = GenderMismatch(user, product, system);
        if (mismatch is not null) return mismatch;

        var qadin = IsWomenGarment(user, product);

        var sub = product.Subcategory ?? "";
        var isBottom = BottomSubcats.Contains(sub);
        var isJacket = JacketSubcats.Contains(sub);
        var isCoat = CoatSubcats.Contains(sub);
        var isJeans = string.Equals(sub, "Cins", StringComparison.OrdinalIgnoreCase);

        // Bantlar provider-dən (kateqoriya/cinsiyyət/brend).
        var bands = _chart.GetBands(product.Category, qadin ? Gender.Female : Gender.Male, product.Brand);
        var chestBands = bands.Select(b => (b.ChestMin, b.ChestMax)).ToArray();
        var waistBands = bands.Select(b => (b.WaistMin, b.WaistMax)).ToArray();
        var hipBands = bands.Select(b => (b.HipMin, b.HipMax)).ToArray();

        double height = user.Height ?? 0, weight = user.Weight ?? 0;
        double chest = user.Chest ?? 0, waist = user.Waist ?? 0, hip = user.Hip ?? 0;

        double idx; string basis; var raised = false;

        // 1) İndeks: dəqiq sm üstündür, sonra çəki + boy + quruluş.
        if (chest > 0 || waist > 0 || hip > 0)
        {
            double? ci = chest > 0 ? SizeMath.BandFloat(chest, chestBands) : null;
            double? wi = waist > 0 ? SizeMath.BandFloat(waist, waistBands) : null;
            double? hi = hip > 0 ? SizeMath.BandFloat(hip, hipBands) : null;

            if (isBottom)
            {
                idx = (wi ?? hi ?? ci)!.Value;
                var sec = hi ?? wi;
                if (sec.HasValue && sec.Value > idx + SecondMeasureBand) { idx = Math.Max(idx, sec.Value); raised = true; }
                basis = waist > 0 && hip > 0 ? $"bel ({waist:0}) və omba ({hip:0}) sm"
                      : waist > 0 ? $"bel ölçünüz ({waist:0} sm)"
                      : hip > 0 ? $"omba ölçünüz ({hip:0} sm)" : $"sinə ölçünüz ({chest:0} sm)";
            }
            else
            {
                idx = (ci ?? wi ?? hi)!.Value;
                if (wi.HasValue && wi.Value > idx + SecondMeasureBand) { idx += 1; raised = true; }
                basis = chest > 0 ? $"sinə ölçünüz ({chest:0} sm)" : waist > 0 ? $"bel ölçünüz ({waist:0} sm)" : $"omba ölçünüz ({hip:0} sm)";
            }
        }
        else
        {
            var fits = new List<int>();
            void AddFit(string? f) { if (!string.IsNullOrEmpty(f)) fits.Add(FitVal(f)); }
            if (isBottom) { AddFit(user.WaistFit); AddFit(user.HipFit); AddFit(user.BellyFit); }
            else if (isJacket || isCoat) { AddFit(user.ChestFit); }
            else { AddFit(user.ChestFit); AddFit(user.WaistFit); }
            var hasFit = fits.Count > 0;
            var ageBias = (user.Age ?? 0) >= 45 ? AgeBiasOver45 : 0.0;
            var fitAdj = hasFit ? fits.Average() + ageBias : 0.0;
            var structureText = FitLabel(user.ChestFit, user.WaistFit, user.BellyFit, user.HipFit);

            if (weight > 0)
            {
                idx = WeightToIndex(weight, height, qadin) + fitAdj;
                basis = height > 0
                    ? (hasFit ? $"boy ({height:0} sm), çəki ({weight:0} kg) və bədən quruluşu" : $"boy ({height:0} sm) və çəki ({weight:0} kg)")
                    : (hasFit ? $"çəki ({weight:0} kg) və bədən quruluşu" : $"çəki ({weight:0} kg)");
            }
            else if (hasFit) { idx = NeutralBaseIndex + fitAdj; basis = $"bədən quruluşu ({structureText})"; }
            else
                return SizeMath.Result(product.Size ?? "", null, 58, false,
                    "Ölçü tövsiyəsi üçün boy, çəki və ya bədən quruluşunuzu profilinizdə qeyd edin.",
                    ExpectedFit(product, user), new(), new(), system, true);
        }

        // 2) Kateqoriya rahatlıq payı + kəsim/parça/oturuş düzəlişləri.
        if (isCoat) idx += CoatComfortMargin;
        if (isJacket && string.Equals(user.ChestFit, "geniş", StringComparison.OrdinalIgnoreCase)) idx += WideShoulderJacketBump;

        // Ölçü davranışı: məhsul səviyyəsi (mağaza qeydi) üstündür; yoxdursa brend profili.
        var productBehavior = product.SizeBehavior ?? "Standard";
        var brandBehavior = _brand.GetBehavior(product.Brand);
        var fromBrand = string.Equals(productBehavior, "Standard", StringComparison.OrdinalIgnoreCase)
                        && !string.Equals(brandBehavior, "Standard", StringComparison.OrdinalIgnoreCase);
        var behavior = fromBrand ? brandBehavior : productBehavior;
        if (string.Equals(behavior, "RunsSmall", StringComparison.OrdinalIgnoreCase)) idx += RunsSmallBump;
        else if (string.Equals(behavior, "RunsLarge", StringComparison.OrdinalIgnoreCase)) idx += RunsLargeBump;
        else if (string.Equals(behavior, "Oversize", StringComparison.OrdinalIgnoreCase)) idx += OversizeBehaviorBump;

        var (adj, fitReasons) = FitAdjustment(product, user);
        var clamped = Math.Clamp(idx + adj, 0, SizeMath.Order.Length - 1);

        var idxRounded = Math.Clamp((int)Math.Round(clamped, MidpointRounding.AwayFromZero), 0, SizeMath.Order.Length - 1);
        var borderline = Math.Abs(clamped - idxRounded) > BorderlineThreshold;

        var recommended = SizeMath.ProjectToSystem(idxRounded, sizes, isTr);
        var idealLabel = isTr ? (34 + 2 * idxRounded).ToString() : SizeMath.Order[idxRounded];
        var available = sizes.Contains(idealLabel);
        var alternative = SizeMath.Alternative(idxRounded, clamped, sizes, isTr, recommended);

        // 3) Confidence.
        var structureCount = new[] { user.ChestFit, user.WaistFit, user.BellyFit, user.HipFit }.Count(s => !string.IsNullOrEmpty(s));
        var conf = 42;
        if (height > 0) conf += 8;
        if (weight > 0) conf += 16;
        if (chest > 0) conf += 12;
        if (waist > 0) conf += 12;
        if (hip > 0) conf += 8;
        if (structureCount > 0) conf += 6 + 2 * Math.Min(structureCount, 3);
        if ((user.Age ?? 0) > 0) conf += 3;
        conf += 4;
        if (raised) conf -= 4;
        if (borderline) conf -= 6;
        if (string.Equals(product.Stretch, "none", StringComparison.OrdinalIgnoreCase) && borderline) conf -= 3;
        if (!available) conf -= 5;
        conf = Math.Clamp(conf, 45, 98);

        // 4) Səbəblər + risklər + oturuş.
        var reasons = new List<string> { $"{(isTr ? "Rəqəm" : "INT hərf")} sistemi üzrə {basis} əsasında hesablandı." };
        if (raised) reasons.Add("İkinci ölçünüz bir bant böyük olduğundan rahatlıq üçün ölçü qaldırıldı.");
        if (isCoat) reasons.Add("Palto alt geyim üstündən geyildiyinə görə əlavə rahatlıq payı saxlanıldı.");
        if (isJeans) reasons.Add("Cins şalvar: bel + omba və parça elastikliyi nəzərə alındı.");
        var bSrc = fromBrand ? $"{(product.Brand ?? "").Trim()} markası" : "Bu məhsul";
        if (string.Equals(behavior, "RunsSmall", StringComparison.OrdinalIgnoreCase)) reasons.Add($"{bSrc} kiçik kəsilir (runs small) — bir ölçü böyük tövsiyə olundu.");
        else if (string.Equals(behavior, "RunsLarge", StringComparison.OrdinalIgnoreCase)) reasons.Add($"{bSrc} böyük kəsilir (runs large) — bir ölçü kiçik tövsiyə olundu.");
        else if (string.Equals(behavior, "Oversize", StringComparison.OrdinalIgnoreCase)) reasons.Add($"{bSrc} oversize dizaynıdır — lazımsız böyütmə edilmədi.");
        reasons.AddRange(fitReasons);
        reasons.Add($"{recommended} ən balanslı nəticəni verir.");

        var sizeIdxs = sizes.Select(s => SizeMath.SizeIndexOf(s, isTr)).Where(i => i >= 0).ToList();
        var outOfRange = sizeIdxs.Count > 0 && (idxRounded < sizeIdxs.Min() || idxRounded > sizeIdxs.Max());

        var risks = Risks(product, user, isBottom, borderline, available);

        var factors = new List<string>();
        if (height > 0) factors.Add("Boy");
        if (weight > 0) factors.Add("Çəki");
        if (chest > 0) factors.Add("Sinə");
        if (waist > 0) factors.Add("Bel");
        if (hip > 0) factors.Add("Omba");
        if (structureCount > 0) factors.Add("Bədən quruluşu");
        if ((user.Age ?? 0) > 0) factors.Add("Yaş");
        if (factors.Count > 0) reasons.Add($"Hesablamaya təsir edən ölçülər: {string.Join(", ", factors)}.");

        var message = outOfRange
            ? $"Bu məhsulun sizin ölçünüzə uyğun forması yoxdur — bədəninizə {idealLabel} uyğun gəlir, amma satışda yoxdur."
            : (conf < 60
                ? $"{basis} əsasında ilkin tövsiyə {recommended}. Dəqiqlik üçün əlavə ölçü daxil edin."
                : $"{basis} əsasında {recommended} tövsiyə olunur.");

        return SizeMath.Result(recommended, outOfRange ? null : alternative, conf, true, message,
            ExpectedFit(product, user), reasons, risks, system, available, fits: !outOfRange, factors: factors);
    }

    // ── Köməkçilər (yalnız geyim) ──

    // Kəsim + parça + sevdiyi oturuş → fraksional düzəliş + səbəblər.
    private static (double adj, List<string> reasons) FitAdjustment(ProductSizeDto p, UserSizeDto u)
    {
        double adj = 0;
        var reasons = new List<string>();
        var cut = (p.FitType ?? "Regular").ToLowerInvariant();
        var stretch = (p.Stretch ?? "medium").ToLowerInvariant();
        var pref = (u.FitPreference ?? "").ToLowerInvariant();

        switch (cut)
        {
            case "slim": adj += SlimCutBump; reasons.Add("Məhsul slim kəsimdir — rahatlıq üçün bir az böyük meyl edildi."); break;
            case "relaxed": adj += RelaxedCutBump; reasons.Add("Relaxed kəsim onsuz da rahatdır."); break;
            case "oversize": adj += OversizeCutBump; reasons.Add("Oversize kəsim — lazımsız böyütmə edilmədi."); break;
        }
        switch (stretch)
        {
            case "none": adj += NoStretchBump; reasons.Add("Parça elastik deyil — əlavə ehtiyat payı saxlanıldı."); break;
            case "low": adj += LowStretchBump; break;
            case "high": adj += HighStretchBump; reasons.Add("Parça yüksək elastikdir — daha sıx oturuşa imkan var."); break;
        }
        switch (pref)
        {
            case "slim": adj += PrefSlimBump; reasons.Add("Dar (slim) geyinməyi sevdiyiniz nəzərə alındı."); break;
            case "relaxed": adj += PrefRelaxedBump; reasons.Add("Rahat geyinməyi sevdiyiniz nəzərə alındı."); break;
            case "oversize": adj += PrefOversizeBump; reasons.Add("Oversize geyinməyi sevdiyiniz nəzərə alındı."); break;
        }
        return (adj, reasons);
    }

    private static string ExpectedFit(ProductSizeDto p, UserSizeDto u)
    {
        var cut = (p.FitType ?? "Regular").ToLowerInvariant();
        var pref = (u.FitPreference ?? "").ToLowerInvariant();
        var txt = cut switch
        {
            "slim" => "Dar (slim) oturuş",
            "relaxed" => "Sərbəst, rahat oturuş",
            "oversize" => "Geniş, oversize görünüş",
            _ => "Normal, balanslı oturuş",
        };
        if (pref == "slim" && cut != "slim") txt += " — seçiminizə görə bir az daha sıx";
        else if ((pref == "relaxed" || pref == "oversize") && cut is "regular" or "slim") txt += " — seçiminizə görə bir az daha rahat";
        return txt;
    }

    private static List<string> Risks(ProductSizeDto p, UserSizeDto u, bool isBottom, bool borderline, bool available)
    {
        var risks = new List<string>();
        var cut = (p.FitType ?? "Regular").ToLowerInvariant();
        var pref = (u.FitPreference ?? "").ToLowerInvariant();
        var stretch = (p.Stretch ?? "medium").ToLowerInvariant();
        bool Eq(string? a, string b) => string.Equals(a, b, StringComparison.OrdinalIgnoreCase);

        if (!isBottom && Eq(u.ChestFit, "geniş") && cut == "slim")
            risks.Add("Çiyinləriniz geniş olduğundan slim kəsimdə çiyin dar gələ bilər.");
        if (Eq(u.BellyFit, "geniş") && cut != "oversize")
            risks.Add("Qarın hissəsi bir az sıxa bilər.");
        if (isBottom && Eq(u.FootFit, "uzun"))
            risks.Add("Ayaqlarınız uzun olduğundan şalvar boyu qısa qala bilər — uzun (Long) model seçin.");
        if (isBottom && Eq(u.FootFit, "qısa"))
            risks.Add("Ayaqlarınız qısa olduğundan şalvar boyu uzun ola bilər.");
        if (cut == "oversize" || pref == "oversize")
            risks.Add("Məhsul gözlədiyinizdən bol görünə bilər.");
        if (stretch == "none" && borderline)
            risks.Add("Parça elastik olmadığından iki ölçü arasında qalsanız böyüyü seçin.");

        if (p.WashShrink)
            risks.Add("Mağaza qeyd edib: ilk yuyulmadan sonra cüzi yığılma mümkündür.");

        var boy = u.Height ?? 0;
        if (boy > 0)
        {
            var qadinBody = p.Gender == Gender.Female || (p.Gender != Gender.Male && u.Gender == Gender.Female);
            var refH = qadinBody ? 166.0 : 178.0;
            if (boy >= refH + 8)
                risks.Add(isBottom
                    ? "Boyunuz uzundur — şalvar boyu qısa qala bilər (mümkünsə Uzun/Long variant seçin)."
                    : "Boyunuz uzundur — geyimin boyu və qol uzunluğu qısa gələ bilər.");
            else if (boy <= refH - 8)
                risks.Add(isBottom
                    ? "Boyunuz qısadır — şalvar uzun gələ bilər (qısaltma lazım ola bilər)."
                    : "Boyunuz qısadır — geyimin boyu/qolu uzun gələ bilər.");
        }

        if (!available)
            risks.Add("İdeal ölçü stokda yoxdur — ən yaxın mövcud ölçü seçildi.");
        return risks;
    }

    private static int FitVal(string? f) => (f ?? "").ToLowerInvariant() switch { "dar" => -1, "geniş" => 1, _ => 0 };

    private static string FitLabel(string? dos, string? bel, string? qarin = null, string? omba = null)
    {
        var parts = new List<string>();
        if (!string.IsNullOrEmpty(dos)) parts.Add($"çiyin {dos.ToLowerInvariant()}");
        if (!string.IsNullOrEmpty(bel)) parts.Add($"bel {bel.ToLowerInvariant()}");
        if (!string.IsNullOrEmpty(omba)) parts.Add($"omba {omba.ToLowerInvariant()}");
        if (!string.IsNullOrEmpty(qarin)) parts.Add($"qarın {qarin.ToLowerInvariant()}");
        return string.Join(", ", parts);
    }

    // Çəki + boy + cinsiyyət → kanonik indeks. Piecewise-linear (1kg-lıq sıçrayış yoxdur);
    // eyni çəkidə hündür bədən daha incə → kiçik indeks.
    private static double WeightToIndex(double w, double heightCm, bool qadin)
    {
        double idx = SizeMath.Interpolate(w, qadin ? WomenWeightPts : MenWeightPts);
        if (heightCm > 0)
        {
            double refH = qadin ? 165 : 175;
            idx += Math.Clamp((refH - heightCm) / 14.0, -1.0, 1.0);
        }
        return idx;
    }
}
