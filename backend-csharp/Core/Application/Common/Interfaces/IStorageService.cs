namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>
/// Obyekt anbarı abstraksiyası (məhsul şəkilləri, mağaza logoları, istifadəçi avatarları).
/// İndi lokal disk; production-da MinIO/S3 implementasiyası ilə əvəzlənir.
/// </summary>
public interface IStorageService
{
    Task<string> UploadAsync(Stream content, string fileName, string contentType, string bucket = "uploads", CancellationToken ct = default);
    /// <summary>Baytları DƏQİQ obyekt adı ilə saxlayır (guid override YOX) — thumbnail cütü
    /// (X.webp + X_thumb.webp) üçün lazımdır. objectName yalnız fayl adıdır, kök uploads-dur.</summary>
    Task<string> UploadRawAsync(byte[] bytes, string objectName, string contentType, CancellationToken ct = default);
    Task DeleteAsync(string url, CancellationToken ct = default);
}
