using Gardrop.Core.Application.Common;
using Gardrop.Core.Application.Common.DTOs;

namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>
/// Sifariş problemləri (geri qaytarma/şikayət — Trendyol modeli): müştəri açır (14 gün pəncərə),
/// satıcı 48 saatda qəbul/rədd edir (bitərsə auto-arbitraj), admin arbitraj + qaytarma
/// kuryer xərci qərarı verir. Köhnə IDisputeService axınını əvəz edir.
/// </summary>
public interface IProblemService
{
    // Müştəri
    Task<OpResult> CreateAsync(long userId, long orderId, ProblemCreateDto dto, CancellationToken ct = default);
    Task<List<ProblemView>> MyAsync(long userId, CancellationToken ct = default);
    Task<OpResult> GetAsync(long userId, long problemId, CancellationToken ct = default);
    Task<OpResult> CancelAsync(long userId, long problemId, CancellationToken ct = default);

    // Satıcı
    Task<OpResult> StoreListAsync(long uid, int storeId, CancellationToken ct = default);
    Task<OpResult> StoreRespondAsync(long uid, int storeId, long problemId, ProblemStoreRespondDto dto, CancellationToken ct = default);
    Task<OpResult> StoreReceivedAsync(long uid, int storeId, long problemId, CancellationToken ct = default);

    // Admin
    Task<List<ProblemView>> AdminListAsync(string? status, CancellationToken ct = default);
    Task<OpResult> AdminDecideAsync(long adminId, long problemId, ProblemDecideDto dto, CancellationToken ct = default);

    /// <summary>48 saatı bitmiş "Satıcı cavabı gözlənilir" problemləri arbitraja keçirir (fon sweep).</summary>
    Task<int> EscalateOverdueAsync(CancellationToken ct = default);
}
