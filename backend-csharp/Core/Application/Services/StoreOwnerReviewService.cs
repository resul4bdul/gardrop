using Gardrop.Core.Application.Common;
using Gardrop.Core.Application.Common.Helpers;
using Gardrop.Core.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Core.Application.Services;

/// <summary>Satıcı paneli — rəy idarəsi (Scoped). Bax menfiler 3.1.</summary>
public class StoreOwnerReviewService : StoreOwnerServiceBase, IStoreOwnerReviewService
{
    private readonly INotificationService _notify;
    public StoreOwnerReviewService(IAppDbContext db, INotificationService notify) : base(db) { _notify = notify; }

    public async Task<OpResult> ReviewsAsync(long userId, int storeId, CancellationToken ct = default)
    {
        var s = await OwnedAsync(userId, storeId, ct);
        if (s is null) return NotOwned;

        var prodNames = await _db.Products.AsNoTracking()
            .Where(p => p.StoreId == storeId).ToDictionaryAsync(p => p.Id, p => p.Name, ct);
        var ids = prodNames.Keys.ToList();
        var reviews = await _db.Reviews.AsNoTracking()
            .Where(r => ids.Contains(r.ProductId))
            .OrderByDescending(r => r.CreatedAt).ToListAsync(ct);

        return OpResult.Ok(reviews.Select(r => new StoreReviewView(
            r.Id, r.ProductId, prodNames.GetValueOrDefault(r.ProductId, "—"),
            r.UserName, r.Rating, r.Comment, r.ImageUrls, r.CreatedAt,
            r.StoreReply, r.StoreReplyAt)).ToList());
    }

    public async Task<OpResult> ReplyReviewAsync(long userId, int storeId, long reviewId, ReviewReplyDto dto, CancellationToken ct = default)
    {
        var s = await OwnedAsync(userId, storeId, ct);
        if (s is null) return NotOwned;

        var r = await _db.Reviews.FirstOrDefaultAsync(x => x.Id == reviewId, ct);
        if (r is null) return OpResult.Fail(404, "Rəy tapılmadı");
        var belongs = await _db.Products.AnyAsync(p => p.Id == r.ProductId && p.StoreId == storeId, ct);
        if (!belongs) return OpResult.Fail(403, "Bu rəy sizin mağazanıza aid deyil");

        var reply = InputSanitizer.CleanMultiline(dto.Reply);
        r.StoreReply = reply;
        r.StoreReplyAt = reply.Length > 0 ? DateTime.UtcNow : null;
        if (reply.Length > 0)
            _notify.Notify(r.UserId, "info", "Rəyinizə cavab", $"\"{s.Name}\" mağazası rəyinizə cavab yazdı.");
        await _db.SaveChangesAsync(ct);
        return OpResult.Ok(new StoreReplyResult(r.Id, r.StoreReply, r.StoreReplyAt));
    }
}
