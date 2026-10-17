using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Gardrop.Core.Application.Common;
using Gardrop.Core.Application.Common.DTOs;
using Gardrop.Core.Application.Common.Interfaces;

namespace Gardrop.Presentation.Controllers;

/// <summary>Admin: mağazaya ödənişlər (payout/settlement) — net qazancın köçürülməsi qeydi.</summary>
[ApiController]
[Authorize(Policy = "Admin")]
[Route("api/admin/stores/{storeId:int}/payouts")]
public class PayoutController : ControllerBase
{
    private readonly IStorePayoutService _payouts;
    public PayoutController(IStorePayoutService payouts) => _payouts = payouts;

    [HttpGet]
    public async Task<IActionResult> List(int storeId, CancellationToken ct) => Ok(await _payouts.ListAsync(storeId, ct));

    [HttpPost]
    public async Task<IActionResult> Create(int storeId, [FromBody] AdminPayoutDto dto, CancellationToken ct) =>
        (await _payouts.CreateAsync(dto with { StoreId = storeId }, ct)).ToActionResult();

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(int storeId, long id, CancellationToken ct) =>
        (await _payouts.DeleteAsync(id, ct)).ToActionResult();
}
