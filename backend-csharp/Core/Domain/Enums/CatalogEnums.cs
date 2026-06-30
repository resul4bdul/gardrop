namespace Gardrop.Core.Domain.Enums;

// Sabit dəyər çoxluqları magic-string yerinə enum kimi (bax menfiler 3.5).
// DB-də string saxlanılır (EF HasConversion<string>), DTO sərhədində də string qalır
// (frontend müqaviləsi dəyişmir) — enum yalnız domen/məntiq qatında tip təhlükəsizliyi verir.
// Enum üzvlərinin adları MƏHZ köhnə string dəyərləri ilə eynidir (ToString/Parse uyğunluğu).

/// <summary>Məhsul admin təsdiq vəziyyəti. Yalnız Approved məhsullar public kataloqda görünür.</summary>
public enum ApprovalStatus
{
    Pending,
    Approved,
    Rejected,
}

/// <summary>Kupon endirim növü: amount (sabit ₼) və ya percent (faiz). Adlar wire dəyəri ilə eynidir.</summary>
public enum CouponType
{
    amount,
    percent,
}

/// <summary>
/// Cinsiyyət. User.Cins yalnız Male/Female (və ya təyin olunmamış=null); Product.Gender əlavə Unisex.
/// İdentifikatorlar ingiliscədir (bax menfiler 3.6), LAKİN wire/DB string dəyəri AZ qalır
/// (Kişi/Qadın/Uniseks) — frontend bu dəyərləri göndərir/alır. Çevirmə GenderToWire/ParseGender ilədir.
/// </summary>
public enum Gender
{
    Male,
    Female,
    Unisex,
}

/// <summary>magic-string ↔ enum çevirmələri (DTO sərhədi və köhnə data üçün tolerant parse).</summary>
public static class CatalogEnumParsing
{
    public static ApprovalStatus ParseApprovalStatus(string? s, ApprovalStatus fallback = ApprovalStatus.Pending) =>
        Enum.TryParse<ApprovalStatus>(s, ignoreCase: true, out var v) ? v : fallback;

    public static CouponType ParseCouponType(string? s, CouponType fallback = CouponType.amount) =>
        Enum.TryParse<CouponType>(s, ignoreCase: true, out var v) ? v : fallback;

    // ── Gender ↔ wire/DB string (AZ dəyər qorunur — bax menfiler 3.6) ──
    /// <summary>Enum → wire/DB string (Male→"Kişi", Female→"Qadın", Unisex→"Uniseks").</summary>
    public static string GenderToWire(Gender g) => g switch
    {
        Gender.Male => "Kişi",
        Gender.Female => "Qadın",
        _ => "Uniseks",
    };

    /// <summary>Nullable variant (təyin olunmayıb → null).</summary>
    public static string? GenderToWire(Gender? g) => g is null ? null : GenderToWire(g.Value);

    private static Gender? MapWire(string? s) => s?.Trim().ToLowerInvariant() switch
    {
        "kişi" => Gender.Male,
        "qadın" => Gender.Female,
        "uniseks" => Gender.Unisex,
        var w => Enum.TryParse<Gender>(w, ignoreCase: true, out var v) ? v : null,  // ingilis ad da tolerant
    };

    /// <summary>Boş/naməlum → null (cinsiyyət təyin olunmayıb).</summary>
    public static Gender? ParseGenderOrNull(string? s) => MapWire(s);

    /// <summary>Boş/naməlum → fallback (məhsul üçün defolt Unisex).</summary>
    public static Gender ParseGender(string? s, Gender fallback = Gender.Unisex) => MapWire(s) ?? fallback;
}
