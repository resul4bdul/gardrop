namespace Gardrop.Infrastructure.Services;

/// <summary>BCrypt əsaslı şifrə hash-ləyici (cost factor = 12). IPasswordHasher impl.</summary>
public class BcryptPasswordHasher : IPasswordHasher
{
    private const int WorkFactor = 12;

    public string Hash(string password) => BCrypt.Net.BCrypt.HashPassword(password, WorkFactor);

    public bool Verify(string password, string hash) =>
        !string.IsNullOrEmpty(hash) && BCrypt.Net.BCrypt.Verify(password, hash);
}
