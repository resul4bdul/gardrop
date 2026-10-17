using Gardrop.Core.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Core.Application.Common.Helpers;

/// <summary>Məhsul slug-unu unikal edir: baza slug tutulubsa -2, -3 … əlavə edir.</summary>
public static class SlugExtensions
{
    public static async Task<string> UniqueProductSlugAsync(this IAppDbContext db, string name, CancellationToken ct = default)
    {
        var baseSlug = SlugHelper.Generate(name);
        if (baseSlug.Length == 0) baseSlug = "mehsul";

        var slug = baseSlug;
        var i = 2;
        // Filtrlənmiş unikal indeks yalnız IsDeleted=false sətirləri qoruyur — eyni sorğu filtri.
        while (await db.Products.AnyAsync(p => p.Slug == slug, ct))
            slug = $"{baseSlug}-{i++}";
        return slug;
    }
}
