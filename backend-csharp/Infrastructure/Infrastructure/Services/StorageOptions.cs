namespace Gardrop.Infrastructure.Services;

/// <summary>
/// Obyekt anbarı konfiqurasiyası ("Storage" bölməsi). Provider="Local" → disk;
/// Provider="S3" → S3/MinIO (S3Options). DI seçimi env-ə görə (Storage__Provider).
/// </summary>
public sealed class StorageOptions
{
    public string Provider { get; set; } = "Local"; // "Local" | "S3"
    public string UploadsPath { get; set; } = "";    // yalnız Local üçün (absolyut yol)
    public S3Options S3 { get; set; } = new();
}

/// <summary>S3/MinIO bağlantı parametrləri. ServiceUrl boş → əsl AWS (Region ilə).</summary>
public sealed class S3Options
{
    public string ServiceUrl { get; set; } = "";        // MinIO endpoint (məs. http://minio:9000); boş → AWS
    public string Region { get; set; } = "us-east-1";
    public string AccessKey { get; set; } = "";
    public string SecretKey { get; set; } = "";
    public string Bucket { get; set; } = "uploads";
    public bool ForcePathStyle { get; set; } = true;    // MinIO üçün lazım (virtual-host yox)
    public string PublicBaseUrl { get; set; } = "";     // brauzerə verilən kök; boş → ServiceUrl/Bucket
}
