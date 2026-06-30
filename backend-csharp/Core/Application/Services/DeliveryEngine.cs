
namespace Gardrop.Core.Application.Services;

/// <summary>
/// Çatdırılma xərci mağaza ilə müştəri arasındakı məsafəyə görə hesablanır.
/// Məsafə tarifi: 0–5 km hər km 0.60 ₼ (minimum 3 ₼); 5 km-dən sonra hər km 0.50 ₼.
/// Standart çatdırılma maksimum 10 ₼-də sabitlənir (2–5 iş günü).
/// Ekspress (gün içində) standartın üzərinə +5 ₼.
/// Sifariş 200 ₼-dan yuxarıdırsa standart çatdırılma pulsuzdur.
/// Səbətdə fərqli mağazalar varsa istifadə olunan məsafə =
///   (hər mağazadan müştəriyə olan məsafələrin ortalaması) + (mağazalar arası məsafə).
/// </summary>
public class DeliveryEngine : IDeliveryService
{
    public const double NearPerKm = 0.60;        // 0–5 km hər km
    public const double FarPerKm = 0.50;         // 5 km-dən sonra hər km
    public const double FreeRadiusKm = 5.0;
    public const decimal MinFee = 3.0m;          // standart minimum (₼)
    public const decimal StandardCap = 10.0m;    // standart maksimum (₼)
    public const decimal ExpressSurcharge = 5.0m; // ekspress əlavə (₼)
    public const decimal FreeOverSubtotal = 200.0m;
    public const decimal BaseFee = 3.0m;         // koordinat yoxdursa təxmini baza (₼)

    /// <summary>İki koordinat arasındakı məsafə (km) — Haversine.</summary>
    public static double DistanceKm(double lat1, double lng1, double lat2, double lng2)
    {
        const double R = 6371.0; // Yerin radiusu (km)
        double dLat = Deg2Rad(lat2 - lat1);
        double dLng = Deg2Rad(lng2 - lng1);
        double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2)
                 + Math.Cos(Deg2Rad(lat1)) * Math.Cos(Deg2Rad(lat2))
                 * Math.Sin(dLng / 2) * Math.Sin(dLng / 2);
        return R * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }

    /// <summary>Məsafəyə (km) görə xam çatdırılma xərci (₼) — tarif (0.60 / 0.50), cap-sız.</summary>
    public static double RawFeeForDistance(double km)
    {
        double near = Math.Min(km, FreeRadiusKm) * NearPerKm;
        double far = Math.Max(0, km - FreeRadiusKm) * FarPerKm;
        return Math.Round(near + far, 2);
    }

    private static double Deg2Rad(double d) => d * Math.PI / 180.0;

    /// <summary>
    /// Səbətdəki mağaza(lar)a görə standart + ekspress çatdırılma xərclərini hesablayır.
    /// <paramref name="subtotal"/> 200 ₼-ı keçirsə standart pulsuz olur.
    /// <paramref name="express"/> seçilibsə Total ekspress, əks halda standart olur.
    /// </summary>
    public DeliveryQuote Quote(IEnumerable<Store> stores, double? lat, double? lng,
        decimal subtotal = 0, bool express = false)
    {
        var list = stores.ToList();
        var per = new List<DeliveryStoreQuote>();

        foreach (var s in list)
        {
            if (lat is { } cy && lng is { } cx && s.Lat is { } sy && s.Lng is { } sx)
            {
                var d = DistanceKm(sy, sx, cy, cx);
                per.Add(new DeliveryStoreQuote(s.Id, s.Name, Math.Round(d, 2), Math.Clamp(Money(RawFeeForDistance(d)), MinFee, StandardCap)));
            }
            else
            {
                per.Add(new DeliveryStoreQuote(s.Id, s.Name, null, BaseFee));
            }
        }

        var geo = (lat is { } && lng is { })
            ? list.Where(s => s.Lat is { } && s.Lng is { }).ToList()
            : new List<Store>();

        double? combinedKm = null;
        decimal cappedStandard;
        if (geo.Count == 0)
        {
            cappedStandard = BaseFee;
        }
        else if (geo.Count == 1)
        {
            var km = DistanceKm(geo[0].Lat!.Value, geo[0].Lng!.Value, lat!.Value, lng!.Value);
            combinedKm = Math.Round(km, 2);
            cappedStandard = Math.Clamp(Money(RawFeeForDistance(km)), MinFee, StandardCap);
        }
        else
        {
            double avgToCustomer = geo.Average(s => DistanceKm(s.Lat!.Value, s.Lng!.Value, lat!.Value, lng!.Value));
            double interStore = 0;
            for (int i = 0; i < geo.Count; i++)
                for (int j = i + 1; j < geo.Count; j++)
                    interStore += DistanceKm(geo[i].Lat!.Value, geo[i].Lng!.Value, geo[j].Lat!.Value, geo[j].Lng!.Value);
            double combined = avgToCustomer + interStore;
            combinedKm = Math.Round(combined, 2);
            cappedStandard = Math.Clamp(Money(RawFeeForDistance(combined)), MinFee, StandardCap);
        }

        bool free = subtotal > FreeOverSubtotal;

        decimal standardFee = free ? 0m : cappedStandard;
        decimal expressFee = standardFee + ExpressSurcharge;  // ekspress əlavə pulsuz sifarişdə də qalır
        decimal total = express ? expressFee : standardFee;

        return new DeliveryQuote(total, combinedKm, standardFee, expressFee, free, FreeOverSubtotal, per);
    }

    /// <summary>Məsafə-əsaslı double xərci money-decimal-a yuvarlaqlaşdırır (2 onluq).</summary>
    private static decimal Money(double v) => Math.Round((decimal)v, 2);
}
