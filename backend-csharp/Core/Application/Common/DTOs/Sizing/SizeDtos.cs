using Gardrop.Core.Domain.Enums;
using Gardrop.Core.Domain.Models;

namespace Gardrop.Core.Application.Common.DTOs;

// Ölçü mühərriki üçün yüngül proyeksiyalar — yalnız alqoritmə lazım olan sahələr
// (ağır User/Product entity yüklənmir; SizeService EF .Select ilə doldurur).

/// <summary>İstifadəçinin ölçü profili (yalnız hesablama sahələri).</summary>
public record UserSizeDto(
    Gender? Gender, double? Height, double? Weight, double? Chest, double? Waist, double? Hip,
    double? ShoeSize, int? Age,
    string? ChestFit, string? WaistFit, string? BellyFit, string? HipFit, string? FootFit,
    string? FitPreference);

/// <summary>Məhsulun ölçüyə təsir edən sahələri.</summary>
public record ProductSizeDto(
    string Category, string? Subcategory, Gender Gender, string? SizeSystem,
    List<string> Sizes, string? Size, string? FitType, string? Stretch, string? SizeBehavior,
    string? Brand, string? Material, bool WashShrink, List<SizeChartRow> SizeChart);

/// <summary>
/// Bir ölçü bandı (DB sətri forması): kanonik indeks + etiket + sinə/bel/omba (min–max sm).
/// EN 13402 / TR baselayn. Static provider hazırda kodda, gələcəkdə DB-dən oxuna bilər.
/// </summary>
public record SizeChartBandDto(
    int Index, string SizeLabel,
    double ChestMin, double ChestMax,
    double WaistMin, double WaistMax,
    double HipMin, double HipMax);
