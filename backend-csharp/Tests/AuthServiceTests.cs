using Gardrop.Core.Application.Common;
using Gardrop.Core.Application.Common.DTOs;
using Gardrop.Core.Application.Common.Interfaces;
using Gardrop.Core.Application.Common.Validation;
using Gardrop.Core.Application.Services;
using Gardrop.Core.Domain.Models;
using Gardrop.Infrastructure.Persistance.Data;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Tests;

/// <summary>
/// AuthService inteqrasiya testləri (EF InMemory + fake email/jwt/hash/google) — bax menfiler 5.4.
/// Register/verify/login/OTP/forgot/reset/google/me kritik yollarını əhatə edir.
/// </summary>
public class AuthServiceTests
{
    private sealed class Harness
    {
        public AppDbContext Db = TestDb.New();
        public FakeTokenService Jwt = new();
        public FakeEmailSender Mail = new();
        public FakeEmailCodeService Codes = new();
        public FakePasswordHasher Hasher = new();
        public FakeGoogleAuthValidator Google = new();
        public AuthService Build() => new(Db, Jwt, Mail, Codes, Hasher, Google, new DataAnnotationsValidationService());
    }

    private static async Task<User> SeedUserAsync(Harness h, string email = "ali@example.com",
        string password = "secret1", bool verified = true, string provider = "local")
    {
        var u = new User
        {
            FirstName = "Ali", LastName = "Vəliyev", Email = email, Phone = "",
            PasswordHash = provider == "google" ? "" : h.Hasher.Hash(password),
            EmailVerified = verified, Provider = provider,
        };
        h.Db.Users.Add(u);
        await h.Db.SaveChangesAsync();
        return u;
    }

    // ── Register ──

    [Fact]
    public async Task Register_missing_fields_fails_400()
    {
        var h = new Harness();
        var r = await h.Build().RegisterAsync(new RegisterDto("", "", "", null, null));
        Assert.Equal(400, r.Status);
    }

    [Fact]
    public async Task Register_invalid_email_fails_400()
    {
        var h = new Harness();
        var r = await h.Build().RegisterAsync(new RegisterDto("Ali", "V", "not-an-email", null, "secret1"));
        Assert.Equal(400, r.Status);
    }

    [Fact]
    public async Task Register_short_password_fails_400()
    {
        var h = new Harness();
        var r = await h.Build().RegisterAsync(new RegisterDto("Ali", "V", "ali@example.com", null, "123"));
        Assert.Equal(400, r.Status);
    }

    [Fact]
    public async Task Register_duplicate_email_fails_400()
    {
        var h = new Harness();
        await SeedUserAsync(h);
        var r = await h.Build().RegisterAsync(new RegisterDto("Ali", "V", "ali@example.com", null, "secret1"));
        Assert.Equal(400, r.Status);
    }

    [Fact]
    public async Task Register_success_persists_unverified_user_and_sends_verify()
    {
        var h = new Harness();
        var r = await h.Build().RegisterAsync(new RegisterDto("Ali", "Vəli", "Ali@Example.com", "050", "secret1"));

        Assert.Equal(200, r.Status);
        Assert.IsType<PendingVerificationResult>(r.Data);
        var u = await h.Db.Users.SingleAsync();
        Assert.Equal("ali@example.com", u.Email);   // normalize (lowercase)
        Assert.False(u.EmailVerified);
        Assert.Contains(h.Mail.Sent, s => s.Kind == "verify" && s.To == "ali@example.com");
    }

    [Fact]
    public async Task Register_rolls_back_user_when_email_send_fails()
    {
        var h = new Harness { Mail = { Throw = true } };
        var r = await h.Build().RegisterAsync(new RegisterDto("Ali", "V", "ali@example.com", null, "secret1"));

        Assert.Equal(502, r.Status);
        Assert.False(await h.Db.Users.AnyAsync());   // yarımçıq hesab silinib
    }

    // ── Verify email ──

    [Fact]
    public async Task VerifyEmail_wrong_code_fails_400()
    {
        var h = new Harness();
        await SeedUserAsync(h, verified: false);
        await h.Codes.NewCodeAsync("ali@example.com", "verify", TimeSpan.FromMinutes(15));
        var r = await h.Build().VerifyEmailAsync(new EmailCodeDto("ali@example.com", "000000"));
        Assert.Equal(400, r.Status);
    }

    [Fact]
    public async Task VerifyEmail_correct_code_marks_verified_and_returns_token()
    {
        var h = new Harness();
        await SeedUserAsync(h, verified: false);
        await h.Codes.NewCodeAsync("ali@example.com", "verify", TimeSpan.FromMinutes(15));

        var r = await h.Build().VerifyEmailAsync(new EmailCodeDto("ali@example.com", FakeEmailCodeService.Code));

        Assert.Equal(200, r.Status);
        Assert.IsType<AuthResult>(r.Data);
        Assert.True((await h.Db.Users.SingleAsync()).EmailVerified);
    }

    // ── Login ──

    [Fact]
    public async Task Login_wrong_password_fails_400()
    {
        var h = new Harness();
        await SeedUserAsync(h);
        var r = await h.Build().LoginAsync(new LoginDto("ali@example.com", "wrong"));
        Assert.Equal(400, r.Status);
    }

    [Fact]
    public async Task Login_google_account_rejects_password_login()
    {
        var h = new Harness();
        await SeedUserAsync(h, provider: "google");
        var r = await h.Build().LoginAsync(new LoginDto("ali@example.com", "secret1"));
        Assert.Equal(400, r.Status);
        Assert.Contains("Google", r.Error!);
    }

    [Fact]
    public async Task Login_unverified_user_returns_pending_verification()
    {
        var h = new Harness();
        await SeedUserAsync(h, verified: false);
        var r = await h.Build().LoginAsync(new LoginDto("ali@example.com", "secret1"));

        Assert.Equal(200, r.Status);
        Assert.IsType<PendingVerificationResult>(r.Data);
        Assert.Contains(h.Mail.Sent, s => s.Kind == "verify");
    }

    [Fact]
    public async Task Login_verified_user_requires_otp()
    {
        var h = new Harness();
        await SeedUserAsync(h);
        var r = await h.Build().LoginAsync(new LoginDto("ali@example.com", "secret1"));

        Assert.Equal(200, r.Status);
        Assert.IsType<OtpRequiredResult>(r.Data);
        Assert.Contains(h.Mail.Sent, s => s.Kind == "otp");
    }

    [Fact]
    public async Task LoginVerify_correct_otp_returns_token()
    {
        var h = new Harness();
        await SeedUserAsync(h);
        await h.Build().LoginAsync(new LoginDto("ali@example.com", "secret1"));  // login kodu yaradır

        var r = await h.Build().LoginVerifyAsync(new EmailCodeDto("ali@example.com", FakeEmailCodeService.Code));

        Assert.Equal(200, r.Status);
        var auth = Assert.IsType<AuthResult>(r.Data);
        Assert.False(string.IsNullOrEmpty(auth.Token));
    }

    [Fact]
    public async Task LoginVerify_wrong_otp_fails_400()
    {
        var h = new Harness();
        await SeedUserAsync(h);
        await h.Build().LoginAsync(new LoginDto("ali@example.com", "secret1"));
        var r = await h.Build().LoginVerifyAsync(new EmailCodeDto("ali@example.com", "999999"));
        Assert.Equal(400, r.Status);
    }

    // ── Forgot / reset ──

    [Fact]
    public async Task Forgot_always_returns_ok_even_for_unknown_email()
    {
        var h = new Harness();
        var r = await h.Build().ForgotAsync(new EmailOnlyDto("nobody@example.com"));
        Assert.Equal(200, r.Status);
        Assert.Empty(h.Mail.Sent);   // mövcud olmayan hesaba göndərilmir, amma cavab eynidir
    }

    [Fact]
    public async Task Reset_with_valid_token_changes_password()
    {
        var h = new Harness();
        await SeedUserAsync(h);
        var token = await h.Codes.NewTokenAsync("ali@example.com", "reset", TimeSpan.FromMinutes(30));

        var r = await h.Build().ResetAsync(new ResetPasswordDto(token, "newpass1"));

        Assert.Equal(200, r.Status);
        var u = await h.Db.Users.SingleAsync();
        Assert.True(h.Hasher.Verify("newpass1", u.PasswordHash));
    }

    [Fact]
    public async Task Reset_with_invalid_token_fails_400()
    {
        var h = new Harness();
        await SeedUserAsync(h);
        var r = await h.Build().ResetAsync(new ResetPasswordDto("bogus-token", "newpass1"));
        Assert.Equal(400, r.Status);
    }

    // ── Google ──

    [Fact]
    public async Task Google_not_configured_fails_500()
    {
        var h = new Harness { Google = { IsConfigured = false } };
        var r = await h.Build().GoogleAsync(new GoogleLoginDto("cred"));
        Assert.Equal(500, r.Status);
    }

    [Fact]
    public async Task Google_invalid_credential_fails_400()
    {
        var h = new Harness();
        h.Google.Payload = null;   // doğrulama uğursuz
        var r = await h.Build().GoogleAsync(new GoogleLoginDto("cred"));
        Assert.Equal(400, r.Status);
    }

    [Fact]
    public async Task Google_new_user_is_created_and_returns_token()
    {
        var h = new Harness();
        h.Google.Payload = new GoogleUserInfo("new@example.com", "Yeni", "Yeni İstifadəçi", "Soyad", "sub-1", null);

        var r = await h.Build().GoogleAsync(new GoogleLoginDto("cred"));

        Assert.Equal(200, r.Status);
        Assert.IsType<AuthResult>(r.Data);
        var u = await h.Db.Users.SingleAsync();
        Assert.Equal("google", u.Provider);
        Assert.True(u.EmailVerified);
    }

    // ── Me ──

    [Fact]
    public async Task Me_null_user_fails_401()
    {
        var h = new Harness();
        var r = await h.Build().MeAsync(null);
        Assert.Equal(401, r.Status);
    }

    [Fact]
    public async Task Me_existing_user_returns_public_user()
    {
        var h = new Harness();
        var u = await SeedUserAsync(h);
        var r = await h.Build().MeAsync(u.Id);
        Assert.Equal(200, r.Status);
        Assert.IsType<PublicUserDto>(r.Data);
    }
}
