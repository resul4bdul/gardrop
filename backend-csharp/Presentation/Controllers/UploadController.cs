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
    public UploadController(IStorageService storage) => _storage = storage;

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
            // Boş bucket → düz /uploads/ kökü (mövcud URL formatı qorunur).
            var loc = await _storage.UploadAsync(stream, f.FileName, f.ContentType, bucket: "", ct);
            // Local üçün NİSBİ yol saxlanır ("/uploads/..") — origin-neutral: eyni domeyndən
            // (LAN, cloudflared tunnel, prod) işləyir. Mütləq "http://localhost:3001/.." host
            // bağlardı → telefonda/tuneldə şəkil görünməzdi. S3/MinIO onsuz da mütləq URL qaytarır.
            urls.Add(loc);
        }

        return Ok(new { urls, url = urls.FirstOrDefault() });
    }
}
