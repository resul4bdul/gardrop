using System.ComponentModel.DataAnnotations;

namespace Gardrop.Infrastructure.Services;

public class JwtOptions
{
    // Min 32 simvol — HMAC-SHA256 üçün təhlükəsiz açar. Startup-da yoxlanılır (ValidateOnStart).
    [Required, MinLength(32)]
    public string Secret { get; set; } = "";

    [Range(1, 365)]
    public int ExpiresDays { get; set; } = 7;

    [Required]
    public string Issuer { get; set; } = "gardrop";

    [Required]
    public string Audience { get; set; } = "gardrop";
}
