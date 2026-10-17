using System.ComponentModel.DataAnnotations;

namespace Gardrop.Core.Application.Common.DTOs;

/// <summary>
/// Məhsul yazma DTO-su (admin + mağaza paneli üçün ortaq). Bütün sahələr opsionaldır
/// (yenidə yalnız göndərilənlər tətbiq olunur — bax ProductWriter.Apply).
/// E3: 28-parametrli positional record-dan ADLANDIRILMIŞ init-property-lərə keçildi —
/// sıra-həssas deyil, oxunaqlı, qruplaşdırılmış. JSON forması (flat) dəyişməyib.
/// </summary>
public record AdminProductDto
{
    // ── Əsas ──
    public string? Name { get; init; }
    public string? Store { get; init; }
    public int? StoreId { get; init; }
    public string? Brand { get; init; }
    public string? Description { get; init; }

    // ── Qiymət ── (Reytinq/Reviews əl ilə təyin olunmur — real rəylərdən hesablanır)
    [Range(0.01, double.MaxValue, ErrorMessage = "Qiymət 0-dan böyük olmalıdır")]
    public decimal? Price { get; init; }
    public decimal? OldPrice { get; init; }
    public decimal? BuyPrice { get; init; }   // yalnız satıcı; public-ə getmir
    public int? Discount { get; init; }

    // ── Təsnifat ──
    public string? Category { get; init; }
    public string? Subcategory { get; init; }
    public string? SubSubcategory { get; init; }
    public string? Gender { get; init; }

    // ── Ölçü / oturuş (AI mühərriki üçün) ──
    public string? Size { get; init; }
    public string? SizeSystem { get; init; }
    public string? FitType { get; init; }
    public string? Stretch { get; init; }
    public string? SizeBehavior { get; init; }
    public bool? WashShrink { get; init; }
    public List<SizeChartRow>? SizeChart { get; init; }

    // ── Variant / stok ──
    public string? Color { get; init; }
    public string? Material { get; init; }
    public string? Season { get; init; }
    public List<string>? Tags { get; init; }

    // ── SEO / status ──
    public string? SeoTitle { get; init; }
    public string? SeoDescription { get; init; }
    public bool? IsDraft { get; init; }
    public List<string>? Sizes { get; init; }
    public Dictionary<string, int>? SizeStock { get; init; }
    public int? Stock { get; init; }
    // Variant matrisi (ölçü × rəng → SKU + stok). Verildikdə Sizes/SizeStock/Stock/Color ondan törədilir.
    public List<ProductVariant>? Variants { get; init; }

    // ── Şəkillər ──
    public List<string>? ImageUrls { get; init; }
    public int? Images { get; init; }
}

// Məhsul təsdiqi / rəddi
public record ApprovalDto(string? Status, string? Reason);

// Admin toplu məhsul əməliyyatı
public record BulkProductDto(List<int>? Ids, string? Action, string? Reason);
