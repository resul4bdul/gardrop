using Gardrop.Core.Application.Common;

namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>Rəy əməliyyatları — biznes qaydaları (çatdırılma yoxlaması, təkrar, reytinq) Application qatında.</summary>
public interface IReviewService
{
    Task<List<ReviewView>> GetForProductAsync(int productId, CancellationToken ct = default);

    /// <summary>Çatdırılmış / rəy verilmiş / gözləyən məhsul id-ləri.</summary>
    Task<ReviewEligibility> EligibleAsync(long userId, CancellationToken ct = default);

    Task<OpResult> CreateAsync(long userId, int productId, ReviewDto dto, CancellationToken ct = default);
}
