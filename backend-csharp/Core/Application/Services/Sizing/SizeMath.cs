using System.Globalization;

namespace Gardrop.Core.Application.Services;

/// <summary>
/// Ölçü strategiyalarının paylaşdığı saf köməkçilər (kanonik şkala, proyeksiya, snap, bant riyaziyyatı)
/// + vahid nəticə forması. JSON açar/tipləri frontend ilə BİT-BİT eynidir — dəyişdirmə.
/// </summary>
internal static class SizeMath
{
    public static readonly string[] Order = { "XS", "S", "M", "L", "XL", "XXL", "3XL" };

    /// <summary>Vahid nəticə forması (lowercase JSON adları — frontend ilə uyğun).</summary>
    public static object Result(string size, string? alternative, int accuracy, bool measured,
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
            fits,
            factors = factors ?? new List<string>(),
        };

    /// <summary>Ölçü etiketinin kanonik indeksi (0=XS … 6=3XL); tapılmazsa -1.</summary>
    public static int SizeIndexOf(string label, bool isTr)
    {
        if (isTr) return int.TryParse(label, out var n) ? Math.Clamp((n - 34) / 2, 0, Order.Length - 1) : -1;
        return Array.IndexOf(Order, label);
    }

    /// <summary>idx (0..6) → həmin sistemdə ideal etiket, sonra mövcud ölçülərə yapışdır.</summary>
    public static string ProjectToSystem(int idx, List<string> sizes, bool isTr)
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

    /// <summary>Alternativ ölçü — fraksiyanın istiqamətinə (yoxsa rahatlıq üçün böyüyə) doğru qonşu.</summary>
    public static string? Alternative(int idx, double clamped, List<string> sizes, bool isTr, string recommended)
    {
        var dir = (clamped - idx) >= 0 ? 1 : -1;
        foreach (var d in new[] { dir, -dir })
        {
            var alt = ProjectToSystem(idx + d, sizes, isTr);
            if (alt != recommended) return alt;
        }
        return null;
    }

    /// <summary>Rəqəm sistemində ideal dəyərə ən yaxın mövcud ölçü (bərabər məsafədə böyüyə üstünlük).</summary>
    public static string? SnapNumeric(double ideal, List<string> sizes)
    {
        var nums = sizes
            .Select(s => (s, ok: double.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var n), n))
            .Where(x => x.ok).ToList();
        if (nums.Count == 0) return null;
        return nums.OrderBy(x => Math.Abs(x.n - ideal)).ThenByDescending(x => x.n).First().s;
    }

    /// <summary>Rəqəm sistemində alternativ — bir böyük (yoxsa bir kiçik) mövcud ölçü.</summary>
    public static string? AltNumeric(double ideal, List<string> sizes, string current)
    {
        var nums = sizes
            .Select(s => (s, ok: double.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var n), n))
            .Where(x => x.ok && x.s != current).ToList();
        if (nums.Count == 0) return null;
        var up = nums.Where(x => x.n > ideal).OrderBy(x => x.n).Select(x => (string?)x.s).FirstOrDefault();
        return up ?? nums.OrderByDescending(x => x.n).Select(x => (string?)x.s).FirstOrDefault();
    }

    /// <summary>Bədən ölçüsü (sm) → bant indeksi (float, bant daxili mövqe ilə).</summary>
    public static double BandFloat(double v, (double Min, double Max)[] bands)
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

    /// <summary>İstənilən INT ölçünü məhsulun mövcud ölçülərinə uyğunlaşdır (yoxdursa ən yaxın indeks).</summary>
    public static string FitToAvailable(string desired, List<string> sizes)
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

    /// <summary>Piecewise-linear interpolyasiya (weight→index düyünləri arasında hamar keçid).</summary>
    public static double Interpolate(double x, (double X, double Y)[] pts)
    {
        if (x <= pts[0].X) return pts[0].Y;
        for (var i = 1; i < pts.Length; i++)
            if (x <= pts[i].X)
            {
                var (x0, y0) = pts[i - 1];
                var (x1, y1) = pts[i];
                var t = x1 > x0 ? (x - x0) / (x1 - x0) : 0;
                return y0 + t * (y1 - y0);
            }
        return pts[^1].Y;
    }
}
