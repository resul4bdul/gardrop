using Gardrop.Core.Application.Common;

namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>Ölçü tövsiyəsi orkestrasiyası (user+product yüklə → recommender) — bax menfiler D1/D2.</summary>
public interface ISizeService
{
    Task<OpResult> RecommendAsync(long userId, int productId, CancellationToken ct = default);
}
