using Gardrop.Core.Domain.Common;

namespace Gardrop.Core.Domain.Models;

// ── Mağaza (read-mostly seed data, PostgreSQL-də saxlanılır) ──
// Id (int, ValueGeneratedNever), CreatedAt, UpdatedAt, IsDeleted, DeletedAt → FullAuditableEntity<int>.

public class Store : FullAuditableEntity<int>
{
    public string Name { get; set; } = "";
    public double Rating { get; set; }
    public int Reviews { get; set; }
    public int Products { get; set; }
    public string City { get; set; } = "";
    public int Established { get; set; }

    // Fiziki məkan — çatdırılma xərci mağaza ilə müştəri arasındakı məsafəyə görə hesablanır.
    public double? Lat { get; set; }
    public double? Lng { get; set; }
    public string Address { get; set; } = "";

    // Mağaza profil şəkli (logo) — yüklənmiş şəkil URL-i. Boşdursa frontend ad hərfini göstərir.
    public string Logo { get; set; } = "";

    // ── Public profil (storefront-da görünür, StoreView-ə daxil) ──
    public string Banner { get; set; } = "";   // üst banner şəkli URL
    public string Url { get; set; } = "";       // mağaza url/slug
    public string About { get; set; } = "";     // haqqımızda mətni

    // Sosial (public)
    public string Instagram { get; set; } = "";
    public string Facebook { get; set; } = "";
    public string Tiktok { get; set; } = "";
    public string Whatsapp { get; set; } = "";

    // Əlaqə (public)
    public string Phone { get; set; } = "";
    public string Email { get; set; } = "";

    // Çatdırılma (public — alıcıya göstərilir): hazırlanma müddəti + geri qaytarma müddəti (gün).
    public int? PrepDays { get; set; }
    public int? ReturnDays { get; set; }

    // ── Həssas (yalnız satıcı — StoreView-ə DAXİL DEYİL, /settings endpoint qaytarır) ──
    // Bank
    public string BankName { get; set; } = "";
    public string Iban { get; set; } = "";
    public string Beneficiary { get; set; } = "";

    // Hüquqi
    public string Voen { get; set; } = "";        // VÖEN
    public string LegalName { get; set; } = "";   // hüquqi şəxs / fərdi sahibkar adı

    // Bildiriş seçimləri (default açıq)
    public bool NotifyNewOrder { get; set; } = true;
    public bool NotifyNewReview { get; set; } = true;
    public bool NotifyEmail { get; set; } = true;

    // Mağaza paneli (satıcı) girişi — bu mağazaya sahib istifadəçi (Faza 2).
    public long? OwnerUserId { get; set; }

    // Münaqişə həllində admin ödənişi dondura bilər — dondurulmuş mağazaya payout yaradıla bilməz.
    public bool PayoutFrozen { get; set; }
}
