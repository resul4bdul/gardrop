using Gardrop.Core.Application.Common;

namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>Admin paneli — sifariş idarəsi (bax menfiler 3.1).</summary>
public interface IAdminOrderService
{
    Task<List<AdminOrderView>> OrdersAsync(string? status, CancellationToken ct = default);
    Task<OpResult> UpdateOrderStatusAsync(long id, AdminOrderStatusDto dto, CancellationToken ct = default);
    Task<OpResult> DeleteOrderAsync(long id, CancellationToken ct = default);
}
