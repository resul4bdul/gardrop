using Gardrop.Core.Application.Common;

namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>Admin paneli — rəy idarəsi (bax menfiler 3.1).</summary>
public interface IAdminReviewService
{
    Task<List<ReviewView>> ReviewsAsync(int? productId, CancellationToken ct = default);
    Task<OpResult> DeleteReviewAsync(long id, CancellationToken ct = default);
}
