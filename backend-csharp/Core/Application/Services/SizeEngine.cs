using System.Globalization;
using Gardrop.Core.Domain.Enums;

namespace Gardrop.Core.Application.Services;

/// <summary>
/// AI ölçü tövsiyə mühərriki.
/// Prinsip: istifadəçinin bədəni BİR DƏFƏ kanonik şkalada hesablanır (0=XS … 6=3XL),
/// sonra məhsulun ölçü SİSTEMİNƏ proyeksiya olunur (INT hərf / TR rəqəm / ayaqqabı EU)
/// və məhsulun mövcud ölçülərinə yapışdırılır. Kəsim, parça elastikliyi və istifadəçinin
/// sevdiyi oturuş düzəliş kimi tətbiq olunur. Nəticə zəngin formada qaytarılır:
/// tövsiyə + alternativ ölçü + güvən % + gözlənilən oturuş + səbəblər + risklər.
/// Frontend portu: gardrop.html → recommendSize() (eyni bantlar, eyni qaydalar).
/// </summary>
public class SizeEngine : ISizeRecommender
{
    private static readonly string[] Order = { "XS", "S", "M", "L", "XL", "XXL", "3XL" };

    // ── Ölçü düzəliş sabitləri (vahid = Order indeksi; +1.0 ≈ bir ölçü böyük) ──
    // Əvvəllər kod boyu səpələnmiş "sehrli rəqəmlər" — burada tək mənbədə adlandırılır.
    private const double NeutralBaseIndex = 2.0;        // ölçü yalnız quruluşdan gəldikdə baza (≈M)
    private const double SecondMeasureBand = 0.5;       // ikinci ölçü bundan çox böyükdürsə ölçü qaldırılır
    private const double AgeBiasOver45 = 0.25;          // 45+ yaşda rahatlığa meyl
    private const double CoatComfortMargin = 0.3;       // palto alt geyim üstündən geyilir
    private const double WideShoulderJacketBump = 0.25; // geniş çiyin + pencək
    private const double BorderlineThreshold = 0.33;    // iki ölçü arasında "sərhəd" həssaslığı

    // Məhsul/brend kəsim davranışı
    private const double RunsSmallBump = 0.5;
    private const double RunsLargeBump = -0.5;
    private const double OversizeBehaviorBump = -0.6;

    // FitAdjustment — kəsim növü
    private const double SlimCutBump = 0.5;
    private const double RelaxedCutBump = -0.2;
    private const double OversizeCutBump = -0.5;
    // FitAdjustment — parça elastikliyi
    private const double NoStretchBump = 0.3;
    private const double LowStretchBump = 0.15;
    private const double HighStretchBump = -0.2;
    // FitAdjustment — istifadəçinin sevdiyi oturuş
    private const double PrefSlimBump = -0.3;
    private const double PrefRelaxedBump = 0.4;
    private const double PrefOversizeBump = 0.8;

    // INT standartı — cinsiyyətə görə bədən ölçü bantları (min, max) sm.
    private static readonly (double Min, double Max)[] WomenChest = { (78, 82), (82, 86), (86, 92), (92, 98), (98, 104), (104, 112), (112, 122) };
    private static readonly (double Min, double Max)[] WomenWaist = { (60, 64), (64, 68), (68, 74), (74, 80), (80, 86), (86, 94), (94, 104) };
    private static readonly (double Min, double Max)[] MenChest   = { (82, 88), (88, 94), (94, 100), (100, 106), (106, 112), (112, 118), (118, 128) };
    private static readonly (double Min, double Max)[] MenWaist   = { (70, 76), (76, 82), (82, 88), (88, 94), (94, 100), (100, 108), (108, 118) };

    private static readonly (double Min, double Max)[] WomenHip = { (86, 90), (90, 94), (94, 100), (100, 106), (106, 114), (114, 124), (124, 136) };
    private static readonly (double Min, double Max)[] MenHip   = { (88, 92), (92, 98), (98, 104), (104, 110), (110, 118), (118, 128), (128, 140) };

    // Kateqoriya qrupları — ölçü qaydası bunlara görə dəyişir
    private static readonly string[] BottomSubcats = { "Şalvar", "Şort", "Ətək", "Cins", "Tayt", "Leqqins", "Leggings" };
    private static readonly string[] JacketSubcats = { "Pencək", "Blazer", "Jaket", "Gödəkçə", "Kostyum" };
    private static readonly string[] CoatSubcats   = { "Palto", "Trenç", "Plaş", "Kürk" };

    // ── Marka əsaslı ölçü profilləri ──
    // Açar: normallaşdırılmış marka adı (kiçik hərf, boşluq/işarələr atılmış). Dəyər: kəsim davranışı.
    // Yalnız məhsulun öz SizeBehavior-u "Standard" olduqda tətbiq olunur (mağaza qeydi üstündür).
    private static readonly Dictionary<string, string> BrandProfiles = new()
    {
        // Inditex qrupu — adətən kiçik kəsilir
        ["zara"] = "RunsSmall", ["bershka"] = "RunsSmall", ["pullbear"] = "RunsSmall",
        ["stradivarius"] = "RunsSmall", ["massimodutti"] = "RunsSmall", ["oysho"] = "RunsSmall",
        // Digər fast-fashion
        ["mango"] = "RunsSmall", ["hm"] = "RunsSmall", ["asos"] = "RunsSmall",
        ["levis"] = "RunsSmall", ["pingo"] = "RunsSmall",
        // Türk markaları
        ["lcwaikiki"] = "Standard", ["lcw"] = "Standard", ["defacto"] = "Standard",
        ["mavi"] = "Standard", ["colins"] = "Standard", ["kigili"] = "Standard",
        ["koton"] = "RunsLarge", ["gap"] = "RunsLarge", ["uspoloassn"] = "RunsLarge",
        // İdman / digər
        ["nike"] = "Standard", ["adidas"] = "Standard", ["puma"] = "Standard",
    };

    private static string BrandBehavior(string? brand)
    {
        if (string.IsNullOrWhiteSpace(brand)) return "Standard";
        var key = new string(brand.ToLowerInvariant().Where(char.IsLetterOrDigit).ToArray());
        return BrandProfiles.TryGetValue(key, out var b) ? b : "Standard";
    }

    public object Recommend(User user, Product product) =>
        product.Category == "Ayaqqabı"
            ? RecommendShoe(user, product)
            : RecommendClothing(user, product);

    // ── Vahid nəticə forması (lowercase JSON adları — frontend ilə uyğun) ──
    private static object Result(string size, string? alternative, int accuracy, bool measured,
        string message, string fit, List<string> reasons, List<string> risks, string system, bool available,
        bool fits = true, List<string>? factors = null) =>
        new
        {
            size,
            alternative,
            accuracy,
            confidence = accuracy,
            hasMeasurements = measured,
            message,
            fit,
            reasons,
            risks,
            system,
            available,
            fits,   // false = istifadəçinin ölçüsü məhsulun diapazonundan kənardır
            factors = factors ?? new List<string>(),  // hesablamaya təsir edən ölçülər
        };

    // Ölçü etiketinin kanonik indeksi (0=XS … 6=3XL); tapılmazsa -1.
    private static int SizeIndexOf(string label, bool isTr)
    {
        if (isTr) return int.TryParse(label, out var n) ? Math.Clamp((n - 34) / 2, 0, Order.Length - 1) : -1;
        return Array.IndexOf(Order, label);
    }

    // ── Geyim ──
    private static object RecommendClothing(User user, Product product)
    {
        var sizes = product.Sizes.Count > 0 ? product.Sizes : new List<string> { "S", "M", "L", "XL", "XXL" };
        var sys = (product.SizeSystem ?? "INT").Trim().ToUpperInvariant();
        var isTr = sys == "TR";
        var isCustom = sys != "TR" && sys != "INT";
        var system = isCustom ? (product.SizeSystem ?? "Custom") : (isTr ? "TR" : "INT");

        var qadin = product.Gender == Gender.Female
            || (product.Gender != Gender.Male && user.Gender == Gender.Female);

        // Cinsiyyət uyğunsuzluğu — qadın geyimi kişiyə (və ya əksinə) uyğun gəlmir
        if ((product.Gender == Gender.Female && user.Gender == Gender.Male)
         || (product.Gender == Gender.Male && user.Gender == Gender.Female))
            return Result("—", null, 0, true, $"Bu geyim {CatalogEnumParsing.GenderToWire(product.Gender)} üçün nəzərdə tutulub — sizə uyğun deyil.",
                "", new(), new(), system, false, fits: false);

        // Mağazanın öz ölçü cədvəli (Custom) — boy/çəkini cədvələ uyğunlaşdırırıq
        if (isCustom) return RecommendCustom(user, product, sizes, system);

        var sub = product.Subcategory ?? "";
        var isBottom = BottomSubcats.Contains(sub);
        var isJacket = JacketSubcats.Contains(sub);
        var isCoat = CoatSubcats.Contains(sub);
        var isJeans = string.Equals(sub, "Cins", StringComparison.OrdinalIgnoreCase);

        var chestBands = qadin ? WomenChest : MenChest;
        var waistBands = qadin ? WomenWaist : MenWaist;
        var hipBands   = qadin ? WomenHip : MenHip;

        double height = user.Height ?? 0, weight = user.Weight ?? 0;
        double chest = user.Chest ?? 0, waist = user.Waist ?? 0, hip = user.Hip ?? 0;

        double idx; string basis; var raised = false;

        // 1) İndeks: dəqiq sm üstündür, sonra çəki + boy + quruluş ──
        if (chest > 0 || waist > 0 || hip > 0)
        {
            double? ci = chest > 0 ? BandFloat(chest, chestBands) : null;
            double? wi = waist > 0 ? BandFloat(waist, waistBands) : null;
            double? hi = hip   > 0 ? BandFloat(hip, hipBands) : null;

            if (isBottom)
            {
                // Alt geyim: bel + omba (qadında omba xüsusən önəmli)
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
            // Quruluş seçimləri — kateqoriyaya görə uyğun olanlar əsasdır
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
                return Result(product.Size, null, 58, false,
                    "Ölçü tövsiyəsi üçün boy, çəki və ya bədən quruluşunuzu profilinizdə qeyd edin.",
                    ExpectedFit(product, user), new(), new(), system, true);
        }

        // 2) Kateqoriya rahatlıq payı + kəsim/parça/oturuş düzəlişləri ──
        if (isCoat) idx += CoatComfortMargin;  // palto alt geyim üstündən geyilir → əlavə rahatlıq
        if (isJacket && string.Equals(user.ChestFit, "geniş", StringComparison.OrdinalIgnoreCase)) idx += WideShoulderJacketBump;  // pencək çiyin əsaslı

        // Ölçü davranışı: məhsul səviyyəsi (mağaza qeyd edib) üstündür; yoxdursa marka profili tətbiq olunur.
        var productBehavior = product.SizeBehavior ?? "Standard";
        var brandBehavior = BrandBehavior(product.Brand);
        var fromBrand = string.Equals(productBehavior, "Standard", StringComparison.OrdinalIgnoreCase)
                        && !string.Equals(brandBehavior, "Standard", StringComparison.OrdinalIgnoreCase);
        var behavior = fromBrand ? brandBehavior : productBehavior;
        if (string.Equals(behavior, "RunsSmall", StringComparison.OrdinalIgnoreCase)) idx += RunsSmallBump;
        else if (string.Equals(behavior, "RunsLarge", StringComparison.OrdinalIgnoreCase)) idx += RunsLargeBump;
        else if (string.Equals(behavior, "Oversize", StringComparison.OrdinalIgnoreCase)) idx += OversizeBehaviorBump;

        var (adj, fitReasons) = FitAdjustment(product, user);
        var clamped = Math.Clamp(idx + adj, 0, Order.Length - 1);

        var idxRounded = Math.Clamp((int)Math.Round(clamped, MidpointRounding.AwayFromZero), 0, Order.Length - 1);
        var borderline = Math.Abs(clamped - idxRounded) > BorderlineThreshold;

        var recommended = ProjectToSystem(idxRounded, sizes, isTr);
        var idealLabel = isTr ? (34 + 2 * idxRounded).ToString() : Order[idxRounded];
        var available = sizes.Contains(idealLabel);
        var alternative = Alternative(idxRounded, clamped, sizes, isTr, recommended);

        // 3) Confidence — mövcud məlumat miqdarına görə (çox məlumat → yüksək güvən) ──
        var structureCount = new[] { user.ChestFit, user.WaistFit, user.BellyFit, user.HipFit }.Count(s => !string.IsNullOrEmpty(s));
        var conf = 42;
        if (height > 0) conf += 8;
        if (weight > 0) conf += 16;
        if (chest > 0) conf += 12;
        if (waist > 0) conf += 12;
        if (hip > 0) conf += 8;
        if (structureCount > 0) conf += 6 + 2 * Math.Min(structureCount, 3);
        if ((user.Age ?? 0) > 0) conf += 3;
        conf += 4;  // məhsulun ölçü sistemi məlumdur (INT/TR)
        if (raised) conf -= 4;
        if (borderline) conf -= 6;
        if (string.Equals(product.Stretch, "none", StringComparison.OrdinalIgnoreCase) && borderline) conf -= 3;
        if (!available) conf -= 5;
        conf = Math.Clamp(conf, 45, 98);

        // 4) Səbəblər + risklər + oturuş ──
        var reasons = new List<string> { $"{(isTr ? "Rəqəm" : "INT hərf")} sistemi üzrə {basis} əsasında hesablandı." };
        if (raised) reasons.Add("İkinci ölçünüz bir bant böyük olduğundan rahatlıq üçün ölçü qaldırıldı.");
        if (isCoat) reasons.Add("Palto alt geyim üstündən geyildiyinə görə əlavə rahatlıq payı saxlanıldı.");
        if (isJeans) reasons.Add("Cins şalvar: bel + omba və parça elastikliyi nəzərə alındı.");
        var bSrc = fromBrand ? $"{product.Brand.Trim()} markası" : "Bu məhsul";
        if (string.Equals(behavior, "RunsSmall", StringComparison.OrdinalIgnoreCase)) reasons.Add($"{bSrc} kiçik kəsilir (runs small) — bir ölçü böyük tövsiyə olundu.");
        else if (string.Equals(behavior, "RunsLarge", StringComparison.OrdinalIgnoreCase)) reasons.Add($"{bSrc} böyük kəsilir (runs large) — bir ölçü kiçik tövsiyə olundu.");
        else if (string.Equals(behavior, "Oversize", StringComparison.OrdinalIgnoreCase)) reasons.Add($"{bSrc} oversize dizaynıdır — lazımsız böyütmə edilmədi.");
        reasons.AddRange(fitReasons);
        reasons.Add($"{recommended} ən balanslı nəticəni verir.");

        var sizeIdxs = sizes.Select(s => SizeIndexOf(s, isTr)).Where(i => i >= 0).ToList();
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

        return Result(recommended, outOfRange ? null : alternative, conf, true, message,
            ExpectedFit(product, user), reasons, risks, system, available, fits: !outOfRange, factors: factors);
    }

    // ── Mağazanın öz ölçü cədvəli (Custom Size System) ──
    private static object RecommendCustom(User user, Product product, List<string> sizes, string system)
    {
        var chart = product.SizeChart;
        if (chart == null || chart.Count == 0)
            return Result(sizes.FirstOrDefault() ?? product.Size, null, 50, false,
                "Bu mağaza öz ölçü sistemindən istifadə edir — dəqiq ölçü üçün məhsulun ölçü cədvəlinə baxın.",
                "", new(), new(), system, true);

        double boy = user.Height ?? 0, ceki = user.Weight ?? 0;
        if (boy <= 0 && ceki <= 0)
            return Result(sizes.FirstOrDefault() ?? product.Size, null, 50, false,
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
            return Result("—", null, 60, true,
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

        return Result(row.Size, null, conf, true,
            $"Mağazanın ölçü cədvəlinə görə sizə {row.Size} uyğun gəlir.",
            "Mağaza cədvəlinə görə", reasons, risks, system, available, fits: true, factors: factors);
    }

    // ── Ayaqqabı: istifadəçi EU ölçüsünü birbaşa bilir ──
    private static object RecommendShoe(User user, Product product)
    {
        var sizes = product.Sizes;
        var eu = user.ShoeSize ?? 0;
        var system = string.Equals(product.SizeSystem, "INT", StringComparison.OrdinalIgnoreCase) ? "INT" : "EU";

        if (eu <= 0)
            return Result(product.Size, null, 58, false,
                "Ayaqqabı ölçünüzü (məs. 42) profilinizdə qeyd edin.",
                "Standart oturuş", new List<string>(), new List<string>(), system, true);

        var snap = SnapNumeric(eu, sizes);
        if (snap is null)
            return Result(eu.ToString(), null, 90, true, $"Sizin ölçünüz: {eu}.", "Standart oturuş",
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

        var alt = AltNumeric(eu, sizes, snap);
        return Result(snap, alt, conf, true,
            diff == 0 ? $"Sizin ölçünüz {eu} — mövcuddur." : $"Ölçünüz {eu}, ən yaxın mövcud {snap}.",
            "Standart oturuş", reasons, risks, system, available);
    }

    // ─────────────────────────  Köməkçilər  ─────────────────────────

    // idx (0..6) → həmin sistemdə ideal etiket, sonra mövcud ölçülərə yapışdır
    private static string ProjectToSystem(int idx, List<string> sizes, bool isTr)
    {
        idx = Math.Clamp(idx, 0, Order.Length - 1);
        if (isTr)
        {
            var ideal = 34 + 2 * idx;                 // TR geyim: 34=XS, 36=S … 46=3XL
            var snap = SnapNumeric(ideal, sizes);
            if (snap is not null) return snap;
        }
        return FitToAvailable(Order[idx], sizes);
    }

    // Alternativ ölçü — fraksiyanın istiqamətinə (yoxsa rahatlıq üçün böyüyə) doğru qonşu
    private static string? Alternative(int idx, double clamped, List<string> sizes, bool isTr, string recommended)
    {
        var dir = (clamped - idx) >= 0 ? 1 : -1;
        foreach (var d in new[] { dir, -dir })
        {
            var alt = ProjectToSystem(idx + d, sizes, isTr);
            if (alt != recommended) return alt;
        }
        return null;
    }

    // Rəqəm sistemində ideal dəyərə ən yaxın mövcud ölçü (bərabər məsafədə böyüyə üstünlük)
    private static string? SnapNumeric(double ideal, List<string> sizes)
    {
        var nums = sizes
            .Select(s => (s, ok: double.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var n), n))
            .Where(x => x.ok)
            .ToList();
        if (nums.Count == 0) return null;
        return nums.OrderBy(x => Math.Abs(x.n - ideal)).ThenByDescending(x => x.n).First().s;
    }

    // Rəqəm sistemində alternativ — bir böyük (yoxsa bir kiçik) mövcud ölçü
    private static string? AltNumeric(double ideal, List<string> sizes, string current)
    {
        var nums = sizes
            .Select(s => (s, ok: double.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var n), n))
            .Where(x => x.ok && x.s != current)
            .ToList();
        if (nums.Count == 0) return null;
        var up = nums.Where(x => x.n > ideal).OrderBy(x => x.n).Select(x => (string?)x.s).FirstOrDefault();
        return up ?? nums.OrderByDescending(x => x.n).Select(x => (string?)x.s).FirstOrDefault();
    }

    // Bədən ölçüsü (sm) → bant indeksi (float, bant daxili mövqe ilə)
    private static double BandFloat(double v, (double Min, double Max)[] bands)
    {
        if (v < bands[0].Min) return 0;
        for (var i = 0; i < bands.Length; i++)
            if (v < bands[i].Max)
            {
                var (min, max) = bands[i];
                var f = max > min ? (v - min) / (max - min) : 0;
                return i + Math.Clamp(f, 0, 0.999);
            }
        return bands.Length - 1;
    }

    // Kəsim + parça + sevdiyi oturuş → fraksional ölçü düzəlişi + səbəblər
    private static (double adj, List<string> reasons) FitAdjustment(Product p, User u)
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

    // Gözlənilən oturuş mətni
    private static string ExpectedFit(Product p, User u)
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

    // Risklər
    private static List<string> Risks(Product p, User u, bool isBottom, bool borderline, bool available)
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

        // Mağaza qeyd edibsə — yuyulmada yığılma
        if (p.WashShrink)
            risks.Add("Mağaza qeyd edib: ilk yuyulmadan sonra cüzi yığılma mümkündür.");

        // Boy əsaslı uzunluq / qol riskləri
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

    // quruluş → düzəliş dəyəri
    private static int FitVal(string? f) => (f ?? "").ToLowerInvariant() switch { "dar" => -1, "geniş" => 1, _ => 0 };

    // çiyin + bel + qarın quruluşunun mətn təsviri
    private static string FitLabel(string? dos, string? bel, string? qarin = null, string? omba = null)
    {
        var parts = new List<string>();
        if (!string.IsNullOrEmpty(dos)) parts.Add($"çiyin {dos.ToLowerInvariant()}");
        if (!string.IsNullOrEmpty(bel)) parts.Add($"bel {bel.ToLowerInvariant()}");
        if (!string.IsNullOrEmpty(omba)) parts.Add($"omba {omba.ToLowerInvariant()}");
        if (!string.IsNullOrEmpty(qarin)) parts.Add($"qarın {qarin.ToLowerInvariant()}");
        return string.Join(", ", parts);
    }

    // Çəki + boy + cinsiyyət → Order indeksi (float). Eyni çəkidə hündür bədən daha incədir → kiçik ölçü.
    private static double WeightToIndex(double w, double heightCm, bool qadin)
    {
        double idx = qadin ? (w < 55 ? 1 : w < 65 ? 2 : w < 77 ? 3 : w < 90 ? 4 : 5)
                           : (w < 60 ? 1 : w < 72 ? 2 : w < 85 ? 3 : w < 100 ? 4 : 5);
        if (heightCm > 0)
        {
            double refH = qadin ? 165 : 175;
            idx += Math.Clamp((refH - heightCm) / 14.0, -1.0, 1.0);  // hündür → −, qısa → +
        }
        return idx;
    }

    // İstənilən INT ölçünü məhsulun mövcud ölçülərinə uyğunlaşdır (yoxdursa ən yaxın indeks)
    private static string FitToAvailable(string desired, List<string> sizes)
    {
        if (sizes.Contains(desired)) return desired;
        var di = Array.IndexOf(Order, desired);
        if (di < 0) return sizes.FirstOrDefault() ?? desired;
        var best = sizes
            .Select(s => new { s, idx = Array.IndexOf(Order, s) })
            .Where(x => x.idx >= 0)
            .OrderBy(x => Math.Abs(x.idx - di))
            .FirstOrDefault();
        return best?.s ?? sizes.FirstOrDefault() ?? desired;
    }
}
