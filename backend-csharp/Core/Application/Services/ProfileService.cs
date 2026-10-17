using System.Globalization;
using Gardrop.Core.Application.Common;
using Gardrop.Core.Application.Common.Interfaces;
using Gardrop.Core.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Core.Application.Services;

/// <summary>Profil əməliyyatları (ad/ölçülər/şifrə) — EF implementasiyası (Scoped).</summary>
public class ProfileService : IProfileService
{
    private readonly IAppDbContext _db;
    private readonly IPasswordHasher _hasher;
    public ProfileService(IAppDbContext db, IPasswordHasher hasher) { _db = db; _hasher = hasher; }

    // raw == null → mövcud dəyəri saxla · "" → null (təmizlə) · rəqəm → parse et
    private static double? SetNum(string? raw, double? current)
    {
        if (raw is null) return current;
        if (raw.Length == 0) return null;
        return double.TryParse(raw, NumberStyles.Any, CultureInfo.InvariantCulture, out var d) ? d : current;
    }

    private static string? SetStr(string? raw, string? current)
    {
        if (raw is null) return current;
        return raw.Length == 0 ? null : raw;
    }

    private Task<User?> CurrentAsync(long uid, CancellationToken ct = default) =>
        _db.Users.Include(u => u.CartItems).Include(u => u.Favorites).Include(u => u.Addresses)
            .FirstOrDefaultAsync(u => u.Id == uid, ct);

    public async Task<OpResult> UpdateAsync(long userId, ProfileDto dto, CancellationToken ct = default)
    {
        var user = await CurrentAsync(userId, ct);
        if (user is null) return OpResult.Fail(401, "İstifadəçi tapılmadı");

        if (dto.Ad is not null) user.FirstName = dto.Ad.Trim();
        if (dto.Soyad is not null) user.LastName = dto.Soyad.Trim();
        if (dto.Telefon is not null) user.Phone = dto.Telefon.Trim();
        if (dto.Cins is not null) user.Gender = CatalogEnumParsing.ParseGenderOrNull(dto.Cins);  // boş → null (bax menfiler 3.5)

        await _db.SaveChangesAsync(ct);
        return OpResult.Ok(UserMapper.PublicUser(user));
    }

    public async Task<OpResult> UpdateMeasurementsAsync(long userId, MeasurementsDto dto, CancellationToken ct = default)
    {
        var user = await CurrentAsync(userId, ct);
        if (user is null) return OpResult.Fail(401, "İstifadəçi tapılmadı");

        user.Height = SetNum(dto.Boy, user.Height);
        user.Weight = SetNum(dto.Ceki, user.Weight);
        user.Chest = SetNum(dto.Dos, user.Chest);
        user.Waist = SetNum(dto.Bel, user.Waist);
        user.Hip = SetNum(dto.Omba, user.Hip);
        user.ChestFit = SetStr(dto.DosFit, user.ChestFit);
        user.WaistFit = SetStr(dto.BelFit, user.WaistFit);
        user.BellyFit = SetStr(dto.QarinFit, user.BellyFit);
        user.HipFit = SetStr(dto.OmbaFit, user.HipFit);
        user.FootFit = SetStr(dto.AyaqFit, user.FootFit);
        user.FitPreference = SetStr(dto.FitPreference, user.FitPreference);
        var yas = SetNum(dto.Yas, user.Age);
        if (dto.Yas is not null) user.Age = dto.Yas.Length == 0 ? null : (yas.HasValue ? (int)yas.Value : user.Age);
        var sh = SetNum(dto.Ayaqqabi, null);
        if (dto.Ayaqqabi is not null) user.ShoeSize = dto.Ayaqqabi.Length == 0 ? null : (sh.HasValue ? (int)sh.Value : user.ShoeSize);

        await _db.SaveChangesAsync(ct);
        return OpResult.Ok(UserMapper.PublicUser(user));
    }

    public async Task<OpResult> SetPasswordAsync(long userId, SetPasswordDto dto, CancellationToken ct = default)
    {
        var user = await CurrentAsync(userId, ct);
        if (user is null) return OpResult.Fail(401, "İstifadəçi tapılmadı");

        if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password!.Length < 6)
            return OpResult.Fail(400, "Şifrə ən az 6 simvol olmalıdır");

        var hasPw = !string.IsNullOrEmpty(user.PasswordHash);
        if (hasPw && (string.IsNullOrEmpty(dto.Current) || !_hasher.Verify(dto.Current, user.PasswordHash)))
            return OpResult.Fail(400, "Cari şifrə yanlışdır");

        user.PasswordHash = _hasher.Hash(dto.Password!);
        user.EmailVerified = true;  // şifrə təyini həm də emaili təsdiqlənmiş sayır
        await _db.SaveChangesAsync(ct);
        return OpResult.Ok(UserMapper.PublicUser(user));
    }
}
