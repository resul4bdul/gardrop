using Google.Apis.Auth;
using Microsoft.Extensions.Options;

namespace Gardrop.Infrastructure.Services;

/// <summary>Google ID token-i Google.Apis ilə doğrulayır (IGoogleAuthValidator impl).</summary>
public class GoogleAuthValidator : IGoogleAuthValidator
{
    private readonly string _clientId;
    public GoogleAuthValidator(IOptions<GoogleOptions> google) => _clientId = google.Value.ClientId;

    public bool IsConfigured => !string.IsNullOrEmpty(_clientId);

    public async Task<GoogleUserInfo?> ValidateAsync(string credential, CancellationToken ct = default)
    {
        try
        {
            var payload = await GoogleJsonWebSignature.ValidateAsync(credential,
                new GoogleJsonWebSignature.ValidationSettings { Audience = new[] { _clientId } });
            if (string.IsNullOrWhiteSpace(payload.Email)) return null;
            return new GoogleUserInfo(
                payload.Email, payload.GivenName, payload.Name, payload.FamilyName, payload.Subject, payload.Picture);
        }
        catch
        {
            return null;
        }
    }
}
