using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Gardrop.Core.Application.Common.Interfaces;
using MetadataExtractor;
using MetadataExtractor.Formats.Exif;
using SkiaSharp;

namespace Gardrop.Infrastructure.Services
{
    /// <summary>
    /// SkiaSharp ilə şəkil optimizasiyası: EXIF-orient tətbiq et, max ölçüyə resize, WebP kodlama + thumbnail.
    /// Tam: max 1600px / q80; thumbnail: max 400px / q70. Animasiyalı GIF işlənmir (olduğu kimi saxlanır).
    /// </summary>
    public class SkiaSharpProcessor : IImageProcessor
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
            // Read into memory (metadata və birdən çox decode üçün)
            byte[] bytes;
            await using (var msAll = new MemoryStream())
            {
                await input.CopyToAsync(msAll, ct);
                bytes = msAll.ToArray();
            }

            // EXIF orientation oxu (1..8). Əgər metadata yoxdursa -> 1.
            int orientation = 1;
            try
            {
                var directories = ImageMetadataReader.ReadMetadata(new MemoryStream(bytes));
                var ifd0 = directories.OfType<ExifIfd0Directory>().FirstOrDefault();
                if (ifd0 != null && ifd0.TryGetInt32(ExifDirectoryBase.TagOrientation, out var o))
                    orientation = o;
            }
            catch
            {
                // metadata oxuma uğursuz olarsa, silent ignore — orientation=1 qalacaq
            }

            // Decode original
            SKBitmap original;
            using (var msDecode = new MemoryStream(bytes))
            {
                original = SKBitmap.Decode(msDecode);
                if (original == null)
                    throw new InvalidDataException("Şəkil oxunarkən xəta: dekod etmək mümkün olmadı.");
            }

            // Apply EXIF orientation (rotate/flip) if lazım
            using var oriented = ApplyExifOrientation(original, orientation);

            // Encode full and thumb
            var full = EncodeWebP(oriented, MaxFull, 80);
            var thumb = EncodeWebP(oriented, MaxThumb, 70);

            return new ProcessedImage(full, thumb, "image/webp", ".webp");
        }

        private static SKBitmap ApplyExifOrientation(SKBitmap src, int orientation)
        {
            // orientation values:
            // 1 = Normal
            // 2 = Mirror horizontal
            // 3 = Rotate 180
            // 4 = Mirror vertical
            // 5 = Mirror horizontal and rotate 270 CW
            // 6 = Rotate 90 CW
            // 7 = Mirror horizontal and rotate 90 CW
            // 8 = Rotate 270 CW

            if (orientation == 1) // no-op
                return src.Copy();

            // Compute new size depending on rotation
            bool swap = orientation is 5 or 6 or 7 or 8;
            int newW = swap ? src.Height : src.Width;
            int newH = swap ? src.Width : src.Height;

            var info = new SKImageInfo(newW, newH, src.ColorType, src.AlphaType);
            var dst = new SKBitmap(info);
            using var canvas = new SKCanvas(dst);

            // Apply transform matrix
            var matrix = SKMatrix.CreateIdentity();

            switch (orientation)
            {
                case 2: // Mirror horizontal
                    matrix = SKMatrix.CreateScale(-1, 1);
                    matrix = matrix.PostConcat(SKMatrix.CreateTranslation(src.Width, 0));
                    break;
                case 3: // Rotate 180
                    matrix = SKMatrix.CreateRotationDegrees(180, src.Width / 2f, src.Height / 2f);
                    break;
                case 4: // Mirror vertical
                    matrix = SKMatrix.CreateScale(1, -1);
                    matrix = matrix.PostConcat(SKMatrix.CreateTranslation(0, src.Height));
                    break;
                case 5: // Mirror horizontal and rotate 270
                    // Mirror horizontal then rotate 270 -> equivalent transform drawn appropriately
                    matrix = SKMatrix.CreateScale(-1, 1);
                    matrix = matrix.PostConcat(SKMatrix.CreateRotationDegrees(270));
                    matrix = matrix.PostConcat(SKMatrix.CreateTranslation(0, src.Width));
                    break;
                case 6: // Rotate 90 CW
                    matrix = SKMatrix.CreateRotationDegrees(90);
                    matrix = matrix.PostConcat(SKMatrix.CreateTranslation(src.Height, 0));
                    break;
                case 7: // Mirror horizontal and rotate 90
                    matrix = SKMatrix.CreateScale(-1, 1);
                    matrix = matrix.PostConcat(SKMatrix.CreateRotationDegrees(90));
                    matrix = matrix.PostConcat(SKMatrix.CreateTranslation(src.Height, 0));
                    break;
                case 8: // Rotate 270 CW
                    matrix = SKMatrix.CreateRotationDegrees(270);
                    matrix = matrix.PostConcat(SKMatrix.CreateTranslation(0, src.Width));
                    break;
                default:
                    return src.Copy();
            }

            canvas.Clear(SKColors.Transparent);
            // Draw with matrix
            using var paint = new SKPaint { FilterQuality = SKFilterQuality.High };
            canvas.SetMatrix(matrix);
            canvas.DrawBitmap(src, 0, 0, paint);
            canvas.Flush();

            return dst;
        }

        private static byte[] EncodeWebP(SKBitmap src, int maxDimension, int quality)
        {
            // Determine new size preserving aspect ratio (only if larger than max)
            int w = src.Width;
            int h = src.Height;
            int max = Math.Max(w, h);
            float scale = max > maxDimension ? (float)maxDimension / max : 1f;
            int newW = Math.Max(1, (int)Math.Round(w * scale));
            int newH = Math.Max(1, (int)Math.Round(h * scale));

            SKBitmap toEncode;
            if (newW == w && newH == h)
            {
                toEncode = src;
            }
            else
            {
                var info = new SKImageInfo(newW, newH, src.ColorType, src.AlphaType);
                var tmp = new SKBitmap(info);
                using var canvas = new SKCanvas(tmp);
                canvas.Clear(SKColors.Transparent);
                var srcRect = new SKRectI(0, 0, src.Width, src.Height);
                var dstRect = new SKRect(0, 0, newW, newH);
                using var paint = new SKPaint { FilterQuality = SKFilterQuality.High };
                canvas.DrawBitmap(src, srcRect, dstRect, paint);
                canvas.Flush();
                toEncode = tmp;
            }

            using var img = SKImage.FromBitmap(toEncode);
            using var data = img.Encode(SKEncodedImageFormat.Webp, quality);
            return data.ToArray();
        }
    }
}
