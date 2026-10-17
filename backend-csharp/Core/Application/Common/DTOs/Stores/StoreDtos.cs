namespace Gardrop.Core.Application.Common.DTOs;

public record AdminStoreDto(
    string? Name, double? Rating, int? Reviews, int? Products, string? City, int? Established,
    double? Lat, double? Lng, string? Address, string? Logo, long? OwnerUserId, string? OwnerEmail);

// Mağaza paneli — mağaza sahibinin öz mağazasını redaktəsi (reytinq/rəy/məhsul sayı oxunaqlıdır).
// Bütün sahələr nullable → qismən yeniləmə (yalnız göndərilən sahələr yazılır). FAZA 6 ayarları daxil.
public record StoreSelfDto(
    string? Name, string? City, int? Established, string? Address, string? Logo, double? Lat, double? Lng,
    // Ümumi/public profil
    string? Banner = null, string? Url = null, string? About = null,
    // Sosial
    string? Instagram = null, string? Facebook = null, string? Tiktok = null, string? Whatsapp = null,
    // Əlaqə
    string? Phone = null, string? Email = null,
    // Çatdırılma
    int? PrepDays = null, int? ReturnDays = null,
    // Bank (həssas)
    string? BankName = null, string? Iban = null, string? Beneficiary = null,
    // Hüquqi (həssas)
    string? Voen = null, string? LegalName = null,
    // Bildiriş seçimləri
    bool? NotifyNewOrder = null, bool? NotifyNewReview = null, bool? NotifyEmail = null);

// Admin mağazaya ödəniş (payout/settlement) yaradır/qeyd edir. Amount = köçürülən net məbləğ.
public record AdminPayoutDto(
    int StoreId, DateTime? PeriodStart, DateTime? PeriodEnd, decimal? Amount,
    string? Status, string? Method, string? Reference, string? Note);

/// <summary>Həssas mağaza ayarları (yalnız satıcı — StoreView-ə daxil deyil, /settings qaytarır).</summary>
public record StoreSettings(
    string BankName, string Iban, string Beneficiary,
    string Voen, string LegalName,
    bool NotifyNewOrder, bool NotifyNewReview, bool NotifyEmail);
