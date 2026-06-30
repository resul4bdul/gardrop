using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Gardrop.Infrastructure.Services;

namespace Gardrop.Presentation.Auth;

/// <summary>
/// JwtBearer doğrulama parametrlərini <see cref="JwtOptions"/>-dan qurur — tək konfiqurasiya
/// mənbəyi. Əvvəl Program.cs config-i ayrıca oxuyurdu (menfiler A1: ikiqat bind).
/// </summary>
public sealed class ConfigureJwtBearerOptions : IConfigureNamedOptions<JwtBearerOptions>
{
    private readonly JwtOptions _jwt;
    public ConfigureJwtBearerOptions(IOptions<JwtOptions> jwt) => _jwt = jwt.Value;

    public void Configure(string? name, JwtBearerOptions options) => Configure(options);

    public void Configure(JwtBearerOptions options)
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = _jwt.Issuer,
            ValidateAudience = true,
            ValidAudience = _jwt.Audience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Secret)),
            ClockSkew = TimeSpan.FromMinutes(1),
        };
    }
}
