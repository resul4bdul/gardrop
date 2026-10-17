using Gardrop.Core.Domain.Common;

namespace Gardrop.Core.Domain.Models;

// Id, CreatedAt, UpdatedAt, IsDeleted, DeletedAt → FullAuditableEntity.
public class Order : FullAuditableEntity
{
    public long UserId { get; set; }
    public string OrderNo { get; set; } = "";

    // Sifariş sətirləri relyasion cədvəldə (bax menfiler 2.2; əvvəl ItemsJson blob idi).
    public List<OrderItem> Items { get; set; } = new();
    public decimal Total { get; set; }
    // Ünvan/ödəniş QƏSDƏN JSON snapshot saxlanır (bax menfiler 2.2): müştərinin göndərdiyi
    // dəyişməz dəyər anıdır, sorğulanmır (yalnız yaradılışda lat/lng oxunur). Owned-type-ə
    // çevirmək frontend-in göndərdiyi naməlum sahələri itirərdi (müqavilə riski) — fayda yox.
    public string DeliveryAddressJson { get; set; } = "{}";
    public string PaymentJson { get; set; } = "{}";

    // Ödəniş vəziyyəti (bax A.1): metod + şlüz provayderi + intent id + Paid damğası.
    // PaymentJson müştəri snapshot-ı (dəyişməz); aşağıdakılar server-idarəli ödəniş axınıdır.
    public string PaymentMethod { get; set; } = "Nağd";        // "Nağd" (COD) | "Kart"
    public string PaymentStatus { get; set; } = "Gözləyir";    // PaymentStatus const dəyəri
    public string PaymentProvider { get; set; } = "cod";       // "cod" | "stripe" | ...
    public string? PaymentIntentId { get; set; }               // şlüz intent/charge id (webhook eşləməsi)
    public DateTime? PaidAt { get; set; }

    public string Status { get; set; } = "Hazırlanır";

    // Çatdırılma + kupon
    public decimal DeliveryFee { get; set; }
    public string DeliveryType { get; set; } = "Standart";  // "Standart" | "Ekspress"
    public string? CouponCode { get; set; }
    public decimal Discount { get; set; }  // kupon endirim məbləği (₼)

    // Çox mağazalı sifarişlərdə "Hazırlandı" işarələmiş mağaza id-ləri.
    // Sifariş yalnız BÜTÜN mağazalar hazır olduqda "Hazırlandı" statusuna keçir.
    // (bax menfiler 2.2; əvvəl PreparedStoresJson string blob idi — indi List<int>, DB-də jsonb converter.)
    public List<int> PreparedStores { get; set; } = new();

    // Stok yalnız bir dəfə azaldılır (sifariş təsdiqlənəndə) — ləğv olunarsa geri qaytarılır.
    public bool StockDeducted { get; set; }

    // Status zaman xətti (sifariş izləmə üçün)
    public DateTime? ConfirmedAt { get; set; }
    public DateTime? ShippedAt { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public DateTime? CancelledAt { get; set; }

    // Ləğv səbəbi + kim ləğv etdi ("Müştəri" | "Mağaza" | "Admin").
    public string CancelReason { get; set; } = "";
    public string CancelledBy { get; set; } = "";

    public User? User { get; set; }
}
