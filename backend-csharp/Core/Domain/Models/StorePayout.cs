using Gardrop.Core.Domain.Common;
using Gardrop.Core.Domain.Enums;

namespace Gardrop.Core.Domain.Models;

/// <summary>
/// Mağazaya ödəniş (settlement) — platformanın satıcıya köçürdüyü net məbləğ.
/// Admin yaradır/qeyd edir; satıcı oxunaqlı tarixçə kimi görür. Balans = ümumi net − ödənilmiş cəm.
/// Status string saxlanır (bax <see cref="PayoutStatus"/>).
/// </summary>
public class StorePayout : FullAuditableEntity<long>
{
    public int StoreId { get; set; }

    // Hesabat dövrü (hansı satışları əhatə edir).
    public DateTime PeriodStart { get; set; }
    public DateTime PeriodEnd { get; set; }

    // Köçürülən net məbləğ (komissiya çıxılmış).
    public decimal Amount { get; set; }

    public string Status { get; set; } = PayoutStatus.Pending;
    public DateTime? PaidAt { get; set; }

    // Köçürmə detalları (admin doldurur) — bank/IBAN qısa təsviri + transfer referansı + qeyd.
    public string Method { get; set; } = "";
    public string Reference { get; set; } = "";
    public string Note { get; set; } = "";
}
