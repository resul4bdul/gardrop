namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>İstifadəçi ünvanları — biznes məntiqi Application qatında (bax menfiler D1/D2).</summary>
public interface IAddressService
{
    Task<List<UserAddressDto>> GetAllAsync(long userId, CancellationToken ct = default);
    Task<List<UserAddressDto>> CreateAsync(long userId, AddressDto dto, CancellationToken ct = default);

    /// <summary>Yenilə. Ünvan tapılmazsa null.</summary>
    Task<List<UserAddressDto>?> UpdateAsync(long userId, long id, AddressDto dto, CancellationToken ct = default);

    Task<List<UserAddressDto>> DeleteAsync(long userId, long id, CancellationToken ct = default);
}
