using Gardrop.Core.Application.Common.Interfaces;

namespace Gardrop.Infrastructure.Services;

/// <summary>
/// YALNIZ Development: real IEmailSender-i sarıyır, göndərilən kodu DevCodeCapture-də saxlayır
/// (e2e üçün, bax C.1). Email yenə də göndərilir (real sender çağırılır). Prod-da qoşulmur.
/// </summary>
public sealed class CapturingEmailSender : IEmailSender
{
    private readonly IEmailSender _inner;
    private readonly DevCodeCapture _capture;
    public CapturingEmailSender(IEmailSender inner, DevCodeCapture capture) { _inner = inner; _capture = capture; }

    public Task SendVerifyAsync(string to, string code) { _capture.Set(to, code); return _inner.SendVerifyAsync(to, code); }
    public Task SendOtpAsync(string to, string code) { _capture.Set(to, code); return _inner.SendOtpAsync(to, code); }
    public Task SendResetAsync(string to, string token) { _capture.Set(to, token); return _inner.SendResetAsync(to, token); }
    public Task SendAsync(string to, string subject, string htmlBody) => _inner.SendAsync(to, subject, htmlBody);
}
