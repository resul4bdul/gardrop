using Gardrop.Core.Application.Common.DTOs;
using Gardrop.Core.Application.Common.Validation;

namespace Gardrop.Tests;

/// <summary>
/// Mərkəzi giriş validatoru (bax menfiler 3.4). Kritik incəlik: DTO-lar `record`-dur və
/// validation atributları KONSTRUKTOR PARAMETRİNDƏDİR; validator onları reflection-la oxumalıdır
/// (TryValidateObject tək başına property-də atribut olmadığı üçün görməz). Bu testlər həmin
/// davranışı və {error}=400 nəticəsini sabitləşdirir.
/// </summary>
public class ValidationServiceTests
{
    private readonly IValidationService _v = new DataAnnotationsValidationService();

    [Fact]
    public void Valid_dto_returns_null()
    {
        Assert.Null(_v.Validate(new RegisterDto("Ali", "Vəli", "ali@example.com", null, "secret1")));
    }

    [Fact]
    public void Missing_required_param_returns_400()
    {
        var r = _v.Validate(new RegisterDto(null, null, null, null, null));
        Assert.NotNull(r);
        Assert.Equal(400, r!.Status);
        Assert.False(string.IsNullOrWhiteSpace(r.Error));   // {error} mesajı dolu
    }

    [Fact]
    public void Invalid_email_format_returns_400()
    {
        var r = _v.Validate(new RegisterDto("Ali", "Vəli", "not-an-email", null, "secret1"));
        Assert.Equal(400, r!.Status);
    }

    [Fact]
    public void Short_password_returns_400()
    {
        var r = _v.Validate(new RegisterDto("Ali", "Vəli", "ali@example.com", null, "123"));
        Assert.Equal(400, r!.Status);
    }
}
