using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Gardrop.Core.Application.Common;
using Gardrop.Core.Application.Common.Interfaces;

namespace Gardrop.Presentation.Controllers;

// Nazik controller — autentifikasiya məntiqi IAuthService-dədir (Application qatı, bax menfiler D1/D2).
[ApiController]
[Route("api/auth")]
[EnableRateLimiting("auth")]  // OTP/login brute-force qarşısı (IP üzrə 10/dəq)
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;
    public AuthController(IAuthService auth) => _auth = auth;

    private IActionResult Map(OpResult r) => r.ToActionResult();

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto, CancellationToken ct) => Map(await _auth.RegisterAsync(dto, ct));

    [HttpPost("verify-email")]
    public async Task<IActionResult> VerifyEmail([FromBody] EmailCodeDto dto, CancellationToken ct) => Map(await _auth.VerifyEmailAsync(dto, ct));

    [HttpPost("resend-verification")]
    public async Task<IActionResult> ResendVerification([FromBody] EmailOnlyDto dto, CancellationToken ct) => Map(await _auth.ResendVerificationAsync(dto, ct));

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto, CancellationToken ct) => Map(await _auth.LoginAsync(dto, ct));

    [HttpPost("login-verify")]
    public async Task<IActionResult> LoginVerify([FromBody] EmailCodeDto dto, CancellationToken ct) => Map(await _auth.LoginVerifyAsync(dto, ct));

    [HttpPost("resend-login")]
    public async Task<IActionResult> ResendLogin([FromBody] EmailOnlyDto dto, CancellationToken ct) => Map(await _auth.ResendLoginAsync(dto, ct));

    [HttpPost("forgot")]
    public async Task<IActionResult> Forgot([FromBody] EmailOnlyDto dto, CancellationToken ct) => Map(await _auth.ForgotAsync(dto, ct));

    [HttpPost("reset")]
    public async Task<IActionResult> Reset([FromBody] ResetPasswordDto dto, CancellationToken ct) => Map(await _auth.ResetAsync(dto, ct));

    [HttpPost("google")]
    public async Task<IActionResult> Google([FromBody] GoogleLoginDto dto, CancellationToken ct) => Map(await _auth.GoogleAsync(dto, ct));

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken ct) => Map(await _auth.MeAsync(User.GetUserId(), ct));
}
