namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>
/// Birdəfəlik kod/token yaratma və yoxlama (OTP, email təsdiqi, şifrə bərpası).
/// Kodlar hash kimi saxlanır; cəhd sayı + bitmə vaxtı impl-də idarə olunur.
/// </summary>
public interface IEmailCodeService
{
    Task<string> NewCodeAsync(string email, string purpose, TimeSpan ttl);
    Task<string> NewTokenAsync(string email, string purpose, TimeSpan ttl);
    Task<bool> VerifyCodeAsync(string email, string purpose, string code);
    Task<string?> ConsumeTokenAsync(string purpose, string token);
}
