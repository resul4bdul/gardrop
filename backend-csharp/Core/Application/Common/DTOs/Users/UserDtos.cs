namespace Gardrop.Core.Application.Common.DTOs;

public record ProfileDto(string? Ad, string? Soyad, string? Telefon, string? Cins);

// Profil şifrə təyini/dəyişməsi — Google (parolsuz) hesablar da şifrə qura bilsin
public record SetPasswordDto(string? Current, string? Password);
