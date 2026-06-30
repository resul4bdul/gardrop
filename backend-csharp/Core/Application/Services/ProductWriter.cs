using Gardrop.Core.Domain.Enums;

namespace Gardrop.Core.Application.Services;

/// <summary>Məhsul DTO-sunu Product modelinə tətbiq edir — admin və mağaza paneli üçün ortaq.</summary>
public class ProductWriter : IProductWriter
{
    public void Apply(Product p, AdminProductDto d)
    {
        if (d.Name is not null) p.Name = d.Name;
        if (d.Store is not null) p.Store = d.Store;
        if (d.Brand is not null) p.Brand = d.Brand.Trim();
        if (d.StoreId.HasValue) p.StoreId = d.StoreId.Value;
        if (d.Price.HasValue) p.Price = d.Price.Value;
        p.OldPrice = d.OldPrice;  // null = endirim yoxdur
        p.BuyPrice = d.BuyPrice;  // yalnız satıcı görür
        // Reytinq/rəy əl ilə təyin OLUNMUR — real rəylərdən hesablanır (RatingEngine).
        if (d.Size is not null) p.Size = d.Size;
        p.Discount = d.Discount;
        if (d.Category is not null) p.Category = d.Category;
        if (d.Subcategory is not null) p.Subcategory = d.Subcategory;
        if (d.SubSubcategory is not null) p.SubSubcategory = d.SubSubcategory;
        if (d.Gender is not null) p.Gender = CatalogEnumParsing.ParseGender(d.Gender, p.Gender);  // string→enum (bax menfiler 3.5)
        if (d.SizeSystem is not null) p.SizeSystem = d.SizeSystem;
        if (d.FitType is not null) p.FitType = d.FitType;
        if (d.Stretch is not null) p.Stretch = d.Stretch;
        if (d.SizeBehavior is not null) p.SizeBehavior = d.SizeBehavior;
        if (d.WashShrink.HasValue) p.WashShrink = d.WashShrink.Value;
        if (d.SizeChart is not null) p.SizeChart = SanitizeChart(d.SizeChart);
        if (d.Color is not null) p.Color = d.Color;
        if (d.Material is not null) p.Material = d.Material;
        if (d.Season is not null) p.Season = d.Season;
        if (d.Tags is not null) p.Tags = d.Tags.Where(t => !string.IsNullOrWhiteSpace(t)).Select(t => t.Trim()).Distinct().ToList();
        if (d.SeoTitle is not null) p.SeoTitle = d.SeoTitle.Trim();
        if (d.SeoDescription is not null) p.SeoDescription = d.SeoDescription.Trim();
        if (d.IsDraft.HasValue) p.IsDraft = d.IsDraft.Value;
        if (d.Description is not null) p.Description = d.Description;

        if (d.ImageUrls is not null)
        {
            p.ImageUrls = d.ImageUrls.Where(u => !string.IsNullOrWhiteSpace(u)).Select(u => u.Trim()).ToList();
            p.Images = p.ImageUrls.Count;
        }
        else if (d.Images.HasValue) p.Images = d.Images.Value;

        // Stok prioriteti: Variants (ölçü×rəng matrisi, qeyri-boş) > SizeStock (per-ölçü) > Sizes/Stock.
        // Variants verildikdə (null deyil) həmişə yazılır; BOŞ siyahı = matrisi təmizlə + SizeStock-a qayıt.
        var variantsApplied = false;
        if (d.Variants is not null)
        {
            p.Variants = SanitizeVariants(d.Variants);
            if (p.Variants.Count > 0)
            {
                // Canlı stok ölçü səviyyəsində saxlanılır (order decrement SizeStock-a baxır) — variantdan törət.
                p.SizeStock = p.Variants.Where(v => v.Size.Length > 0)
                    .GroupBy(v => v.Size).Select(g => new { g.Key, Sum = g.Sum(v => v.Stock) })
                    .Where(x => x.Sum > 0).ToDictionary(x => x.Key, x => x.Sum);
                p.Sizes = p.SizeStock.Keys.ToList();
                p.Stock = p.Variants.Sum(v => v.Stock);
                var colors = p.Variants.Where(v => v.Color.Length > 0).Select(v => v.Color).Distinct().ToList();
                if (colors.Count > 0) p.Color = string.Join(", ", colors);
                variantsApplied = true;
            }
        }
        if (!variantsApplied)
        {
            if (d.SizeStock is not null)
            {
                p.SizeStock = d.SizeStock.Where(kv => kv.Value > 0).ToDictionary(kv => kv.Key, kv => kv.Value);
                p.Sizes = p.SizeStock.Keys.ToList();
                p.Stock = p.SizeStock.Values.Sum();
            }
            else
            {
                if (d.Sizes is not null) p.Sizes = d.Sizes;
                if (d.Stock.HasValue) p.Stock = d.Stock.Value;
            }
        }
    }

    // Variant sətirlərini təmizlə: trim, boş (ölçü+rəng) sətirlər atılır, stok ≥0,
    // (ölçü,rəng) cütü üzrə dedupe (stok cəmlənir, ilk dolu SKU saxlanılır).
    private static List<ProductVariant> SanitizeVariants(List<ProductVariant> rows) =>
        rows.Select(v => new ProductVariant { Size = (v.Size ?? "").Trim(), Color = (v.Color ?? "").Trim(), Sku = (v.Sku ?? "").Trim(), Stock = Math.Max(0, v.Stock) })
            .Where(v => v.Size.Length > 0 || v.Color.Length > 0)
            .GroupBy(v => (v.Size, v.Color))
            .Select(g => new ProductVariant { Size = g.Key.Size, Color = g.Key.Color, Sku = g.Select(x => x.Sku).FirstOrDefault(s => s.Length > 0) ?? "", Stock = g.Sum(x => x.Stock) })
            .ToList();

    // Absurd boy/çəki qarşısı (API bypass-a qarşı): real insan aralıqlarından kənar dəyərlər atılır,
    // ölçü adı boş və ya heç bir aralığı olmayan sətirlər çıxarılır.
    private const double BoyMin = 50, BoyMax = 250, CekiMin = 20, CekiMax = 350;
    private static double? Clamp(double? v, double lo, double hi) =>
        v is null ? null : (v.Value < lo || v.Value > hi ? null : v.Value);
    private static List<SizeChartRow> SanitizeChart(List<SizeChartRow> rows) =>
        rows.Where(r => !string.IsNullOrWhiteSpace(r.Size))
            .Select(r =>
            {
                r.Size = r.Size.Trim();
                r.BoyMin = Clamp(r.BoyMin, BoyMin, BoyMax);
                r.BoyMax = Clamp(r.BoyMax, BoyMin, BoyMax);
                r.CekiMin = Clamp(r.CekiMin, CekiMin, CekiMax);
                r.CekiMax = Clamp(r.CekiMax, CekiMin, CekiMax);
                if (r.BoyMin.HasValue && r.BoyMax.HasValue && r.BoyMin > r.BoyMax) (r.BoyMin, r.BoyMax) = (r.BoyMax, r.BoyMin);
                if (r.CekiMin.HasValue && r.CekiMax.HasValue && r.CekiMin > r.CekiMax) (r.CekiMin, r.CekiMax) = (r.CekiMax, r.CekiMin);
                return r;
            })
            .Where(r => r.BoyMin.HasValue || r.BoyMax.HasValue || r.CekiMin.HasValue || r.CekiMax.HasValue)
            .ToList();
}
