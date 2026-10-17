namespace Gardrop.Infrastructure.Services;

/// <summary>
/// Uploads kök qovluğunun tək mənbəyi (bax menfiler 5.3). Əvvəlcə konfiqurasiya
/// (Storage:UploadsPath — absolyut yol), yoxdursa ContentRoot/../../uploads fallback.
/// Program.cs statik fayl provayderi və LocalStorageService eyni yerdən oxuyur.
/// </summary>
public static class UploadsPath
{
    public static string Resolve(IConfiguration cfg, string contentRoot)
    {
        var configured = cfg["Storage:UploadsPath"];
        return !string.IsNullOrWhiteSpace(configured)
            ? Path.GetFullPath(configured)
            : Path.GetFullPath(Path.Combine(contentRoot, "..", "..", "uploads"));
    }
}
