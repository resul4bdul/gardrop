using System.ComponentModel.DataAnnotations.Schema;
using Gardrop.Core.Domain.Common;
using Gardrop.Core.Domain.Enums;

namespace Gardrop.Core.Domain.Models;

// Id, CreatedAt, UpdatedAt, IsDeleted, DeletedAt → FullAuditableEntity (long açar).
// QEYD (bax menfiler 3.6): identifikatorlar ingiliscə edildi; DB sütun adları [Column(...)] ilə
// köhnə Azərbaycan adlarında saxlanır (sxema/data dəyişmir). Wire DTO-ları (PublicUserDto.Ad,
// UserMeasurementsDto.Boy...) frontend müqaviləsi olduğu üçün Azərbaycanca qalır — UserMapper çevirir.
public class User : FullAuditableEntity
{
    [Column("Ad")] public string FirstName { get; set; } = "";
    [Column("Soyad")] public string LastName { get; set; } = "";
    public string Email { get; set; } = "";
    [Column("Telefon")] public string Phone { get; set; } = "";
    public string PasswordHash { get; set; } = "";  // Google ilə yaradılan hesablarda boş ola bilər
    public bool IsAdmin { get; set; }  // admin paneli girişi
    public bool EmailVerified { get; set; }  // email təsdiqlənib? (Google hesabları avtomatik true)

    // Sosial giriş (Google OAuth)
    public string Provider { get; set; } = "local";  // "local" / "google"
    public string? GoogleId { get; set; }              // Google "sub" (sabit istifadəçi id-si)
    public string AvatarUrl { get; set; } = "";        // Google profil şəkli
    // cinsiyyət: Male/Female (təyin olunmayıb=null). Enum; DB-də AZ string ("Kişi"/"Qadın") — bax 3.5/3.6.
    [Column("Cins")] public Gender? Gender { get; set; }

    // Bədən ölçüləri (AI ölçü mühərriki üçün)
    [Column("Boy")] public double? Height { get; set; }   // sm
    [Column("Ceki")] public double? Weight { get; set; }  // kg
    [Column("Dos")] public double? Chest { get; set; }    // sm — dəqiq ölçü (istəyə bağlı)
    [Column("Bel")] public double? Waist { get; set; }    // sm — dəqiq ölçü (istəyə bağlı)
    [Column("Omba")] public double? Hip { get; set; }     // sm
    [Column("DosFit")] public string? ChestFit { get; set; }   // çiyin genişliyi: "dar" / "orta" / "geniş"
    [Column("BelFit")] public string? WaistFit { get; set; }   // bel genişliyi: "dar" / "orta" / "geniş"
    [Column("QarinFit")] public string? BellyFit { get; set; } // qarın genişliyi (yandan): "dar" / "orta" / "geniş"
    [Column("OmbaFit")] public string? HipFit { get; set; }    // omba (hip) genişliyi: "dar" / "orta" / "geniş"
    [Column("AyaqFit")] public string? FootFit { get; set; }   // ayaq uzunluğu: "qısa" / "orta" / "uzun"
    [Column("Yas")] public int? Age { get; set; }              // yaş — çəkinin bədəndə paylanmasına təsir edir
    [Column("AyaqqabiOlcu")] public int? ShoeSize { get; set; } // ayaqqabı ölçüsü EU (36–46)
    public string? FitPreference { get; set; } // sevdiyi oturuş: "Slim" / "Regular" / "Relaxed" / "Oversize"

    public List<Address> Addresses { get; set; } = new();
    public List<CartItem> CartItems { get; set; } = new();
    public List<Favorite> Favorites { get; set; } = new();
    public List<Order> Orders { get; set; } = new();
}
