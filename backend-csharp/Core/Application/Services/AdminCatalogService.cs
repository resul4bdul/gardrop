using Gardrop.Core.Application.Common;
using Gardrop.Core.Application.Common.Interfaces;
using Gardrop.Core.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Core.Application.Services;

/// <summary>Admin paneli kataloq əməliyyatları (məhsul/mağaza/kupon/kateqoriya) — EF (Scoped). Bax menfiler 3.1.</summary>
public class AdminCatalogService : IAdminCatalogService
{
    private readonly IAppDbContext _db;
    private readonly IRatingRecomputeQueue _rating;
    private readonly INotificationService _notify;
    private readonly IProductWriter _productWriter;
    public AdminCatalogService(IAppDbContext db, IRatingRecomputeQueue rating, INotificationService notify, IProductWriter productWriter)
    { _db = db; _rating = rating; _notify = notify; _productWriter = productWriter; }

    // ── Products ──

    public async Task<List<ProductView>> ProductsAsync(string? search, string? status, int? page = null, int? pageSize = null, CancellationToken ct = default)
    {
        var q = _db.Products.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            q = q.Where(p => p.Name.ToLower().Contains(s) || p.Store.ToLower().Contains(s));
        }
        if (!string.IsNullOrWhiteSpace(status))
        {
            var st = CatalogEnumParsing.ParseApprovalStatus(status);
            q = q.Where(p => p.ApprovalStatus == st);
        }
        return (await q.OrderBy(p => p.ApprovalStatus == ApprovalStatus.Pending ? 0 : 1)
            .ThenByDescending(p => p.Id).Page(page, pageSize).ToListAsync(ct)).ToViews();
    }

    public async Task<OpResult> SetApprovalAsync(int id, ApprovalDto dto, CancellationToken ct = default)
    {
        var p = await _db.Products.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (p is null) return OpResult.Fail(404, "Məhsul tapılmadı");
        if (dto.Status is not ("Approved" or "Rejected"))
            return OpResult.Fail(400, "Yanlış status");

        p.ApprovalStatus = CatalogEnumParsing.ParseApprovalStatus(dto.Status);
        p.RejectReason = dto.Status == "Rejected" ? (dto.Reason ?? "").Trim() : "";

        var ownerId = await _db.Stores.Where(s => s.Id == p.StoreId).Select(s => s.OwnerUserId).FirstOrDefaultAsync(ct);
        if (ownerId is { } oid)
        {
            if (dto.Status == "Approved")
                _notify.Notify(oid, "success", "Məhsul təsdiqləndi", $"\"{p.Name}\" məhsulunuz təsdiqləndi və artıq saytda görünür.");
            else
                _notify.Notify(oid, "error", "Məhsul rədd edildi",
                    $"\"{p.Name}\" məhsulunuz rədd edildi. Səbəb: {(string.IsNullOrWhiteSpace(p.RejectReason) ? "göstərilməyib" : p.RejectReason)}");
        }

        await _db.SaveChangesAsync(ct);
        _rating.Request();
        return OpResult.Ok(new AdminApprovalResult(p.Id, p.ApprovalStatus.ToString(), p.RejectReason));
    }

    public async Task<OpResult> CreateProductAsync(AdminProductDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) return OpResult.Fail(400, "Məhsul adı mütləqdir");
        var p = new Product();   // Id-ni DB identity verir (bax menfiler 2.3)
        _productWriter.Apply(p, dto);
        _db.Products.Add(p);
        await _db.SaveChangesAsync(ct);
        _rating.Request();
        return OpResult.Created(ProductView.From(p));
    }

    public async Task<OpResult> UpdateProductAsync(int id, AdminProductDto dto, CancellationToken ct = default)
    {
        var p = await _db.Products.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (p is null) return OpResult.Fail(404, "Məhsul tapılmadı");
        _productWriter.Apply(p, dto);
        await _db.SaveChangesAsync(ct);
        _rating.Request();
        return OpResult.Ok(ProductView.From(p));
    }

    public async Task<OpResult> BulkProductsAsync(BulkProductDto dto, CancellationToken ct = default)
    {
        var ids = (dto.Ids ?? new()).Distinct().ToList();
        if (ids.Count == 0) return OpResult.Fail(400, "Məhsul seçilməyib");
        var action = (dto.Action ?? "").ToLowerInvariant();
        if (action is not ("approve" or "reject" or "delete"))
            return OpResult.Fail(400, "Yanlış əməliyyat");
        if (action == "reject" && (dto.Reason ?? "").Trim().Length < 3)
            return OpResult.Fail(400, "Rədd səbəbini qeyd edin");

        var products = await _db.Products.Where(p => ids.Contains(p.Id)).ToListAsync(ct);
        var ownerByStore = await _db.Stores.AsNoTracking().Where(s => s.OwnerUserId != null)
            .ToDictionaryAsync(s => s.Id, s => s.OwnerUserId!.Value, ct);
        int affected = 0;

        foreach (var p in products)
        {
            ownerByStore.TryGetValue(p.StoreId, out var ownerId);
            if (action == "delete")
            {
                _db.RemoveProductWithDependents(p);
                if (ownerId != 0) _notify.Notify(ownerId, "error", "Məhsul silindi", $"\"{p.Name}\" məhsulunuz admin tərəfindən silindi.");
            }
            else if (action == "approve")
            {
                p.ApprovalStatus = ApprovalStatus.Approved; p.RejectReason = "";
                if (ownerId != 0) _notify.Notify(ownerId, "success", "Məhsul təsdiqləndi", $"\"{p.Name}\" məhsulunuz təsdiqləndi və artıq saytda görünür.");
            }
            else
            {
                p.ApprovalStatus = ApprovalStatus.Rejected; p.RejectReason = dto.Reason!.Trim();
                if (ownerId != 0) _notify.Notify(ownerId, "error", "Məhsul rədd edildi", $"\"{p.Name}\" məhsulunuz rədd edildi. Səbəb: {p.RejectReason}");
            }
            affected++;
        }

        await _db.SaveChangesAsync(ct);
        _rating.Request();
        return OpResult.Ok(new AffectedResult(affected));
    }

    public async Task<OpResult> DeleteProductAsync(int id, CancellationToken ct = default)
    {
        var p = await _db.Products.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (p is null) return OpResult.Fail(404, "Məhsul tapılmadı");
        // Asılı səbət/seçilmiş sətirlərini də sil (orfan qalmasın — bax menfiler 2.6).
        _db.RemoveProductWithDependents(p);
        await _db.SaveChangesAsync(ct);
        _rating.Request();
        return OpResult.Ok(new OkResult());
    }

    // ── Stores ──

    public async Task<List<AdminStoreView>> StoresAsync(CancellationToken ct = default)
    {
        var stores = await _db.Stores.AsNoTracking().OrderBy(s => s.Id).ToListAsync(ct);
        var owners = await _db.Users.AsNoTracking()
            .Where(u => stores.Select(s => s.OwnerUserId).Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.Email, ct);
        return stores.Select(s => new AdminStoreView(
            s.Id, s.Name, s.Rating, s.Reviews, s.Products, s.City, s.Established,
            s.Lat, s.Lng, s.Address, s.Logo, s.OwnerUserId,
            OwnerEmail: s.OwnerUserId is { } oid && owners.TryGetValue(oid, out var e) ? e : null)).ToList();
    }

    public async Task<OpResult> CreateStoreAsync(AdminStoreDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) return OpResult.Fail(400, "Mağaza adı mütləqdir");
        var s = new Store();   // Id-ni DB identity verir (bax menfiler 2.3)
        ApplyStore(s, dto);
        if (!await ResolveOwnerAsync(s, dto, ct)) return OpResult.Fail(400, "Bu e-poçtla istifadəçi tapılmadı");
        _db.Stores.Add(s);
        await _db.SaveChangesAsync(ct);
        return OpResult.Created(StoreView.From(s));
    }

    public async Task<OpResult> UpdateStoreAsync(int id, AdminStoreDto dto, CancellationToken ct = default)
    {
        var s = await _db.Stores.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (s is null) return OpResult.Fail(404, "Mağaza tapılmadı");
        ApplyStore(s, dto);
        if (!await ResolveOwnerAsync(s, dto, ct)) return OpResult.Fail(400, "Bu e-poçtla istifadəçi tapılmadı");
        await _db.SaveChangesAsync(ct);
        return OpResult.Ok(StoreView.From(s));
    }

    public async Task<OpResult> DeleteStoreAsync(int id, CancellationToken ct = default)
    {
        var s = await _db.Stores.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (s is null) return OpResult.Fail(404, "Mağaza tapılmadı");
        _db.Stores.Remove(s);
        await _db.SaveChangesAsync(ct);
        return OpResult.Ok(new OkResult());
    }

    private async Task<bool> ResolveOwnerAsync(Store s, AdminStoreDto dto, CancellationToken ct = default)
    {
        if (dto.OwnerEmail is null) return true;
        var email = dto.OwnerEmail.Trim().ToLowerInvariant();
        if (email.Length == 0) { s.OwnerUserId = null; return true; }
        var u = await _db.Users.FirstOrDefaultAsync(x => x.Email == email, ct);
        if (u is null) return false;
        s.OwnerUserId = u.Id;
        return true;
    }

    private static void ApplyStore(Store s, AdminStoreDto d)
    {
        if (d.Name is not null) s.Name = d.Name;
        if (d.Rating.HasValue) s.Rating = d.Rating.Value;
        if (d.Reviews.HasValue) s.Reviews = d.Reviews.Value;
        if (d.Products.HasValue) s.Products = d.Products.Value;
        if (d.City is not null) s.City = d.City;
        if (d.Established.HasValue) s.Established = d.Established.Value;
        if (d.Lat.HasValue) s.Lat = d.Lat.Value;
        if (d.Lng.HasValue) s.Lng = d.Lng.Value;
        if (d.Address is not null) s.Address = d.Address.Trim();
        if (d.Logo is not null) s.Logo = d.Logo.Trim();
        if (d.OwnerUserId.HasValue) s.OwnerUserId = d.OwnerUserId.Value == 0 ? null : d.OwnerUserId.Value;
    }

    // ── Coupons ──

    public async Task<List<CouponView>> CouponsAsync(CancellationToken ct = default) =>
        (await _db.Coupons.AsNoTracking().OrderByDescending(c => c.Id).ToListAsync(ct)).ToViews();

    public async Task<OpResult> CreateCouponAsync(AdminCouponDto dto, CancellationToken ct = default)
    {
        var code = (dto.Code ?? "").Trim().ToUpperInvariant();
        if (code.Length == 0) return OpResult.Fail(400, "Kupon kodu mütləqdir");
        if (await _db.Coupons.AnyAsync(c => c.Code == code, ct)) return OpResult.Fail(400, "Bu kod artıq var");

        var c = new Coupon { Code = code };
        ApplyCoupon(c, dto);
        _db.Coupons.Add(c);
        await _db.SaveChangesAsync(ct);
        return OpResult.Created(CouponView.From(c));
    }

    public async Task<OpResult> UpdateCouponAsync(long id, AdminCouponDto dto, CancellationToken ct = default)
    {
        var c = await _db.Coupons.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (c is null) return OpResult.Fail(404, "Kupon tapılmadı");

        if (!string.IsNullOrWhiteSpace(dto.Code))
        {
            var code = dto.Code.Trim().ToUpperInvariant();
            if (code != c.Code && await _db.Coupons.AnyAsync(x => x.Code == code, ct))
                return OpResult.Fail(400, "Bu kod artıq var");
            c.Code = code;
        }
        ApplyCoupon(c, dto);
        await _db.SaveChangesAsync(ct);
        return OpResult.Ok(CouponView.From(c));
    }

    public async Task<OpResult> DeleteCouponAsync(long id, CancellationToken ct = default)
    {
        var c = await _db.Coupons.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (c is null) return OpResult.Fail(404, "Kupon tapılmadı");
        _db.Coupons.Remove(c);
        await _db.SaveChangesAsync(ct);
        return OpResult.Ok(new OkResult());
    }

    private static void ApplyCoupon(Coupon c, AdminCouponDto d)
    {
        if (d.Type is not null) c.Type = CatalogEnumParsing.ParseCouponType(d.Type);
        if (d.Value.HasValue) c.Value = Math.Max(0, d.Value.Value);
        if (d.MinOrder.HasValue) c.MinOrder = Math.Max(0, d.MinOrder.Value);
        if (d.Active.HasValue) c.Active = d.Active.Value;
        c.ExpiresAt = d.ExpiresAt;
        c.MaxUses = d.MaxUses;
    }

    // ── Categories ──

    public async Task<List<CategoryView>> CategoriesAsync(CancellationToken ct = default)
    {
        var cats = await _db.Categories.AsNoTracking().ToListAsync(ct);
        var counts = await _db.Products.GroupBy(p => p.Category)
            .Select(g => new { Cat = g.Key, N = g.Count() }).ToDictionaryAsync(x => x.Cat, x => x.N, ct);
        foreach (var c in cats) c.Count = counts.GetValueOrDefault(c.Name);
        return cats.ToViews();
    }

    public async Task<OpResult> CreateCategoryAsync(AdminCategoryDto dto, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) return OpResult.Fail(400, "Kateqoriya adı mütləqdir");
        if (await _db.Categories.AnyAsync(c => c.Name == dto.Name, ct)) return OpResult.Fail(400, "Bu adda kateqoriya artıq var");

        var c = new Category { Name = dto.Name.Trim() };
        ApplyCategory(c, dto);
        _db.Categories.Add(c);
        await _db.SaveChangesAsync(ct);
        return OpResult.Created(CategoryView.From(c));
    }

    public async Task<OpResult> UpdateCategoryAsync(string name, AdminCategoryDto dto, CancellationToken ct = default)
    {
        var c = await _db.Categories.FirstOrDefaultAsync(x => x.Name == name, ct);
        if (c is null) return OpResult.Fail(404, "Kateqoriya tapılmadı");
        ApplyCategory(c, dto);
        await _db.SaveChangesAsync(ct);
        return OpResult.Ok(CategoryView.From(c));
    }

    public async Task<OpResult> DeleteCategoryAsync(string name, CancellationToken ct = default)
    {
        var c = await _db.Categories.FirstOrDefaultAsync(x => x.Name == name, ct);
        if (c is null) return OpResult.Fail(404, "Kateqoriya tapılmadı");
        _db.Categories.Remove(c);
        await _db.SaveChangesAsync(ct);
        return OpResult.Ok(new OkResult());
    }

    private static void ApplyCategory(Category c, AdminCategoryDto dto)
    {
        if (dto.Tree is not null)
        {
            c.Tree = dto.Tree.Where(t => !string.IsNullOrWhiteSpace(t.Name))
                .Select(t => new SubcategoryNode
                {
                    Name = t.Name!.Trim(),
                    Children = (t.Children ?? new()).Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim()).ToList(),
                }).ToList();
            c.Subcategories = c.Tree.Select(t => t.Name).ToList();
        }
        else if (dto.Subcategories is not null)
        {
            c.Subcategories = dto.Subcategories;
            c.Tree = dto.Subcategories.Select(s => new SubcategoryNode { Name = s }).ToList();
        }
    }
}
