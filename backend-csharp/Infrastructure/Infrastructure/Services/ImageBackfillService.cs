using Gardrop.Core.Application.Common.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Gardrop.Infrastructure.Services;

/// <summary>
/// Local uploads/-dakı köhnə .jpg/.png məhsul şəkillərini WebP+thumbnail-a çevirir və
/// məhsulun ImageUrls-ini yeni URL ilə əvəzləyir. Bir-dəfəlik admin əməliyyatı; idempotent.
/// </summary>
public class ImageBackfillService : IImageBackfillService
{
    private readonly IAppDbContext _db;
    private readonly IImageProcessor _images;
    private readonly IStorageService _storage;
    private readonly string _uploadsRoot;
    private readonly bool _isLocal;

    public ImageBackfillService(IAppDbContext db, IImageProcessor images, IStorageService storage,
        IConfiguration cfg, IWebHostEnvironment env)
    {
        _db = db; _images = images; _storage = storage;
        _uploadsRoot = UploadsPath.Resolve(cfg, env.ContentRootPath);
        _isLocal = !string.Equals(cfg["Storage:Provider"], "S3", StringComparison.OrdinalIgnoreCase);
    }

    public async Task<ImageBackfillResult> BackfillAsync(CancellationToken ct = default)
    {
        var provider = _isLocal ? "Local" : "S3";
        if (!_isLocal) return new ImageBackfillResult(0, 0, 0, 0, provider); // yalnız Local

        var products = await _db.Products.ToListAsync(ct);
        int scanned = 0, converted = 0, skipped = 0, changedProducts = 0;

        foreach (var p in products)
        {
            var changed = false;
            for (var i = 0; i < p.ImageUrls.Count; i++)
            {
                var url = p.ImageUrls[i];
                scanned++;
                // Yalnız local /uploads/ altındakı optimizasiya olunmamış rastr şəkillər.
                if (!url.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase)) { skipped++; continue; }
                var ext = Path.GetExtension(url).ToLowerInvariant();
                if (ext is not (".jpg" or ".jpeg" or ".png")) { skipped++; continue; } // .webp/.gif keç

                var rel = url["/uploads/".Length..].Replace('/', Path.DirectorySeparatorChar);
                var path = Path.Combine(_uploadsRoot, rel);
                if (!File.Exists(path)) { skipped++; continue; }

                await using var fs = File.OpenRead(path);
                var pi = await _images.ProcessAsync(fs, ct);
                var id = Guid.NewGuid().ToString("N");
                var newUrl = await _storage.UploadRawAsync(pi.Full, $"{id}{pi.Extension}", pi.ContentType, ct);
                await _storage.UploadRawAsync(pi.Thumb, $"{id}_thumb{pi.Extension}", pi.ContentType, ct);
                p.ImageUrls[i] = newUrl;
                converted++; changed = true;
            }
            if (changed)
            {
                p.Images = p.ImageUrls.Count;
                changedProducts++;
            }
        }

        if (changedProducts > 0) await _db.SaveChangesAsync(ct);
        return new ImageBackfillResult(changedProducts, scanned, converted, skipped, provider);
    }
}
