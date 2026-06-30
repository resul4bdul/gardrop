namespace Gardrop.Core.Application.Common.DTOs;

/// <summary>İstifadəçi ünvanı — cavab forması (JSON: id,label,sehir,unvan,lat,lng,isDefault).</summary>
public record UserAddressDto(long Id, string Label, string Sehir, string Unvan, double? Lat, double? Lng, bool IsDefault);

/// <summary>Bədən ölçüləri — /api/auth/me + profil cavablarındakı `measurements` obyekti.
/// boy/çəki/yaş/ayaqqabı RƏQƏM qaytarır (frontend rəqəm gözləyir — bax restructure GOTCHA).</summary>
public record UserMeasurementsDto(
    double? Boy, double? Ceki, double? Dos, double? Bel, int? Yas, double? Omba,
    string? DosFit, string? BelFit, string? QarinFit, string? OmbaFit, string? AyaqFit,
    int? Ayaqqabi, string? FitPreference);

/// <summary>Səbət sətri — publicUser içində (JSON: productId,qty,size).</summary>
public record UserCartItemView(int ProductId, int Qty, string? Size);

/// <summary>publicUser — şifrə hash-i çıxarılmış istifadəçi forması (frontend müqaviləsi).
/// JSON şəkli əvvəlki UserMapper.PublicUser anonim obyekti ilə birə-bir.</summary>
public record PublicUserDto
{
    public long Id { get; init; }
    public string Ad { get; init; } = "";
    public string Soyad { get; init; } = "";
    public string Email { get; init; } = "";
    public string Telefon { get; init; } = "";
    public string? Cins { get; init; }
    public bool IsAdmin { get; init; }
    public bool HasPassword { get; init; }
    public string Provider { get; init; } = "";
    public string AvatarUrl { get; init; } = "";
    public DateTime CreatedAt { get; init; }
    public IReadOnlyList<UserCartItemView> Cart { get; init; } = [];
    public IReadOnlyList<int> Favorites { get; init; } = [];
    public IReadOnlyList<UserAddressDto> Addresses { get; init; } = [];
    public UserMeasurementsDto Measurements { get; init; } = default!;
}
