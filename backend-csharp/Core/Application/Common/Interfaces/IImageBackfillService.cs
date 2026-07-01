namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>
/// Köhnə (optimizasiya olunmamış) məhsul şəkillərini WebP+thumbnail-a çevirir və
/// ImageUrls-i yeni URL-lərlə əvəzləyir. Yalnız Local storage; idempotent (.webp keçir).
/// </summary>
public interface IImageBackfillService
{
    Task<ImageBackfillResult> BackfillAsync(CancellationToken ct = default);
}

public record ImageBackfillResult(int Products, int Scanned, int Converted, int Skipped, string Provider);
