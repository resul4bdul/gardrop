using Gardrop.Core.Domain.Common;

namespace Gardrop.Core.Domain.Models;

/// <summary>
/// Problem status timeline hadisəsi (dəyişməz) — müştəriyə görünən zaman xətti buradan qurulur.
/// Soft-delete YOXDUR (jurnal silinmir), bax <see cref="ActivityLog"/> ilə eyni yanaşma.
/// </summary>
public class ProblemEvent : BaseEntity<long>
{
    public long ProblemId { get; set; }
    public string Status { get; set; } = "";     // keçilən ProblemStatus dəyəri (və ya "Şərh")
    public string ActorRole { get; set; } = "";  // "Müştəri" | "Mağaza" | "Admin" | "Sistem"
    public string Note { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
