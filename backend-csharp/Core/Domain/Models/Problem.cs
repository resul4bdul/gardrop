using Gardrop.Core.Domain.Common;
using Gardrop.Core.Domain.Enums;

namespace Gardrop.Core.Domain.Models;

/// <summary>
/// Sifariş problemi (geri qaytarma / şikayət) — Trendyol modeli:
/// müştəri 14 gün pəncərədə səbəb + şəkillərlə açır → satıcı 48 saatda qəbul/rədd edir
/// (vaxt bitsə avtomatik arbitraja düşür) → rədd olunanda admin arbitraj edir.
/// Qaytarma qəbul olunanda kuryer malı götürür; xərci kimin ödəyəcəyini
/// (<see cref="ReturnCostPayer"/>) admin səbəbi analiz edib seçir.
/// Köhnə sadə <see cref="Dispute"/> axını bununla əvəzlənir (tarixi qeydlər saxlanır).
/// </summary>
public class Problem : FullAuditableEntity<long>
{
    public long OrderId { get; set; }
    public string OrderNo { get; set; } = "";    // göstərmə üçün snapshot
    public long UserId { get; set; }
    public int? StoreId { get; set; }            // aidiyyatlı mağaza (varsa)

    public string Reason { get; set; } = "";           // ProblemReason const dəyəri
    public string Description { get; set; } = "";
    public List<string> Photos { get; set; } = new();  // /uploads/... URL-ləri (JSON sütun)

    public string Status { get; set; } = ProblemStatus.AwaitingStore;

    // Satıcı cavab pəncərəsi (yaradılış + 48 saat). Keçərsə → Arbitrajda.
    public DateTime StoreDeadline { get; set; }
    public string StoreResponseNote { get; set; } = "";
    public DateTime? StoreRespondedAt { get; set; }

    // Qaytarma logistikası — admin qərarı.
    public bool ReturnRequired { get; set; }
    public string ReturnCostPayer { get; set; } = "";   // "Mağaza" | "Müştəri"
    public DateTime? ReturnStartedAt { get; set; }
    public DateTime? ReturnReceivedAt { get; set; }     // satıcı malı təhvil aldı → auto-refund

    // Yekun: "refund" | "reject" | müştəri "cancel" + qeyd.
    public string Resolution { get; set; } = "";
    public DateTime? ResolvedAt { get; set; }
}
