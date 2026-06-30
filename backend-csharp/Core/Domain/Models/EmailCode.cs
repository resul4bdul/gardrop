using Gardrop.Core.Domain.Common;

namespace Gardrop.Core.Domain.Models;

/// <summary>
/// Email ilə göndərilən birdəfəlik kod/token (OTP, email təsdiqi, şifrə bərpası).
/// Kod açıq saxlanmır — yalnız SHA-256 hash-i saxlanır.
/// Id → BaseEntity. Ephemeral auth qeydi — vaxtı keçəndə fiziki silinir (audit/soft-delete yox).
/// </summary>
public class EmailCode : BaseEntity
{
    public string Email { get; set; } = "";       // kiçik hərflə
    public string CodeHash { get; set; } = "";     // SHA-256(kod/token)
    public string Purpose { get; set; } = "";      // "login" | "verify" | "reset"
    public DateTime ExpiresAt { get; set; }
    public int Attempts { get; set; }              // uğursuz yoxlama cəhdləri
    public bool Used { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
