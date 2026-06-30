using System.ComponentModel.DataAnnotations;

namespace Gardrop.Core.Application.Common.DTOs;

// QEYD: bunlar `record`-dur — validation atributları PRİMARY KONSTRUKTOR PARAMETRİNDƏ qalır
// (ASP.NET MVC konvensiyası; property-də olsa MVC istisna atır). Servis-sərhədi validatoru
// (IValidationService) eyni parametr atributlarını oxuyur — tək mənbə (bax menfiler 3.4).

public record RegisterDto(
    [Required(ErrorMessage = "Ad mütləqdir")] string? Ad,
    [Required(ErrorMessage = "Soyad mütləqdir")] string? Soyad,
    [Required(ErrorMessage = "Email mütləqdir")]
    [EmailAddress(ErrorMessage = "Email formatı yanlışdır")] string? Email,
    string? Telefon,
    [Required(ErrorMessage = "Şifrə mütləqdir")]
    [MinLength(6, ErrorMessage = "Şifrə ən az 6 simvol olmalıdır")] string? Password);

public record LoginDto(
    [Required(ErrorMessage = "Email mütləqdir")]
    [EmailAddress(ErrorMessage = "Email formatı yanlışdır")] string? Email,
    [Required(ErrorMessage = "Şifrə mütləqdir")] string? Password);

// Google ilə giriş — frontend-dən gələn ID token (JWT credential)
public record GoogleLoginDto([Required(ErrorMessage = "Credential mütləqdir")] string? Credential);

// Email kodu yoxlama (giriş OTP-si və ya qeydiyyat təsdiqi)
public record EmailCodeDto(
    [Required(ErrorMessage = "Email mütləqdir")]
    [EmailAddress(ErrorMessage = "Email formatı yanlışdır")] string? Email,
    [Required(ErrorMessage = "Kod mütləqdir")] string? Code);

// Yalnız email (kodu/linki yenidən göndər, şifrəni unutdum)
public record EmailOnlyDto(
    [Required(ErrorMessage = "Email mütləqdir")]
    [EmailAddress(ErrorMessage = "Email formatı yanlışdır")] string? Email);

// Şifrə bərpası — linkdən gələn token + yeni şifrə
public record ResetPasswordDto(
    [Required(ErrorMessage = "Token mütləqdir")] string? Token,
    [Required(ErrorMessage = "Şifrə mütləqdir")]
    [MinLength(6, ErrorMessage = "Şifrə ən az 6 simvol olmalıdır")] string? Password);
