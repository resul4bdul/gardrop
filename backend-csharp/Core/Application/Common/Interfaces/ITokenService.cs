namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>JWT (və ya digər) giriş tokeni yaradan abstraksiya — JWT impl Infrastructure-dadır.</summary>
public interface ITokenService
{
    string Sign(User user);
}
