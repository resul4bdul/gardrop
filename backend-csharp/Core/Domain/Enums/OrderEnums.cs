namespace Gardrop.Core.Domain.Enums;

// QEYD (bax menfiler 3.6): bu çoxluqlar əvvəl qeyri-ASCII üzv adlı enum idi (Hazırlanır/İptal...).
// İdentifikatorlar ingiliscə ASCII edildi, LAKİN wire/DB string dəyərləri DƏYİŞMƏDƏN qaldı
// (Order.Status/DeliveryType/CancelledBy string sütunlardır; frontend bu dəyərləri göndərir/alır).
// Buna görə const string class: üzv adı = ingilis, const dəyəri = köhnə Azərbaycan wire/DB dəyəri.

/// <summary>Sifarişin həyat dövrü statusu (wire/DB string dəyəri = const value).</summary>
public static class OrderStatus
{
    public const string Preparing = "Hazırlanır";
    public const string Prepared = "Hazırlandı";
    public const string OnTheWay = "Yolda";
    public const string Delivered = "Çatdırıldı";
    public const string Cancelled = "İptal";

    public static readonly string[] All = { Preparing, Prepared, OnTheWay, Delivered, Cancelled };
}

/// <summary>Ödəniş vəziyyəti (wire/DB string dəyəri = const value). Bax A.1.</summary>
public static class PaymentStatus
{
    public const string Pending = "Gözləyir";       // tutulmayıb (COD = çatdırılmada yığılır)
    public const string Paid = "Ödənildi";          // şlüz/COD təsdiqi alındı
    public const string Failed = "Uğursuz";         // şlüz imtina etdi
    public const string Refunded = "Geri qaytarıldı";

    public static readonly string[] All = { Pending, Paid, Failed, Refunded };
}

/// <summary>Ödəniş metodu (wire/DB string dəyəri = const value).</summary>
public static class PaymentMethod
{
    public const string Cash = "Nağd";   // qapıda nağd (COD)
    public const string Card = "Kart";   // onlayn kart (şlüz)
}

/// <summary>Mağazaya ödəniş (payout/settlement) vəziyyəti (wire/DB string dəyəri = const value).</summary>
public static class PayoutStatus
{
    public const string Pending = "Gözləyir";   // planlaşdırılıb, hələ köçürülməyib
    public const string Paid = "Ödənildi";       // bankа köçürüldü

    public static readonly string[] All = { Pending, Paid };
}

/// <summary>Çatdırılma növü (wire/DB string dəyəri = const value).</summary>
public static class DeliveryType
{
    public const string Standard = "Standart";
    public const string Express = "Ekspress";
}

/// <summary>Sifarişi ləğv edən tərəf (wire/DB string dəyəri = const value).</summary>
public static class CancelledByParty
{
    public const string None = "Yoxdur";
    public const string Customer = "Müştəri";
    public const string Store = "Mağaza";
    public const string Admin = "Admin";
}
