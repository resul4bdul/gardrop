using System.ComponentModel.DataAnnotations;

namespace Gardrop.Core.Application.Common.DTOs;

public record AdminUserDto(
    string? Ad, string? Soyad, string? Email, string? Telefon, string? Cins, bool? IsAdmin);
public record AdminPasswordDto(
    [Required(ErrorMessage = "Şifrə mütləqdir")]
    [MinLength(6, ErrorMessage = "Şifrə ən az 6 simvol olmalıdır")] string? Password);
