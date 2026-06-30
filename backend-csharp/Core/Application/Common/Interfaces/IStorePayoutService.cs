using Gardrop.Core.Application.Common;
using Gardrop.Core.Application.Common.DTOs;

namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>Mağazaya ödəniş (payout/settlement) idarəsi — admin yaradır/silir, satıcı tarixçəni FinanceAsync-də görür.</summary>
public interface IStorePayoutService
{
    Task<List<PayoutView>> ListAsync(int storeId, CancellationToken ct = default);
    Task<OpResult> CreateAsync(AdminPayoutDto dto, CancellationToken ct = default);
    Task<OpResult> DeleteAsync(long id, CancellationToken ct = default);
}
