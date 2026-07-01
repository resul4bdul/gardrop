using Gardrop.Core.Application.Common;
using Gardrop.Core.Application.Common.Interfaces;
using Gardrop.Core.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Core.Application.Services;

/// <summary>Satıcı paneli — məhsul idarəsi (Scoped). Yeni/redaktə məhsul admin təsdiqinə düşür. Bax menfiler 3.1.</summary>
public class StoreOwnerProductService : StoreOwnerServiceBase, IStoreOwnerProductService
{
    private readonly IRatingRecomputeQueue _rating;
    private readonly INotificationService _notify;
    private readonly IProductWriter _productWriter;
    private readonly IActivityLogService _activity;
    public StoreOwnerProductService(IAppDbContext db, IRatingRecomputeQueue rating, INotificationService notify, IProductWriter productWriter, IActivityLogService activity)
        : base(db) { _rating = rating; _notify = notify; _productWriter = productWriter; _activity = activity; }

    public async Task<OpResult> ProductsAsync(long userId, int storeId, string? search, CancellationToken ct = default)
    {
        var s = await OwnedAsync(userId, storeId, ct);
        if (s is null) return NotOwned;

        var q = _db.Products.AsNoTracking().Where(p => p.StoreId == storeId);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var t = search.Trim().ToLower();
            q = q.Where(p => p.Name.ToLower().Contains(t));
        }
        return OpResult.Ok(await q.OrderByDescending(p => p.Id).ToListAsync(ct));
    }

    public async Task<OpResult> CreateProductAsync(long userId, int storeId, AdminProductDto dto, CancellationToken ct = default)
    {
        var s = await OwnedAsync(userId, storeId, ct);
        if (s is null) return NotOwned;
        if (string.IsNullOrWhiteSpace(dto.Name)) return OpResult.Fail(400, "Məhsul adı mütləqdir");

        var p = new Product();   // Id-ni DB identity verir (bax menfiler 2.3)
        _productWriter.Apply(p, dto);
        p.StoreId = storeId; p.Store = s.Name;   // mağaza məcburi öz mağazasıdır
        p.ApprovalStatus = ApprovalStatus.Pending;  // yeni məhsul admin təsdiqini gözləyir
        p.RejectReason = "";
        _db.Products.Add(p);
        // Qaralama isə admin təsdiqinə düşmür — bildiriş göndərilmir.
        if (!p.IsDraft)
            _notify.Notify(userId, "info", "Məhsul yükləndi",
                $"\"{p.Name}\" məhsulunuz yükləndi və admin təsdiqini gözləyir. Təsdiqlənənə qədər saytda görünməyəcək.");
        await _db.SaveChangesAsync(ct);
        _activity.Log(userId, s.Name, "product.create", "product", p.Id.ToString(), $"«{p.Name}» yükləndi (qiymət {p.Price} ₼)");
        await _db.SaveChangesAsync(ct);
        _rating.Request();
        return OpResult.Created(p);
    }

    public async Task<OpResult> UpdateProductAsync(long userId, int storeId, int productId, AdminProductDto dto, CancellationToken ct = default)
    {
        var s = await OwnedAsync(userId, storeId, ct);
        if (s is null) return NotOwned;
        var p = await _db.Products.FirstOrDefaultAsync(x => x.Id == productId && x.StoreId == storeId, ct);
        if (p is null) return OpResult.Fail(404, "Məhsul tapılmadı");

        var oldPrice = p.Price;
        _productWriter.Apply(p, dto);
        p.StoreId = storeId; p.Store = s.Name;   // başqa mağazaya köçürməyə icazə yoxdur
        p.ApprovalStatus = ApprovalStatus.Pending;  // redaktə sonrası yenidən təsdiqə düşür
        p.RejectReason = "";
        // Qaralama isə admin təsdiqinə düşmür — bildiriş göndərilmir.
        if (!p.IsDraft)
            _notify.Notify(userId, "info", "Məhsul yeniləndi",
                $"\"{p.Name}\" məhsulunda dəyişiklik yenidən admin təsdiqini gözləyir.");
        var priceNote = oldPrice != p.Price ? $"qiymət {oldPrice} → {p.Price} ₼" : $"qiymət {p.Price} ₼";
        _activity.Log(userId, s.Name, "product.update", "product", p.Id.ToString(), $"«{p.Name}» yeniləndi ({priceNote})");
        await _db.SaveChangesAsync(ct);
        _rating.Request();
        return OpResult.Ok(p);
    }

    public async Task<OpResult> DeleteProductAsync(long userId, int storeId, int productId, CancellationToken ct = default)
    {
        var s = await OwnedAsync(userId, storeId, ct);
        if (s is null) return NotOwned;
        var p = await _db.Products.FirstOrDefaultAsync(x => x.Id == productId && x.StoreId == storeId, ct);
        if (p is null) return OpResult.Fail(404, "Məhsul tapılmadı");
        // Asılı səbət/seçilmiş sətirlərini də sil (orfan qalmasın — bax menfiler 2.6).
        _db.RemoveProductWithDependents(p);
        await _db.SaveChangesAsync(ct);
        _rating.Request();
        return OpResult.Ok(new OkResult());
    }
}
