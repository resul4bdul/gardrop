using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Gardrop.Infrastructure.Services;

namespace Gardrop.Presentation.Controllers;

/// <summary>
/// YALNIZ Development köməkçiləri (e2e üçün, bax C.1). Production-da hər endpoint 404 qaytarır.
/// TƏHLÜKƏSİZLİK: OTP kodunu açır — heç vaxt prod-da aktiv OLMAMALIDIR (env yoxlaması ilə qorunur).
/// </summary>
[ApiController]
[Route("api/dev")]
public class DevController : ControllerBase
{
    private readonly IWebHostEnvironment _env;
    private readonly DevCodeCapture _capture;
    public DevController(IWebHostEnvironment env, DevCodeCapture capture) { _env = env; _capture = capture; }

    // GET /api/dev/last-code?email=...  → son göndərilən OTP/təsdiq kodu (yalnız Development)
    [HttpGet("last-code")]
    [AllowAnonymous]
    public IActionResult LastCode([FromQuery] string email)
    {
        if (!_env.IsDevelopment()) return NotFound();
        var code = _capture.Get((email ?? "").ToLowerInvariant().Trim());
        return Ok(new { email, code });
    }
}
