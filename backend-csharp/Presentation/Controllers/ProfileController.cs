using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Gardrop.Core.Application.Common.Interfaces;

namespace Gardrop.Presentation.Controllers;

// Nazik controller — məntiq IProfileService-dədir (Application qatı, bax menfiler D1/D2).
[ApiController]
[Authorize]
[Route("api/profile")]
public class ProfileController : ControllerBase
{
    private readonly IProfileService _profile;
    public ProfileController(IProfileService profile) => _profile = profile;

    private IActionResult Map(Gardrop.Core.Application.Common.OpResult r) => r.ToActionResult();

    // PUT /api/profile  { ad, soyad, telefon, cins }
    [HttpPut]
    public async Task<IActionResult> Update([FromBody] ProfileDto dto, CancellationToken ct) =>
        Map(await _profile.UpdateAsync(User.GetUserId()!.Value, dto, ct));

    // PUT /api/profile/measurements
    [HttpPut("measurements")]
    public async Task<IActionResult> Measurements([FromBody] MeasurementsDto dto, CancellationToken ct) =>
        Map(await _profile.UpdateMeasurementsAsync(User.GetUserId()!.Value, dto, ct));

    // POST /api/profile/password  { current, password }
    [HttpPost("password")]
    public async Task<IActionResult> SetPassword([FromBody] SetPasswordDto dto, CancellationToken ct) =>
        Map(await _profile.SetPasswordAsync(User.GetUserId()!.Value, dto, ct));
}
