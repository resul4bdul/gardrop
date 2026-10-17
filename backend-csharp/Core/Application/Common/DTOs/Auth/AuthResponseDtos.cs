namespace Gardrop.Core.Application.Common.DTOs;

/// <summary>Uğurlu giriş: { token, user }.</summary>
public record AuthResult(string Token, PublicUserDto User);

/// <summary>Email təsdiqi tələb olunur: { needsVerification: true, email, message }.</summary>
public record PendingVerificationResult(string Email, string Message, bool NeedsVerification = true);

/// <summary>OTP giriş kodu tələb olunur: { otpRequired: true, email, message }.</summary>
public record OtpRequiredResult(string Email, string Message, bool OtpRequired = true);
