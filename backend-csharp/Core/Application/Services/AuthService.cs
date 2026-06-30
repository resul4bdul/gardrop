using Gardrop.Core.Application.Common;
using Gardrop.Core.Application.Common.Interfaces;
using Gardrop.Core.Application.Common.Validation;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Core.Application.Services;

/// <summary>Autentifikasiya axını (JWT/SMTP/Google/hash abstraksiyaları arxasında).</summary>
public class AuthService : IAuthService
{
    private readonly IAppDbContext _db;
    private readonly ITokenService _jwt;
    private readonly IEmailSender _mail;
    private readonly IEmailCodeService _codes;
    private readonly IPasswordHasher _hasher;
    private readonly IGoogleAuthValidator _google;
    private readonly IValidationService _validation;

    public AuthService(IAppDbContext db, ITokenService jwt, IEmailSender mail,
        IEmailCodeService codes, IPasswordHasher hasher, IGoogleAuthValidator google,
        IValidationService validation)
    {
        _db = db; _jwt = jwt; _mail = mail; _codes = codes; _hasher = hasher; _google = google;
        _validation = validation;
    }

    private Task<User?> LoadAsync(string email, CancellationToken ct = default) => _db.Users
        .Include(u => u.CartItems).Include(u => u.Favorites).Include(u => u.Addresses)
        .FirstOrDefaultAsync(u => u.Email == email, ct);

    private OpResult Authed(User user) =>
        OpResult.Ok(new AuthResult(_jwt.Sign(user), UserMapper.PublicUser(user)));

    public async Task<OpResult> RegisterAsync(RegisterDto dto, CancellationToken ct = default)
    {
        if (_validation.Validate(dto) is { } err) return err;

        var email = dto.Email!.ToLowerInvariant().Trim();
        if (await _db.Users.AnyAsync(u => u.Email == email, ct))
            return OpResult.Fail(400, "Bu email ilə artıq hesab mövcuddur");

        var user = new User
        {
            FirstName = dto.Ad!.Trim(),
            LastName = dto.Soyad!.Trim(),
            Email = email,
            Phone = dto.Telefon?.Trim() ?? "",
            PasswordHash = _hasher.Hash(dto.Password!),
            EmailVerified = false,
            CreatedAt = DateTime.UtcNow,
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        var code = await _codes.NewCodeAsync(email, "verify", TimeSpan.FromMinutes(15));
        try { await _mail.SendVerifyAsync(email, code); }
        catch (EmailSendException ex)
        {
            // Məktub getmədisə yarımçıq hesabı sil ki, istifadəçi yenidən cəhd edə bilsin
            _db.Users.Remove(user);
            await _db.SaveChangesAsync(ct);
            return OpResult.Fail(502, ex.Message);
        }

        return OpResult.Ok(new PendingVerificationResult(email, "Təsdiq kodu email ünvanınıza göndərildi"));
    }

    public async Task<OpResult> VerifyEmailAsync(EmailCodeDto dto, CancellationToken ct = default)
    {
        if (_validation.Validate(dto) is { } err) return err;

        var email = dto.Email!.ToLowerInvariant().Trim();
        if (!await _codes.VerifyCodeAsync(email, "verify", dto.Code!))
            return OpResult.Fail(400, "Kod yanlış və ya vaxtı keçib");

        var user = await LoadAsync(email, ct);
        if (user is null) return OpResult.Fail(400, "İstifadəçi tapılmadı");
        user.EmailVerified = true;
        await _db.SaveChangesAsync(ct);
        return Authed(user);
    }

    public async Task<OpResult> ResendVerificationAsync(EmailOnlyDto dto, CancellationToken ct = default)
    {
        if (_validation.Validate(dto) is { } err) return err;
        var email = dto.Email!.ToLowerInvariant().Trim();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);
        if (user is not null && !user.EmailVerified)
        {
            var code = await _codes.NewCodeAsync(email, "verify", TimeSpan.FromMinutes(15));
            try { await _mail.SendVerifyAsync(email, code); }
            catch (EmailSendException ex) { return OpResult.Fail(502, ex.Message); }
        }
        return OpResult.Ok(new OkResult());
    }

    public async Task<OpResult> LoginAsync(LoginDto dto, CancellationToken ct = default)
    {
        if (_validation.Validate(dto) is { } err) return err;

        var email = dto.Email!.ToLowerInvariant().Trim();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);

        // Google ilə yaradılmış (parolsuz) hesab — parol girişi yoxdur
        if (user is not null && string.IsNullOrEmpty(user.PasswordHash))
            return OpResult.Fail(400, "Bu hesab Google ilə yaradılıb. \"Google ilə daxil ol\" düyməsindən istifadə edin.");

        if (user is null || !_hasher.Verify(dto.Password!, user.PasswordHash))
            return OpResult.Fail(400, "Email və ya şifrə yanlışdır");

        // Email hələ təsdiqlənməyibsə əvvəlcə onu tələb et
        if (!user.EmailVerified)
        {
            var vc = await _codes.NewCodeAsync(email, "verify", TimeSpan.FromMinutes(15));
            try { await _mail.SendVerifyAsync(email, vc); }
            catch (EmailSendException ex) { return OpResult.Fail(502, ex.Message); }
            return OpResult.Ok(new PendingVerificationResult(email, "Əvvəlcə email ünvanınızı təsdiqləyin"));
        }

        var code = await _codes.NewCodeAsync(email, "login", TimeSpan.FromMinutes(5));
        try { await _mail.SendOtpAsync(email, code); }
        catch (EmailSendException ex) { return OpResult.Fail(502, ex.Message); }
        return OpResult.Ok(new OtpRequiredResult(email, "Giriş kodu email ünvanınıza göndərildi"));
    }

    public async Task<OpResult> LoginVerifyAsync(EmailCodeDto dto, CancellationToken ct = default)
    {
        if (_validation.Validate(dto) is { } err) return err;

        var email = dto.Email!.ToLowerInvariant().Trim();
        if (!await _codes.VerifyCodeAsync(email, "login", dto.Code!))
            return OpResult.Fail(400, "Kod yanlış və ya vaxtı keçib");

        var user = await LoadAsync(email, ct);
        if (user is null) return OpResult.Fail(400, "İstifadəçi tapılmadı");
        return Authed(user);
    }

    public async Task<OpResult> ResendLoginAsync(EmailOnlyDto dto, CancellationToken ct = default)
    {
        if (_validation.Validate(dto) is { } err) return err;
        var email = dto.Email!.ToLowerInvariant().Trim();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);
        if (user is not null && !string.IsNullOrEmpty(user.PasswordHash) && user.EmailVerified)
        {
            var code = await _codes.NewCodeAsync(email, "login", TimeSpan.FromMinutes(5));
            try { await _mail.SendOtpAsync(email, code); }
            catch (EmailSendException ex) { return OpResult.Fail(502, ex.Message); }
        }
        return OpResult.Ok(new OkResult());
    }

    public async Task<OpResult> ForgotAsync(EmailOnlyDto dto, CancellationToken ct = default)
    {
        if (_validation.Validate(dto) is { } err) return err;
        var email = dto.Email!.ToLowerInvariant().Trim();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);
        if (user is not null && !string.IsNullOrEmpty(user.PasswordHash))
        {
            var token = await _codes.NewTokenAsync(email, "reset", TimeSpan.FromMinutes(30));
            // Hesab varlığını sızdırmamaq üçün göndərmə xətasını udur (cavab həmişə eyni)
            try { await _mail.SendResetAsync(email, token); } catch (EmailSendException) { }
        }
        return OpResult.Ok(new OkMessageResult("Əgər bu email qeydiyyatdadırsa, bərpa linki göndərildi"));
    }

    public async Task<OpResult> ResetAsync(ResetPasswordDto dto, CancellationToken ct = default)
    {
        if (_validation.Validate(dto) is { } err) return err;

        var email = await _codes.ConsumeTokenAsync("reset", dto.Token!);
        if (email is null) return OpResult.Fail(400, "Link yanlış və ya vaxtı keçib");

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);
        if (user is null) return OpResult.Fail(400, "İstifadəçi tapılmadı");

        user.PasswordHash = _hasher.Hash(dto.Password!);
        user.EmailVerified = true;  // bərpa linki email-ə çatdığına görə təsdiq sayılır
        await _db.SaveChangesAsync(ct);
        return OpResult.Ok(new OkMessageResult("Şifrə yeniləndi. İndi daxil ola bilərsiniz."));
    }

    public async Task<OpResult> GoogleAsync(GoogleLoginDto dto, CancellationToken ct = default)
    {
        if (_validation.Validate(dto) is { } err) return err;
        if (!_google.IsConfigured)
            return OpResult.Fail(500, "Google girişi serverdə konfiqurasiya olunmayıb");

        var payload = await _google.ValidateAsync(dto.Credential!, ct);
        if (payload is null)
            return OpResult.Fail(400, "Google təsdiqi alınmadı");

        var email = payload.Email.ToLowerInvariant().Trim();
        var user = await LoadAsync(email, ct);

        if (user is null)
        {
            user = new User
            {
                FirstName = payload.GivenName ?? payload.Name ?? "İstifadəçi",
                LastName = payload.FamilyName ?? "",
                Email = email,
                Phone = "",
                PasswordHash = "",
                Provider = "google",
                GoogleId = payload.Subject,
                AvatarUrl = payload.Picture ?? "",
                EmailVerified = true,
                CreatedAt = DateTime.UtcNow,
            };
            _db.Users.Add(user);
            await _db.SaveChangesAsync(ct);
        }
        else
        {
            var changed = false;
            if (string.IsNullOrEmpty(user.GoogleId)) { user.GoogleId = payload.Subject; changed = true; }
            if (string.IsNullOrEmpty(user.AvatarUrl) && !string.IsNullOrEmpty(payload.Picture)) { user.AvatarUrl = payload.Picture; changed = true; }
            if (!user.EmailVerified) { user.EmailVerified = true; changed = true; }
            if (changed) await _db.SaveChangesAsync(ct);
        }

        return Authed(user);
    }

    public async Task<OpResult> MeAsync(long? userId, CancellationToken ct = default)
    {
        if (userId is null) return OpResult.Fail(401, "Token tələb olunur");

        var user = await _db.Users
            .Include(u => u.CartItems).Include(u => u.Favorites).Include(u => u.Addresses)
            .FirstOrDefaultAsync(u => u.Id == userId, ct);

        if (user is null) return OpResult.Fail(401, "İstifadəçi tapılmadı");
        return OpResult.Ok(UserMapper.PublicUser(user));
    }
}
