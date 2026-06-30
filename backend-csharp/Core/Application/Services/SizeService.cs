using Gardrop.Core.Application.Common;
using Gardrop.Core.Application.Common.Interfaces;

namespace Gardrop.Core.Application.Services;

/// <summary>Ölçü tövsiyəsi orkestrasiyası (Scoped) — user+product yükləyib recommender-ə ötürür.</summary>
public class SizeService : ISizeService
{
    private readonly IAppDbContext _db;
    private readonly ISizeRecommender _recommender;
    public SizeService(IAppDbContext db, ISizeRecommender recommender) { _db = db; _recommender = recommender; }

    public async Task<OpResult> RecommendAsync(long userId, int productId, CancellationToken ct = default)
    {
        var user = await _db.Users.FindAsync([userId], ct);
        if (user is null) return OpResult.Fail(401, "İstifadəçi tapılmadı");
        var product = await _db.Products.FindAsync([productId], ct);
        if (product is null) return OpResult.Fail(404, "Məhsul tapılmadı");
        return OpResult.Ok(_recommender.Recommend(user, product));
    }
}
