using Gardrop.Core.Domain.Common;
using Gardrop.Core.Domain.Enums;

namespace Gardrop.Core.Domain.Models;

/// <summary>Mağazanın öz ölçü cədvəlinin bir sətri: boy/çəki aralığı → ölçü etiketi.</summary>
public class SizeChartRow
{
    public string Size { get; set; } = "";
    public double? BoyMin { get; set; }
    public double? BoyMax { get; set; }
    public double? CekiMin { get; set; }
    public double? CekiMax { get; set; }
}

/// <summary>Məhsul variantı (ölçü × rəng kombinasiyası): hər birinin öz SKU + stoku.
/// Authoring/göstərmə modelidir. Canlı stok ölçü səviyyəsində SizeStock-da saxlanılır
/// (variant verildikdə ondan törədilir) — order decrement hələ ölçü səviyyəsindədir.</summary>
public class ProductVariant
{
    public string Size { get; set; } = "";
    public string Color { get; set; } = "";
    public string Sku { get; set; } = "";
    public int Stock { get; set; }
}

// Id (int, ValueGeneratedNever), CreatedAt, UpdatedAt, IsDeleted, DeletedAt → FullAuditableEntity<int>.
public class Product : FullAuditableEntity<int>
{
    public string Name { get; set; } = "";
    public string Store { get; set; } = "";
    public int StoreId { get; set; }

    // SEO URL slug (/product/{slug}). Yaradılanda addan törədilir, sonra SABİT qalır
    // (ad dəyişsə də URL qırılmasın). Unikallıq: filtrlənmiş unikal indeks (bax AppDbContext).
    public string Slug { get; set; } = "";

    // Marka (brand) — ölçü dəqiqliyi üçün. AI mühərriki marka əsaslı kəsim davranışı tətbiq edir
    // (məs. Zara → runs small). Mağaza məhsulu seçəndə yazır; boşdursa marka korreksiyası tətbiq olunmur.
    public string Brand { get; set; } = "";
    public decimal Price { get; set; }
    public decimal? OldPrice { get; set; }

    // Alış qiyməti — yalnız satıcı görür (public ProductView-ə daxil DEYİL). Mənfəət hesabı üçün.
    public decimal? BuyPrice { get; set; }

    // Reytinq və rəy sayı əl ilə yazılmır — real rəylərdən hesablanır (defolt 0).
    public double Rating { get; set; }
    public int Reviews { get; set; }

    public string Size { get; set; } = "";
    public int? Discount { get; set; }
    public string Category { get; set; } = "";
    public string Subcategory { get; set; } = "";
    public string SubSubcategory { get; set; } = "";  // 3-cü səviyyə (istəyə bağlı)
    public string Color { get; set; } = "";

    // Cinsiyyət: Kişi / Qadın / Uniseks. Kateqoriyadan ayrıdır (ayaqqabı/aksesuar da cinsiyyətli ola bilər).
    // Enum (bax menfiler 3.5); DB-də string saxlanır, DTO sərhədində string-ə çevrilir.
    public Gender Gender { get; set; } = Gender.Unisex;

    // Ölçü sistemi: "INT" (S/M/L…) və ya "TR" (rəqəmlərlə, məs. 38/40/42 və ya ayaqqabı EU).
    // Mağaza məhsulu yükləyəndə seçir; AI ölçü mühərriki tövsiyəni bu sistemdə qaytarır.
    public string SizeSystem { get; set; } = "INT";

    // Kəsim növü — AI ölçü tövsiyəsində oturuş düzəlişi üçün (Slim daha dar → bir ölçü böyük meyl).
    public string FitType { get; set; } = "Regular";  // "Slim" / "Regular" / "Relaxed" / "Oversize"

    // Parça elastikliyi — elastik olmayan parçada daha çox ehtiyat payı saxlanılır.
    public string Stretch { get; set; } = "medium";   // "none" / "low" / "medium" / "high"

    // Məhsulun ölçü davranışı — AI tövsiyəsində bant sürüşməsi (mağaza qeyd edir).
    public string SizeBehavior { get; set; } = "Standard";  // "Standard"/"RunsSmall"/"RunsLarge"/"Oversize"

    // Mağaza qeyd edir: ilk yuyulmadan sonra cüzi yığıla bilər (risk yalnız bu seçiləndə göstərilir).
    public bool WashShrink { get; set; }

    // Mağazanın öz ölçü cədvəli (SizeSystem="Custom" olduqda): hər ölçü üçün boy/çəki aralığı.
    // AI mühərriki istifadəçinin boy+çəkisini bu cədvələ uyğunlaşdırıb ölçü tövsiyə edir.
    public List<SizeChartRow> SizeChart { get; set; } = new();

    public List<string> Sizes { get; set; } = new();

    // Hər ölçüdən stokda nə qədər var (ölçü → ədəd). Ümumi Stock bunun cəmidir.
    public Dictionary<string, int> SizeStock { get; set; } = new();

    // Variant matrisi (ölçü × rəng → SKU + stok). Boşdursa məhsul tək-rəng/ölçü-stok modelindədir.
    // Verildikdə SizeStock/Sizes/Stock/Color ondan törədilir (bax ProductWriter).
    public List<ProductVariant> Variants { get; set; } = new();

    public string Material { get; set; } = "";

    // Mövsüm (Yaz/Yay/Payız/Qış/Bütün il) və sərbəst etiketlər (axtarış/filtr üçün).
    public string Season { get; set; } = "";
    public List<string> Tags { get; set; } = new();

    // SEO meta — public məhsul səhifəsi üçün başlıq/təsvir (boşdursa ad/təsvir işlədilir).
    public string SeoTitle { get; set; } = "";
    public string SeoDescription { get; set; } = "";

    // Qaralama: satıcı hələ təqdim etməyib. Admin təsdiqinə düşmür, saytda görünmür.
    public bool IsDraft { get; set; }

    // Analitika sayğacları (denormalizə): baxış sayı (public detal GET), satış sayı (stok azalanda).
    public int Views { get; set; }
    public int SalesCount { get; set; }

    // Şəkil URL-ləri. Real məhsul şəkilləri öz upload pipeline-ı (UploadController → IStorageService,
    // Local/S3 — bax A.2) ilə yüklənir; yalnız demo seed xarici placeholder (picsum) işlədir.
    // Images = sayğac (geriyə-uyğunluq).
    public List<string> ImageUrls { get; set; } = new();
    public int Images { get; set; }

    public int Stock { get; set; }
    public string Description { get; set; } = "";

    // Admin təsdiqi: Pending (yeni mağaza məhsulu) → Approved | Rejected.
    // Yalnız Approved məhsullar saytda (public kataloqda) görünür. Enum (bax menfiler 3.5).
    public ApprovalStatus ApprovalStatus { get; set; } = ApprovalStatus.Approved;
    public string RejectReason { get; set; } = "";

    // "Stok azdır" bildirişi bir dəfə göndərilsin (spam qarşısı); stok ≥10 olanda sıfırlanır.
    public bool LowStockNotified { get; set; }

    /// <summary>
    /// Axtarış üçün normallaşdırılmış blob (ad+mağaza+kateqoriya+rəng, diakritiksiz, kiçik hərf).
    /// PostgreSQL-də STORED generated sütun kimi hesablanır (bax AppDbContext) — kodda təyin olunmur.
    /// </summary>
    [System.Text.Json.Serialization.JsonIgnore]
    public string SearchBlob { get; private set; } = "";
}
