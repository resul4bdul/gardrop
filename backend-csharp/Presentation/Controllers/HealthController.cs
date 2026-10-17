using Microsoft.AspNetCore.Mvc;
using Gardrop.Core.Application.Common.Interfaces;

namespace Gardrop.Presentation.Controllers;

// Nazik controller — məntiq IHealthService-dədir (Application qatı, bax menfiler D1/D2).
[ApiController]
[Route("api")]
public class HealthController : ControllerBase
{
    private readonly IHealthService _health;
    public HealthController(IHealthService health) => _health = health;

    // GET /api/health
    [HttpGet("health")]
    public async Task<IActionResult> Health(CancellationToken ct) => Ok(await _health.SnapshotAsync(ct));
}
