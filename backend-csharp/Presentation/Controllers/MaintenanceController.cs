using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Gardrop.Core.Application.Common.Interfaces;

namespace Gardrop.Presentation.Controllers;

/// <summary>Admin bir-dəfəlik texniki əməliyyatlar (şəkil backfill). Yalnız admin.</summary>
[ApiController]
[Authorize(Policy = "Admin")]
[Route("api/admin/maintenance")]
public class MaintenanceController : ControllerBase
{
    private readonly IImageBackfillService _backfill;
    public MaintenanceController(IImageBackfillService backfill) => _backfill = backfill;

    // POST /api/admin/maintenance/images/backfill — köhnə şəkilləri WebP+thumbnail-a çevir.
    [HttpPost("images/backfill")]
    public async Task<IActionResult> BackfillImages(CancellationToken ct) =>
        Ok(await _backfill.BackfillAsync(ct));
}
