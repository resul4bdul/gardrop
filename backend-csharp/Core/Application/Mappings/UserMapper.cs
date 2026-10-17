using System.Security.Claims;
using Gardrop.Core.Domain.Enums;

namespace Gardrop.Core.Application.Mappings;

public static class UserMapper
{
    /// <summary>JWT-dən istifadəçi id-sini oxuyur.</summary>
    public static long? GetUserId(this ClaimsPrincipal user)
    {
        var raw = user.FindFirst("id")?.Value;
        return long.TryParse(raw, out var id) ? id : null;
    }

    /// <summary>publicUser — şifrə hash-i çıxarılmış, frontend gözlədiyi forma (typed: PublicUserDto).</summary>
    public static PublicUserDto PublicUser(User u) => new()
    {
        Id = u.Id,
        Ad = u.FirstName,
        Soyad = u.LastName,
        Email = u.Email,
        Telefon = u.Phone,
        Cins = CatalogEnumParsing.GenderToWire(u.Gender),  // enum? → AZ wire string (bax menfiler 3.5/3.6)
        IsAdmin = u.IsAdmin,
        HasPassword = !string.IsNullOrEmpty(u.PasswordHash),
        Provider = u.Provider,
        AvatarUrl = u.AvatarUrl,
        CreatedAt = u.CreatedAt,
        Cart = u.CartItems.Select(c => new UserCartItemView(c.ProductId, c.Qty, c.Size)).ToList(),
        Favorites = u.Favorites.Select(f => f.ProductId).ToList(),
        Addresses = u.Addresses.Select(AddressDto).ToList(),
        Measurements = Measurements(u),
    };

    public static UserAddressDto AddressDto(Address a) =>
        new(a.Id, a.Label, a.Sehir, a.Unvan, a.Lat, a.Lng, a.IsDefault);

    /// <summary>Ölçülər — frontend Fit Assistant forması (boy/çəki/yaş + quruluş seçimləri + ayaqqabı EU).</summary>
    public static UserMeasurementsDto Measurements(User u) =>
        new(u.Height, u.Weight, u.Chest, u.Waist, u.Age, u.Hip,
            u.ChestFit, u.WaistFit, u.BellyFit, u.HipFit, u.FootFit, u.ShoeSize, u.FitPreference);
}
