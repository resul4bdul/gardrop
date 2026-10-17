namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>Google OAuth credential-dən doğrulanmış istifadəçi məlumatı.</summary>
public record GoogleUserInfo(
    string Email, string? GivenName, string? Name, string? FamilyName, string Subject, string? Picture);

/// <summary>
/// Google ID token doğrulaması (Google.Apis detalları Infrastructure-dadır).
/// Doğrulama uğursuzdursa null qaytarır.
/// </summary>
public interface IGoogleAuthValidator
{
    bool IsConfigured { get; }
    Task<GoogleUserInfo?> ValidateAsync(string credential, CancellationToken ct = default);
}
