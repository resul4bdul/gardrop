using Gardrop.Core.Domain.Common;

namespace Gardrop.Core.Domain.Models;

/// <summary>
/// Platforma aktivlik jurnalı (dəyişməz audit izi) — kim, nə vaxt, nəyi dəyişdi.
/// Admin "Activity Feed"-də göstərilir. Soft-delete YOXDUR (jurnal silinmir).
/// </summary>
public class ActivityLog : BaseEntity<long>
{
    public long ActorId { get; set; }
    public string ActorName { get; set; } = "";
    public string Action { get; set; } = "";      // "product.update" | "product.approve" | "payout.create" | "dispute.resolve" | "store.update"
    public string EntityType { get; set; } = "";  // "product" | "store" | "order" | "payout" | "dispute"
    public string EntityId { get; set; } = "";
    public string Detail { get; set; } = "";      // qısa insan-oxunaqlı təsvir (məs. qiymət 100→120)
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
