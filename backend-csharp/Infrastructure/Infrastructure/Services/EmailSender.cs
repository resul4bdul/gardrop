using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace Gardrop.Infrastructure.Services;

/// <summary>SMTP (Gmail və s.) vasitəsilə HTML email göndərir (IEmailSender impl).</summary>
public class EmailSender : IEmailSender
{
    private readonly SmtpOptions _opt;
    private readonly ILogger<EmailSender> _log;
    public EmailSender(IOptions<SmtpOptions> opt, ILogger<EmailSender> log) { _opt = opt.Value; _log = log; }

    public bool IsConfigured => !string.IsNullOrWhiteSpace(_opt.Host) && !string.IsNullOrWhiteSpace(_opt.User);

    public async Task SendAsync(string toEmail, string subject, string htmlBody)
    {
        if (!IsConfigured)
        {
            // SMTP konfiqurasiya olunmayıb — inkişaf rejimində konsola yaz (məktub getmir).
            _log.LogWarning("SMTP konfiqurasiya olunmayıb. Email göndərilmədi → {To}: {Subject}", toEmail, subject);
            return;
        }

        var msg = new MimeMessage();
        msg.From.Add(new MailboxAddress(_opt.FromName, string.IsNullOrWhiteSpace(_opt.FromEmail) ? _opt.User : _opt.FromEmail));
        msg.To.Add(MailboxAddress.Parse(toEmail));
        msg.Subject = subject;
        msg.Body = new BodyBuilder { HtmlBody = htmlBody }.ToMessageBody();

        using var client = new SmtpClient { Timeout = 20000 };  // 20 san. (asılı qalmasın)
        // 587 → STARTTLS, 465 → SSL
        var secure = _opt.Port == 465 ? SecureSocketOptions.SslOnConnect : SecureSocketOptions.StartTls;
        try
        {
            await client.ConnectAsync(_opt.Host, _opt.Port, secure);
            await client.AuthenticateAsync(_opt.User, _opt.Password);
            await client.SendAsync(msg);
            await client.DisconnectAsync(true);
            _log.LogInformation("Email göndərildi → {To}: {Subject}", toEmail, subject);
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "Email göndərilə bilmədi → {To}", toEmail);
            throw new EmailSendException("Email göndərilə bilmədi. SMTP ayarlarını/şəbəkəni yoxlayın.", ex);
        }
    }

    // ── Hazır şablonlar ──
    public Task SendOtpAsync(string to, string code) => SendAsync(to,
        "Gardrop giriş kodu",
        Wrap($"<h2 style='margin:0 0 8px'>Giriş kodunuz</h2>" +
             $"<p style='color:#555'>Hesabınıza daxil olmaq üçün aşağıdakı kodu daxil edin:</p>" +
             $"{CodeBox(code)}" +
             $"<p style='color:#888;font-size:13px'>Kod 5 dəqiqə etibarlıdır. Bu girişi siz etməmisinizsə, məktubu nəzərə almayın.</p>"));

    public Task SendVerifyAsync(string to, string code) => SendAsync(to,
        "Gardrop — email təsdiqi",
        Wrap($"<h2 style='margin:0 0 8px'>Email ünvanınızı təsdiqləyin</h2>" +
             $"<p style='color:#555'>Qeydiyyatı tamamlamaq üçün təsdiq kodu:</p>" +
             $"{CodeBox(code)}" +
             $"<p style='color:#888;font-size:13px'>Kod 15 dəqiqə etibarlıdır.</p>"));

    public Task SendResetAsync(string to, string token)
    {
        // Bərpa linki burada qurulur ki, AppBaseUrl Application qatına sızmasın (bax menfiler 1.1).
        var link = $"{_opt.AppBaseUrl.TrimEnd('/')}/?reset={token}";
        return SendResetLinkAsync(to, link);
    }

    private Task SendResetLinkAsync(string to, string link) => SendAsync(to,
        "Gardrop — şifrə bərpası",
        Wrap($"<h2 style='margin:0 0 8px'>Şifrənizi bərpa edin</h2>" +
             $"<p style='color:#555'>Yeni şifrə təyin etmək üçün düyməyə klikləyin:</p>" +
             $"<p style='margin:24px 0'><a href='{link}' style='background:#0A0A0A;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;display:inline-block'>Şifrəni yenilə</a></p>" +
             $"<p style='color:#888;font-size:13px'>Link 30 dəqiqə etibarlıdır. Siz tələb etməmisinizsə, məktubu nəzərə almayın.</p>"));

    private static string CodeBox(string code) =>
        $"<div style='font-size:32px;font-weight:800;letter-spacing:10px;background:#F4F4F5;border-radius:12px;padding:18px;text-align:center;margin:20px 0'>{code}</div>";

    private static string Wrap(string inner) =>
        $"<div style='font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:32px;color:#0A0A0A'>" +
        $"<div style='font-weight:800;letter-spacing:3px;font-size:20px;margin-bottom:24px'>GARDROP</div>{inner}" +
        $"<hr style='border:none;border-top:1px solid #eee;margin:28px 0'/>" +
        $"<p style='color:#aaa;font-size:12px'>© Gardrop — Azərbaycanın geyim marketi</p></div>";
}
