using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Infrastructure.Services;

/// <summary>
/// Birdəfəlik kod/token yaradır və yoxlayır (OTP, email təsdiqi, şifrə bərpası).
/// Kodlar yalnız SHA-256 hash kimi saxlanır; cəhd sayı və bitmə vaxtı ilə qorunur.
/// </summary>
public class EmailAuthService : IEmailCodeService
{
    private readonly IAppDbContext _db;
    private const int MaxAttempts = 5;
    public EmailAuthService(IAppDbContext db) { _db = db; }

    private static string Hash(string s)
        => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(s))).ToLowerInvariant();

    /// <summary>6 rəqəmli OTP yaradır (login/verify). Köhnə istifadəolunmamış kodları silir.</summary>
    public async Task<string> NewCodeAsync(string email, string purpose, TimeSpan ttl)
    {
        email = email.ToLowerInvariant().Trim();
        await PurgeAsync(email, purpose);
        var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
        _db.EmailCodes.Add(new EmailCode
        {
            Email = email, CodeHash = Hash(code), Purpose = purpose,
            ExpiresAt = DateTime.UtcNow.Add(ttl), CreatedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync();
        return code;
    }

    /// <summary>Uzun təsadüfi token yaradır (şifrə bərpa linki üçün).</summary>
    public async Task<string> NewTokenAsync(string email, string purpose, TimeSpan ttl)
    {
        email = email.ToLowerInvariant().Trim();
        await PurgeAsync(email, purpose);
        var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
        _db.EmailCodes.Add(new EmailCode
        {
            Email = email, CodeHash = Hash(token), Purpose = purpose,
            ExpiresAt = DateTime.UtcNow.Add(ttl), CreatedAt = DateTime.UtcNow,
        });
        await _db.SaveChangesAsync();
        return token;
    }

    /// <summary>Email+məqsəd üzrə 6 rəqəmli kodu yoxlayır (OTP/verify).</summary>
    public async Task<bool> VerifyCodeAsync(string email, string purpose, string code)
    {
        email = email.ToLowerInvariant().Trim();
        var row = await _db.EmailCodes
            .Where(c => c.Email == email && c.Purpose == purpose && !c.Used)
            .OrderByDescending(c => c.Id).FirstOrDefaultAsync();

        if (row is null || row.ExpiresAt < DateTime.UtcNow || row.Attempts >= MaxAttempts) return false;

        if (row.CodeHash != Hash(code ?? ""))
        {
            row.Attempts++;
            await _db.SaveChangesAsync();
            return false;
        }
        row.Used = true;
        await _db.SaveChangesAsync();
        return true;
    }

    /// <summary>Token üzrə (linkdən) yoxlayır; uyğun emaili qaytarır.</summary>
    public async Task<string?> ConsumeTokenAsync(string purpose, string token)
    {
        var hash = Hash(token ?? "");
        var row = await _db.EmailCodes
            .Where(c => c.Purpose == purpose && !c.Used && c.CodeHash == hash)
            .OrderByDescending(c => c.Id).FirstOrDefaultAsync();

        if (row is null || row.ExpiresAt < DateTime.UtcNow) return null;
        row.Used = true;
        await _db.SaveChangesAsync();
        return row.Email;
    }

    private async Task PurgeAsync(string email, string purpose)
    {
        var old = await _db.EmailCodes
            .Where(c => c.Email == email && c.Purpose == purpose && !c.Used).ToListAsync();
        if (old.Count > 0) { _db.EmailCodes.RemoveRange(old); await _db.SaveChangesAsync(); }
    }
}
