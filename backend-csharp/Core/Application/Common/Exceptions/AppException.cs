namespace Gardrop.Core.Application.Common.Exceptions;

/// <summary>
/// Biznes qaydası pozuntusu — istifadəçiyə göstərilə bilən mesaj + HTTP status.
/// ExceptionHandlingMiddleware bunu strukturlaşdırılmış JSON cavabına çevirir.
/// </summary>
public class AppException : Exception
{
    public int StatusCode { get; }
    public AppException(string message, int statusCode = 400) : base(message) => StatusCode = statusCode;

    public static AppException NotFound(string message = "Tapılmadı") => new(message, 404);
    public static AppException Unauthorized(string message = "İcazə yoxdur") => new(message, 401);
    public static AppException Forbidden(string message = "Qadağandır") => new(message, 403);
}
