namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>İşlənmiş şəkil: tam ölçü + thumbnail (hər ikisi WebP), eyni content-type/uzantı.</summary>
public record ProcessedImage(byte[] Full, byte[] Thumb, string ContentType, string Extension);

/// <summary>
/// Yüklənən şəkilləri sıxır/resize edir və WebP-ə çevirir + thumbnail yaradır.
/// Məqsəd: mağazaların 5–10 MB telefon şəkilləri kataloqu ağırlaşdırmasın (bax UploadController).
/// </summary>
public interface IImageProcessor
{
    /// <summary>Bu fayl işlənə bilərmi (raster şəkil; animasiyalı GIF xaric)?</summary>
    bool CanProcess(string contentType, string fileName);
    Task<ProcessedImage> ProcessAsync(Stream input, CancellationToken ct = default);
}
