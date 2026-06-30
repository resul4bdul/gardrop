namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>
/// Email göndərmə abstraksiyası (SMTP/şablon detalları Infrastructure-dadır).
/// Bərpa linki impl tərəfindən qurulur (AppBaseUrl Application qatına sızmasın).
/// </summary>
public interface IEmailSender
{
    Task SendVerifyAsync(string to, string code);
    Task SendOtpAsync(string to, string code);
    Task SendResetAsync(string to, string token);

    /// <summary>Ümumi HTML email (sifariş bildirişləri və s.). SMTP konfiqurasiya olunmayıbsa no-op.</summary>
    Task SendAsync(string to, string subject, string htmlBody);
}
