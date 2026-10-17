namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>
/// Şifrə hash-ləmə abstraksiyası (cost factor implementasiyada qapsanır).
/// Application qatı BCrypt-i birbaşa tanımır — bax menfiler 1.1.
/// </summary>
public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string password, string hash);
}
