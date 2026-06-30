using Gardrop.Core.Application.Common;
using Gardrop.Core.Application.Common.Interfaces;
using Gardrop.Core.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Core.Application.Services;

/// <summary>Rəy əməliyyatları — biznes qaydaları (çatdırılma yoxlaması, təkrar, reytinq) (Scoped).</summary>
public class ReviewService : IReviewService
{
    private readonly IAppDbContext _db;
    private readonly IRatingRecomputeQueue _rating;
    public ReviewService(IAppDbContext db, IRatingRecomputeQueue rating) { _db = db; _rating = rating; }

    public async Task<List<ReviewView>> GetForProductAsync(int productId, CancellationToken ct = default) =>
        (await _db.Reviews.AsNoTracking()
            .Where(r => r.ProductId == productId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(ct)).ToViews();

    public async Task<ReviewEligibility> EligibleAsync(long userId, CancellationToken ct = default)
    {
        var delivered = await DeliveredProductIdsAsync(userId, ct);
        var reviewed = await _db.Reviews.AsNoTracking()
            .Where(r => r.UserId == userId).Select(r => r.ProductId).ToListAsync(ct);
        var pending = delivered.Except(reviewed).ToList();
        return new ReviewEligibility(delivered, reviewed, pending);
    }

    public async Task<OpResult> CreateAsync(long userId, int productId, ReviewDto dto, CancellationToken ct = default)
    {
        if (!await _db.Products.AnyAsync(p => p.Id == productId, ct))
            return OpResult.Fail(404, "Məhsul tapılmadı");

        var delivered = await DeliveredProductIdsAsync(userId, ct);
        if (!delivered.Contains(productId))
            return OpResult.Fail(403, "Rəy yalnız aldığınız və çatdırılmış məhsula verilə bilər");

        if (await _db.Reviews.AnyAsync(r => r.UserId == userId && r.ProductId == productId, ct))
            return OpResult.Fail(400, "Bu məhsula artıq rəy vermisiniz");

        var r = dto.Rating ?? 0;
        if (r < 1 || r > 5)
            return OpResult.Fail(400, "Reytinq 1-5 arası olmalıdır");

        var user = await _db.Users.FindAsync([userId], ct);
        var soyadInitial = string.IsNullOrEmpty(user?.LastName) ? "" : user!.LastName[..1] + ".";

        var review = new Review
        {
            ProductId = productId,
            UserId = userId,
            UserName = $"{user?.FirstName} {soyadInitial}".Trim(),
            Rating = r,
            Comment = (dto.Comment ?? "").Trim(),
            ImageUrls = (dto.ImageUrls ?? new()).Where(u => !string.IsNullOrWhiteSpace(u)).Select(u => u.Trim()).Take(5).ToList(),
            CreatedAt = DateTime.UtcNow,
        };
        _db.Reviews.Add(review);
        await _db.SaveChangesAsync(ct);
        _rating.Request();  // məhsul + mağaza reytinqini yenilə (fon)
        return OpResult.Created(ReviewView.From(review));
    }

    /// <summary>İstifadəçinin çatdırılmış sifarişlərindəki məhsul id-ləri (relyasion, bax menfiler 2.2).</summary>
    private async Task<List<int>> DeliveredProductIdsAsync(long userId, CancellationToken ct = default) =>
        await _db.OrderItems.AsNoTracking()
            .Where(oi => oi.Order!.UserId == userId && oi.Order.Status == OrderStatus.Delivered && oi.ProductId != 0)
            .Select(oi => oi.ProductId).Distinct().ToListAsync(ct);
}
