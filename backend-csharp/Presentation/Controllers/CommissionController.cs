using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Gardrop.Core.Application.Common.Interfaces;

namespace Gardrop.Presentation.Controllers;

/// <summary>Admin: mağaza komissiyalarının idarəsi (kateqoriya üzrə pay %).</summary>
[ApiController]
[Authorize(Policy = "Admin")]
[Route("api/admin/stores/{storeId:int}/commissions")]
public class CommissionController : ControllerBase
{
    private readonly ICommissionService _commissions;
    public CommissionController(ICommissionService commissions) => _commissions = commissions;

    [HttpGet]
    public async Task<IActionResult> List(int storeId, CancellationToken ct) => Ok(await _commissions.ListAsync(storeId, ct));

    [HttpPut]
    public async Task<IActionResult> Replace(int storeId, [FromBody] List<StoreCommissionDto> rows, CancellationToken ct)
    {
        await _commissions.ReplaceAsync(storeId, rows ?? new(), ct);
        return Ok(new { ok = true });
    }
}
