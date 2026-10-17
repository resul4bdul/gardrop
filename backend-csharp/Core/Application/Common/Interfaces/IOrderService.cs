using Gardrop.Core.Application.Common;

namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>Müştəri sifariş əməliyyatları — biznes məntiqi (qiymət, çatdırılma, kupon, ləğv) Application qatında.</summary>
public interface IOrderService
{
    Task<OpResult> CreateAsync(long userId, OrderDto dto, CancellationToken ct = default);
    Task<List<OrderView>> ListAsync(long userId, int? page = null, int? pageSize = null, CancellationToken ct = default);
    Task<OrderView?> GetAsync(long userId, long id, CancellationToken ct = default);
    Task<OpResult> CancelAsync(long userId, long id, CancelDto? dto, CancellationToken ct = default);
}
