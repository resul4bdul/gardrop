using Gardrop.Core.Application.Common.Interfaces;
using Gardrop.Core.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Core.Application.Services;

/// <summary>Kateqoriya kataloqu — Count təsdiqlənmiş məhsullardan dinamik (Scoped).</summary>
public class CategoryService : ICategoryService
{
    private readonly IAppDbContext _db;
    public CategoryService(IAppDbContext db) => _db = db;

    public async Task<List<CategoryView>> ListWithCountsAsync(CancellationToken ct = default)
    {
        var cats = await _db.Categories.AsNoTracking().ToListAsync(ct);
        var counts = await _db.Products.Where(p => p.ApprovalStatus == ApprovalStatus.Approved).GroupBy(p => p.Category)
            .Select(g => new { Cat = g.Key, N = g.Count() }).ToDictionaryAsync(x => x.Cat, x => x.N, ct);
        foreach (var c in cats) c.Count = counts.GetValueOrDefault(c.Name);
        return cats.ToViews();
    }
}
