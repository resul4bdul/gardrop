using Gardrop.Core.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Core.Application.Services;

/// <summary>
/// Reytinqləri real datadan hesablayır (əl ilə yazılmır):
///  • Məhsul reytinqi/rəy sayı → həmin məhsulun rəylərindən.
///  • Mağaza reytinqi (0–5) → rəy ulduzları + çatdırılmış sifariş sayı (müsbət siqnal)
///    − müştəri tərəfindən imtina edilən sifarişlər (cərimə). Data yoxdursa 0.
///  • Mağaza məhsul sayı → həmin mağazanın məhsulları.
/// Hər rəy/sifariş mutasiyasından sonra çağırılır.
/// </summary>
public class RatingEngine : IRatingService
{
    private readonly IAppDbContext _db;
    public RatingEngine(IAppDbContext db) => _db = db;

    public async Task RecomputeAsync(CancellationToken ct = default)
    {
        var products = await _db.Products.ToListAsync(ct);
        var stores = await _db.Stores.ToListAsync(ct);
        var reviews = await _db.Reviews.AsNoTracking().ToListAsync(ct);
        var orders = await _db.Orders.AsNoTracking().Include(o => o.Items).ToListAsync(ct);

        var prodStore = products.ToDictionary(p => p.Id, p => p.StoreId);

        // ── 1) Məhsul reytinqi/rəy sayı ──
        var byProduct = reviews.GroupBy(r => r.ProductId)
            .ToDictionary(g => g.Key, g => (avg: g.Average(r => r.Rating), n: g.Count()));
        foreach (var p in products)
        {
            if (byProduct.TryGetValue(p.Id, out var pr))
            {
                p.Rating = Math.Round(pr.avg, 1);
                p.Reviews = pr.n;
            }
            else { p.Rating = 0; p.Reviews = 0; }
        }

        // ── 2) Mağaza üzrə rəy ulduzları (məhsul → mağaza) ──
        var rvSum = new Dictionary<int, double>();
        var rvN = new Dictionary<int, int>();
        foreach (var r in reviews)
            if (prodStore.TryGetValue(r.ProductId, out var sid))
            {
                rvSum[sid] = rvSum.GetValueOrDefault(sid) + r.Rating;
                rvN[sid] = rvN.GetValueOrDefault(sid) + 1;
            }

        // ── 3) Mağaza üzrə çatdırılmış / imtina edilmiş sifarişlər ──
        var delivered = new Dictionary<int, int>();
        var cancelled = new Dictionary<int, int>();
        foreach (var o in orders)
        {
            var storesInOrder = new HashSet<int>();
            foreach (var li in o.Items)
                if (li.ProductId != 0 && prodStore.TryGetValue(li.ProductId, out var sid)) storesInOrder.Add(sid);

            foreach (var sid in storesInOrder)
            {
                if (o.Status == OrderStatus.Delivered) delivered[sid] = delivered.GetValueOrDefault(sid) + 1;
                else if (o.Status == OrderStatus.Cancelled) cancelled[sid] = cancelled.GetValueOrDefault(sid) + 1;
            }
        }

        var prodCount = products.GroupBy(p => p.StoreId).ToDictionary(g => g.Key, g => g.Count());

        foreach (var s in stores)
        {
            var n = rvN.GetValueOrDefault(s.Id);
            var rsum = rvSum.GetValueOrDefault(s.Id);
            var d = delivered.GetValueOrDefault(s.Id);
            var c = cancelled.GetValueOrDefault(s.Id);

            // Çəkili orta: rəy ulduzları (çəki 1), çatdırılmış sifariş gizli 4.6 siqnalı (çəki 1),
            // imtina 0 siqnalı (çəki 1). Üstəlik imtina nisbətinə görə cərimə.
            var points = rsum + d * 4.6;
            var weight = n + d + c;
            var rating = weight > 0 ? points / weight : 0;
            var totalOrd = d + c;
            if (totalOrd > 0) rating -= (double)c / totalOrd;  // imtina cəriməsi
            rating = Math.Clamp(rating, 0, 5);

            s.Rating = Math.Round(rating, 1);
            s.Reviews = n;
            s.Products = prodCount.GetValueOrDefault(s.Id);
        }

        await _db.SaveChangesAsync(ct);
    }
}
