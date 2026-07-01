using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Gardrop.Core.Application.Common.Interfaces;

namespace Gardrop.Presentation.Controllers;

/// <summary>
/// Cihazdan şəkil yükləmə. Fayllar IStorageService abstraksiyası üzərindən yazılır
/// (lokal disk → uploads/) və statik fayl middleware-i onları eyni domaindən verir.
/// Production-da yalnız IStorageService implementasiyası (MinIO/S3) dəyişir.
/// </summary>
[ApiController]
[Authorize]
[Route("api/upload")]
public class UploadController : ControllerBase
{
    private static readonly string[] Allowed = { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
    private const long MaxBytes = 15 * 1024 * 1024; // 15 MB (keyfiyyətli mağaza şəkilləri)

    private readonly IStorageService _storage;
    private readonly IImageProcessor _images;
    public UploadController(IStorageService storage, IImageProcessor images)
    { _storage = storage; _images = images; }

    // POST /api/upload  (multipart/form-data, sahə adı: file və ya files)
    [HttpPost]
    [RequestSizeLimit(160 * 1024 * 1024)] // 8 fayl × ~15 MB üçün başlıq payı ilə
    [RequestFormLimits(MultipartBodyLengthLimit = 160L * 1024 * 1024)] // default 128 MB-i qaldır
    public async Task<IActionResult> Upload([FromForm] List<IFormFile>? files, IFormFile? file, CancellationToken ct)
    {
        var all = new List<IFormFile>();
        if (files is not null) all.AddRange(files);
        if (file is not null) all.Add(file);
        if (all.Count == 0) return BadRequest(new { error = "Fayl seçilməyib" });

        var urls = new List<string>();
        foreach (var f in all)
        {
            if (f.Length == 0) continue;
            if (f.Length > MaxBytes)
                return BadRequest(new { error = $"Fayl çox böyükdür (maks 15 MB): {f.FileName}" });

            var ext = Path.GetExtension(f.FileName).ToLowerInvariant();
            if (!Allowed.Contains(ext))
                return BadRequest(new { error = $"Dəstəklənməyən format: {ext}. Yalnız şəkil (jpg/png/webp/gif)." });

            await using var stream = f.OpenReadStream();

            if (_images.CanProcess(f.ContentType, f.FileName))
            {
                // Sıxma + WebP + thumbnail: X.webp (tam) və X_thumb.webp (kart üçün) cüt saxlanır.
                // Frontend thumb URL-i konvensiya ilə çıxarır (.webp → _thumb.webp).
                var pi = await _images.ProcessAsync(stream, ct);
                var id = Guid.NewGuid().ToString("N");
                var loc = await _storage.UploadRawAsync(pi.Full, $"{id}{pi.Extension}", pi.ContentType, ct);
                await _storage.UploadRawAsync(pi.Thumb, $"{id}_thumb{pi.Extension}", pi.ContentType, ct);
                urls.Add(loc);
            }
            else
            {
                // İşlənməyən (məs. animasiyalı GIF) — olduğu kimi. Boş bucket → düz /uploads/ kökü.
                // Local üçün NİSBİ yol ("/uploads/..") — origin-neutral (LAN/tunnel/prod). S3 mütləq URL.
                var loc = await _storage.UploadAsync(stream, f.FileName, f.ContentType, bucket: "", ct);
                urls.Add(loc);
            }
        }

        return Ok(new { urls, url = urls.FirstOrDefault() });
    }
}
