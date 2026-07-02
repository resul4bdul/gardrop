namespace Gardrop.Core.Application.Common.DTOs;

// ── Problem (geri qaytarma / şikayət — Trendyol modeli) ──

/// <summary>Müştəri problem açır: səbəb (ProblemReason dəyəri) + təsvir + şəkillər.</summary>
public record ProblemCreateDto(string? Reason, string? Description, List<string>? Photos);

/// <summary>Satıcı 48 saat pəncərəsində cavab verir: qəbul/rədd + qeyd.</summary>
public record ProblemStoreRespondDto(bool Accept, string? Note);

/// <summary>
/// Admin qərarı. Action: "return" (kuryer qaytarması başlat — CostPayer tələb olunur:
/// "Mağaza"|"Müştəri") | "refund" (birbaşa pul qaytar) | "reject" (əsassız) | "freeze" (mağaza payout dondur).
/// </summary>
public record ProblemDecideDto(string? Action, string? Note, string? CostPayer);

public record ProblemEventView(string Status, string ActorRole, string Note, DateTime CreatedAt);

public record ProblemView(
    long Id, long OrderId, string OrderNo, long UserId, string UserName,
    int? StoreId, string StoreName,
    string Reason, string Description, List<string> Photos,
    string Status, DateTime StoreDeadline, string StoreResponseNote, DateTime? StoreRespondedAt,
    bool ReturnRequired, string ReturnCostPayer, DateTime? ReturnStartedAt, DateTime? ReturnReceivedAt,
    string Resolution, DateTime? ResolvedAt, DateTime CreatedAt,
    List<ProblemEventView>? Events = null);
