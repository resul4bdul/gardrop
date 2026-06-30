namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>
/// Obyekt anbarı abstraksiyası (məhsul şəkilləri, mağaza logoları, istifadəçi avatarları).
/// İndi lokal disk; production-da MinIO/S3 implementasiyası ilə əvəzlənir.
/// </summary>
public interface IStorageService
{
    Task<string> UploadAsync(Stream content, string fileName, string contentType, string bucket = "uploads", CancellationToken ct = default);
    Task DeleteAsync(string url, CancellationToken ct = default);
}
