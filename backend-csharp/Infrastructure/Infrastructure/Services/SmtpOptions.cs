using System.ComponentModel.DataAnnotations;

namespace Gardrop.Infrastructure.Services;

public class SmtpOptions
{
    [Required]
    public string Host { get; set; } = "";        // məs. smtp.gmail.com

    [Range(1, 65535)]
    public int Port { get; set; } = 587;          // 587 = STARTTLS

    [Required]
    public string User { get; set; } = "";        // SMTP istifadəçi (Gmail ünvanı)

    [Required]
    public string Password { get; set; } = "";    // Gmail "app password" (16 simvol)

    public string FromName { get; set; } = "Gardrop";

    [Required, EmailAddress]
    public string FromEmail { get; set; } = "";   // göndərən ünvan (adətən = User)

    [Required, Url]
    public string AppBaseUrl { get; set; } = "http://localhost:3001";  // bərpa linki üçün
}
