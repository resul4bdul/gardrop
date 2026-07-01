using Gardrop.Core.Application.Common;
using Gardrop.Core.Application.Common.DTOs;
using Gardrop.Core.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Core.Application.Services;

/// <summary>
/// Ölçü tövsiyəsi orkestrasiyası (Scoped) — user+product yalnız lazım olan sahələri EF .Select ilə
/// yüngül DTO-ya proyeksiya edir (ağır entity yüklənmir), sonra recommender-ə ötürür.
/// </summary>
public class SizeService : ISizeService
{
    private readonly IAppDbContext _db;
    private readonly ISizeRecommender _recommender;
    public SizeService(IAppDbContext db, ISizeRecommender recommender) { _db = db; _recommender = recommender; }

    public async Task<OpResult> RecommendAsync(long userId, int productId, CancellationToken ct = default)
    {
        var user = await _db.Users.AsNoTracking().Where(u => u.Id == userId)
            .Select(u => new UserSizeDto(
                u.Gender, u.Height, u.Weight, u.Chest, u.Waist, u.Hip, u.ShoeSize, u.Age,
                u.ChestFit, u.WaistFit, u.BellyFit, u.HipFit, u.FootFit, u.FitPreference))
            .FirstOrDefaultAsync(ct);
        if (user is null) return OpResult.Fail(401, "İstifadəçi tapılmadı");

        var product = await _db.Products.AsNoTracking().Where(p => p.Id == productId)
            .Select(p => new ProductSizeDto(
                p.Category, p.Subcategory, p.Gender, p.SizeSystem, p.Sizes, p.Size,
                p.FitType, p.Stretch, p.SizeBehavior, p.Brand, p.Material, p.WashShrink, p.SizeChart))
            .FirstOrDefaultAsync(ct);
        if (product is null) return OpResult.Fail(404, "Məhsul tapılmadı");

        return OpResult.Ok(_recommender.Recommend(user, product));
    }
}
