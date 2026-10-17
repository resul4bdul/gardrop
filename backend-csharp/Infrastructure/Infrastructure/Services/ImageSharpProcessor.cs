using Gardrop.Core.Application.Common.Interfaces;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;

namespace Gardrop.Infrastructure.Services;

/// <summary>
/// ImageSharp ilə şəkil optimizasiyası: EXIF-orient, max ölçüyə resize, WebP kodlama + thumbnail.
/// Tam: max 1600px / q80; thumbnail: max 400px / q70. Animasiyalı GIF işlənmir (olduğu kimi saxlanır).
/// </summary>
[System.Obsolete("Replaced by SkiaSharpProcessor. Keep for reference.")]
public class ImageSharpProcessor : IImageProcessor
{
    private const int MaxFull = 1600;
    private const int MaxThumb = 400;

    public bool CanProcess(string contentType, string fileName)
    {
        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        return ext is ".jpg" or ".jpeg" or ".png" or ".webp"; // .gif → raw (animasiya qorunsun)
    }

    public Task<ProcessedImage> ProcessAsync(Stream input, CancellationToken ct = default)
    {
        throw new System.NotSupportedException("ImageSharpProcessor is deprecated. Use SkiaSharpProcessor instead.");
    }

}
