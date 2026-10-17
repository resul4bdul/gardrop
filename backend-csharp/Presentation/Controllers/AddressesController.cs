using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Gardrop.Core.Application.Common.Interfaces;

namespace Gardrop.Presentation.Controllers;

// Nazik controller — məntiq IAddressService-dədir (Application qatı, bax menfiler D1/D2).
[ApiController]
[Authorize]
[Route("api/addresses")]
public class AddressesController : ControllerBase
{
    private readonly IAddressService _addresses;
    public AddressesController(IAddressService addresses) => _addresses = addresses;

    // GET /api/addresses
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct) =>
        Ok(await _addresses.GetAllAsync(User.GetUserId()!.Value, ct));

    // POST /api/addresses  { unvan, lat?, lng? }  — yalnız Bakı daxili, etiket/şəhər lazım deyil
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AddressDto dto, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(dto.Unvan))
            return BadRequest(new { error = "Ünvan mütləqdir" });
        return StatusCode(201, await _addresses.CreateAsync(User.GetUserId()!.Value, dto, ct));
    }

    // PUT /api/addresses/:id
    [HttpPut("{id:long}")]
    public async Task<IActionResult> Update(long id, [FromBody] AddressDto dto, CancellationToken ct)
    {
        var result = await _addresses.UpdateAsync(User.GetUserId()!.Value, id, dto, ct);
        if (result is null) return NotFound(new { error = "Ünvan tapılmadı" });
        return Ok(result);
    }

    // DELETE /api/addresses/:id
    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id, CancellationToken ct) =>
        Ok(await _addresses.DeleteAsync(User.GetUserId()!.Value, id, ct));
}
