namespace Gardrop.Infrastructure.Services;

/// <summary>
/// Şəkilləri uploads qovluğunda saxlayan defolt implementasiya. Yol Program.cs-dəki
/// statik fayl provayderi ilə eyni mənbədən gəlir (UploadsPath.Resolve, bax menfiler 5.3).
/// Boş bucket → düz "uploads/" kökü. MinIO/S3-ə keçəndə yalnız DI qeydiyyatı dəyişir.
/// </summary>
public class LocalStorageService : IStorageService
{
    private readonly string _uploadsRoot;
    public LocalStorageService(IWebHostEnvironment env, IConfiguration cfg) =>
        _uploadsRoot = UploadsPath.Resolve(cfg, env.ContentRootPath);

    public async Task<string> UploadAsync(Stream content, string fileName, string contentType, string bucket = "uploads", CancellationToken ct = default)
    {
        var dir = string.IsNullOrWhiteSpace(bucket) ? _uploadsRoot : Path.Combine(_uploadsRoot, bucket);
        Directory.CreateDirectory(dir);
        var safe = $"{Guid.NewGuid():N}{Path.GetExtension(fileName)}";
        var path = Path.Combine(dir, safe);
        await using var fs = File.Create(path);
        await content.CopyToAsync(fs, ct);
        return string.IsNullOrWhiteSpace(bucket) ? $"/uploads/{safe}" : $"/uploads/{bucket}/{safe}";
    }

    public async Task<string> UploadRawAsync(byte[] bytes, string objectName, string contentType, CancellationToken ct = default)
    {
        Directory.CreateDirectory(_uploadsRoot);
        var safe = Path.GetFileName(objectName); // yol keçidi (../) qarşısı
        var path = Path.Combine(_uploadsRoot, safe);
        await File.WriteAllBytesAsync(path, bytes, ct);
        return $"/uploads/{safe}";
    }

    public Task DeleteAsync(string url, CancellationToken ct = default)
    {
        // url: "/uploads/<bucket>/<file>" → kökə nisbi.
        var rel = url.StartsWith("/uploads/") ? url["/uploads/".Length..] : url.TrimStart('/');
        var path = Path.Combine(_uploadsRoot, rel.Replace('/', Path.DirectorySeparatorChar));
        if (File.Exists(path)) File.Delete(path);
        return Task.CompletedTask;
    }
}
