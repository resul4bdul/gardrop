namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>Sifariş statusu + stok düzəlişləri (admin və mağaza paneli üçün ortaq məntiq).</summary>
public interface IOrderStatusService
{
    IReadOnlyList<string> Statuses { get; }
    IReadOnlyList<string> StoreAllowedStatuses { get; }
    bool IsValidStatus(string? status);

    /// <summary>Statusu dəyişir: zaman damğaları + stok azalt/qaytar (idempotent).</summary>
    Task ApplyStatusAsync(Order order, string status, string? cancelReason = null, string? cancelledBy = null, CancellationToken ct = default);
}
