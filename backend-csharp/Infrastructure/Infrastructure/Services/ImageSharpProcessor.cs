using Gardrop.Core.Application.Common.Interfaces;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;

namespace Gardrop.Infrastructure.Services;

/// <summary>
/// ImageSharp ilə şəkil optimizasiyası: EXIF-orient, max ölçüyə resize, WebP kodlama + thumbnail.
/// Tam: max 1600px / q80; thumbnail: max 400px / q70. Animasiyalı GIF işlənmir (olduğu kimi saxlanır).
/// </summary>
public class ImageSharpProcessor : IImageProcessor
{
    private const int MaxFull = 1600;
    private const int MaxThumb = 400;

    public bool CanProcess(string contentType, string fileName)
    {
        var ext = Path.GetExtension(fileName).ToLowerInvariant();
        return ext is ".jpg" or ".jpeg" or ".png" or ".webp"; // .gif → raw (animasiya qorunsun)
    }

    public async Task<ProcessedImage> ProcessAsync(Stream input, CancellationToken ct = default)
    {
        using var image = await Image.LoadAsync(input, ct);
        image.Mutate(x => x.AutoOrient()); // EXIF orientasiyanı tətbiq et (telefon şəkilləri)

        var full = Encode(image, MaxFull, 80);
        var thumb = Encode(image, MaxThumb, 70);
        return new ProcessedImage(full, thumb, "image/webp", ".webp");
    }

    private static byte[] Encode(Image src, int max, int quality)
    {
        using var clone = src.Clone(x =>
        {
            if (Math.Max(src.Width, src.Height) > max)
                x.Resize(new ResizeOptions { Mode = ResizeMode.Max, Size = new Size(max, max) });
        });
        using var ms = new MemoryStream();
        clone.Save(ms, new WebpEncoder { Quality = quality });
        return ms.ToArray();
    }
}
