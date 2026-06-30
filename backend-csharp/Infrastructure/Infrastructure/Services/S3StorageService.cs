using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Options;

namespace Gardrop.Infrastructure.Services;

/// <summary>
/// S3/MinIO obyekt anbarı implementasiyası (IStorageService). Çox-instansiyalı/horizontal
/// miqyasda fayllar paylaşılır (LocalStorageService disk problemini həll edir, bax A.2).
/// Qaytarılan URL mütləqdir (PublicBaseUrl/bucket); UploadController host əlavə etmir.
/// </summary>
public class S3StorageService : IStorageService
{
    private readonly IAmazonS3 _s3;
    private readonly S3Options _opt;

    public S3StorageService(IAmazonS3 s3, IOptions<StorageOptions> opt)
    {
        _s3 = s3;
        _opt = opt.Value.S3;
    }

    public async Task<string> UploadAsync(Stream content, string fileName, string contentType, string bucket = "uploads", CancellationToken ct = default)
    {
        var prefix = string.IsNullOrWhiteSpace(bucket) ? "uploads" : bucket.Trim('/');
        var key = $"{prefix}/{Guid.NewGuid():N}{Path.GetExtension(fileName)}";

        await _s3.PutObjectAsync(new PutObjectRequest
        {
            BucketName = _opt.Bucket,
            Key = key,
            InputStream = content,
            ContentType = contentType,
        }, ct);

        var baseUrl = string.IsNullOrWhiteSpace(_opt.PublicBaseUrl)
            ? $"{_opt.ServiceUrl.TrimEnd('/')}/{_opt.Bucket}"
            : _opt.PublicBaseUrl.TrimEnd('/');
        return $"{baseUrl}/{key}";
    }

    public async Task DeleteAsync(string url, CancellationToken ct = default)
    {
        var key = ExtractKey(url);
        if (string.IsNullOrEmpty(key)) return;
        await _s3.DeleteObjectAsync(_opt.Bucket, key, ct);
    }

    /// <summary>URL-dən S3 açarını (prefix/file) çıxarır — UploadAsync formatının tərsi.</summary>
    private string? ExtractKey(string url)
    {
        var marker = $"/{_opt.Bucket}/";
        var i = url.IndexOf(marker, StringComparison.Ordinal);
        if (i >= 0) return url[(i + marker.Length)..];

        // PublicBaseUrl forması (bucket URL-də görünmür): son iki seqment "prefix/file".
        var parts = url.TrimEnd('/').Split('/');
        return parts.Length >= 2 ? $"{parts[^2]}/{parts[^1]}" : null;
    }
}
