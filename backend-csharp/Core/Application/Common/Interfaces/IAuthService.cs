using Gardrop.Core.Application.Common;

namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>
/// Autentifikasiya axını (qeydiyyat, email təsdiqi, 2-addımlı OTP login, şifrə bərpası, Google).
/// Biznes məntiqi Application qatında — controller nazikdir (bax menfiler D1/D2).
/// </summary>
public interface IAuthService
{
    Task<OpResult> RegisterAsync(RegisterDto dto, CancellationToken ct = default);
    Task<OpResult> VerifyEmailAsync(EmailCodeDto dto, CancellationToken ct = default);
    Task<OpResult> ResendVerificationAsync(EmailOnlyDto dto, CancellationToken ct = default);
    Task<OpResult> LoginAsync(LoginDto dto, CancellationToken ct = default);
    Task<OpResult> LoginVerifyAsync(EmailCodeDto dto, CancellationToken ct = default);
    Task<OpResult> ResendLoginAsync(EmailOnlyDto dto, CancellationToken ct = default);
    Task<OpResult> ForgotAsync(EmailOnlyDto dto, CancellationToken ct = default);
    Task<OpResult> ResetAsync(ResetPasswordDto dto, CancellationToken ct = default);
    Task<OpResult> GoogleAsync(GoogleLoginDto dto, CancellationToken ct = default);
    Task<OpResult> MeAsync(long? userId, CancellationToken ct = default);
}
