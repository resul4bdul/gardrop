using Gardrop.Core.Application.Common;
using Gardrop.Core.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Core.Application.Services;

/// <summary>Admin paneli rəy əməliyyatları — EF (Scoped). Bax menfiler 3.1.</summary>
public class AdminReviewService : IAdminReviewService
{
    private readonly IAppDbContext _db;
    private readonly IRatingRecomputeQueue _rating;
    public AdminReviewService(IAppDbContext db, IRatingRecomputeQueue rating) { _db = db; _rating = rating; }

    public async Task<List<ReviewView>> ReviewsAsync(int? productId, CancellationToken ct = default)
    {
        var q = _db.Reviews.AsNoTracking().AsQueryable();
        if (productId.HasValue) q = q.Where(r => r.ProductId == productId.Value);
        return (await q.OrderByDescending(r => r.CreatedAt).ToListAsync(ct)).ToViews();
    }

    public async Task<OpResult> DeleteReviewAsync(long id, CancellationToken ct = default)
    {
        var r = await _db.Reviews.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (r is null) return OpResult.Fail(404, "Rəy tapılmadı");
        _db.Reviews.Remove(r);
        await _db.SaveChangesAsync(ct);
        _rating.Request();
        return OpResult.Ok(new OkResult());
    }
}
