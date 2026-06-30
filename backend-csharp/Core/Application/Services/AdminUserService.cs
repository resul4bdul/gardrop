using Gardrop.Core.Application.Common;
using Gardrop.Core.Application.Common.Interfaces;
using Gardrop.Core.Application.Common.Validation;
using Gardrop.Core.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Core.Application.Services;

/// <summary>Admin paneli istifadəçi əməliyyatları — EF implementasiyası (Scoped). Bax menfiler 3.1.</summary>
public class AdminUserService : IAdminUserService
{
    private readonly IAppDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly IValidationService _validation;
    public AdminUserService(IAppDbContext db, IPasswordHasher hasher, IValidationService validation)
    { _db = db; _hasher = hasher; _validation = validation; }

    public async Task<List<AdminUserView>> UsersAsync(string? search, int? page = null, int? pageSize = null, CancellationToken ct = default)
    {
        var q = _db.Users.AsNoTracking()
            .Include(u => u.CartItems).Include(u => u.Favorites)
            .Include(u => u.Orders).Include(u => u.Addresses).AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            q = q.Where(u => u.Email.ToLower().Contains(s) || u.FirstName.ToLower().Contains(s) || u.LastName.ToLower().Contains(s));
        }

        var users = await q.OrderByDescending(u => u.Id).Page(page, pageSize).ToListAsync(ct);
        return users.Select(u => new AdminUserView(
            u.Id, u.FirstName, u.LastName, u.Email, u.Phone, CatalogEnumParsing.GenderToWire(u.Gender), u.IsAdmin, u.CreatedAt,
            CartCount: u.CartItems.Count,
            FavCount: u.Favorites.Count,
            OrderCount: u.Orders.Count,
            AddressCount: u.Addresses.Count)).ToList();
    }

    public async Task<OpResult> UpdateUserAsync(long id, AdminUserDto dto, CancellationToken ct = default)
    {
        var u = await _db.Users.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (u is null) return OpResult.Fail(404, "İstifadəçi tapılmadı");

        if (!string.IsNullOrWhiteSpace(dto.Email))
        {
            var email = dto.Email.Trim().ToLowerInvariant();
            if (email != u.Email && await _db.Users.AnyAsync(x => x.Email == email, ct))
                return OpResult.Fail(400, "Bu email başqa hesabda istifadə olunur");
            u.Email = email;
        }
        if (dto.Ad is not null) u.FirstName = dto.Ad.Trim();
        if (dto.Soyad is not null) u.LastName = dto.Soyad.Trim();
        if (dto.Telefon is not null) u.Phone = dto.Telefon.Trim();
        if (dto.Cins is not null) u.Gender = CatalogEnumParsing.ParseGenderOrNull(dto.Cins);
        if (dto.IsAdmin.HasValue) u.IsAdmin = dto.IsAdmin.Value;

        await _db.SaveChangesAsync(ct);
        return OpResult.Ok(new AdminUserBrief(u.Id, u.FirstName, u.LastName, u.Email, u.Phone, CatalogEnumParsing.GenderToWire(u.Gender), u.IsAdmin));
    }

    public async Task<OpResult> ResetPasswordAsync(long id, AdminPasswordDto dto, CancellationToken ct = default)
    {
        if (_validation.Validate(dto) is { } err) return err;

        var u = await _db.Users.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (u is null) return OpResult.Fail(404, "İstifadəçi tapılmadı");

        u.PasswordHash = _hasher.Hash(dto.Password!);
        await _db.SaveChangesAsync(ct);
        return OpResult.Ok(new OkResult());
    }

    public async Task<OpResult> DeleteUserAsync(long currentUserId, long id, CancellationToken ct = default)
    {
        if (id == currentUserId) return OpResult.Fail(400, "Öz hesabınızı silə bilməzsiniz");
        var u = await _db.Users.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (u is null) return OpResult.Fail(404, "İstifadəçi tapılmadı");
        _db.Users.Remove(u);
        await _db.SaveChangesAsync(ct);
        return OpResult.Ok(new OkResult());
    }
}
