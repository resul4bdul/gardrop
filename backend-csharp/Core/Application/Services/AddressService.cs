using Gardrop.Core.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Core.Application.Services;

/// <summary>Ünvan əməliyyatlarının EF implementasiyası (Scoped).</summary>
public class AddressService : IAddressService
{
    private readonly IAppDbContext _db;
    public AddressService(IAppDbContext db) => _db = db;

    public async Task<List<UserAddressDto>> GetAllAsync(long userId, CancellationToken ct = default) =>
        (await _db.Addresses.AsNoTracking().Where(a => a.UserId == userId).OrderBy(a => a.Id).ToListAsync(ct))
            .Select(UserMapper.AddressDto).ToList();

    public async Task<List<UserAddressDto>> CreateAsync(long userId, AddressDto dto, CancellationToken ct = default)
    {
        var unvan = (dto.Unvan ?? "").Trim();
        // Eyni ünvanı təkrar əlavə etmə (checkout-dan avtomatik yazılma üçün).
        var dup = await _db.Addresses.AnyAsync(a => a.UserId == userId && a.Unvan == unvan, ct);
        if (!dup)
        {
            _db.Addresses.Add(new Address
            {
                UserId = userId,
                Label = "",
                Sehir = "Bakı",
                Unvan = unvan,
                Lat = dto.Lat,
                Lng = dto.Lng,
                IsDefault = false,
            });
            await _db.SaveChangesAsync(ct);
        }
        return await GetAllAsync(userId, ct);
    }

    public async Task<List<UserAddressDto>?> UpdateAsync(long userId, long id, AddressDto dto, CancellationToken ct = default)
    {
        var addr = await _db.Addresses.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId, ct);
        if (addr is null) return null;

        if (dto.Label is not null) addr.Label = dto.Label;
        if (dto.Sehir is not null) addr.Sehir = dto.Sehir;
        if (dto.Unvan is not null) addr.Unvan = dto.Unvan;
        if (dto.Lat is not null) addr.Lat = dto.Lat;
        if (dto.Lng is not null) addr.Lng = dto.Lng;
        if (dto.IsDefault == true)
        {
            await _db.Addresses.Where(a => a.UserId == userId).ForEachAsync(a => a.IsDefault = false, ct);
            addr.IsDefault = true;
        }
        await _db.SaveChangesAsync(ct);
        return await GetAllAsync(userId, ct);
    }

    public async Task<List<UserAddressDto>> DeleteAsync(long userId, long id, CancellationToken ct = default)
    {
        var addr = await _db.Addresses.FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId, ct);
        if (addr is not null) { _db.Addresses.Remove(addr); await _db.SaveChangesAsync(ct); }
        return await GetAllAsync(userId, ct);
    }
}
