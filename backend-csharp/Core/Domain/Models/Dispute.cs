using Gardrop.Core.Domain.Common;
using Gardrop.Core.Domain.Enums;

namespace Gardrop.Core.Domain.Models;

/// <summary>
/// Müştəri münaqişəsi (defektli/yanlış məhsul və s.) — müştəri açır, admin həll edir
/// ("ödənişi dondur" / "müştəriyə pulu qaytar" / "rədd et"). Status <see cref="DisputeStatus"/>.
/// </summary>
public class Dispute : FullAuditableEntity<long>
{
    public long OrderId { get; set; }
    public string OrderNo { get; set; } = "";   // göstərmə üçün snapshot
    public long UserId { get; set; }
    public int? StoreId { get; set; }            // aidiyyatlı mağaza (varsa)

    public string Reason { get; set; } = "";
    public string Status { get; set; } = DisputeStatus.Open;

    // Həll: "refund" | "freeze" | "dismiss" + admin qeydi.
    public string Resolution { get; set; } = "";
    public DateTime? ResolvedAt { get; set; }
}
