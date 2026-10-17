using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Gardrop.Core.Application.Common.Interfaces;

namespace Gardrop.Presentation.Controllers;

/// <summary>Müştəri tərəfi problem (geri qaytarma/şikayət) əməliyyatları. Nazik controller — məntiq IProblemService-dədir.</summary>
[ApiController]
[Authorize]
[Route("api/problems")]
public class ProblemsController : ControllerBase
{
    private readonly IProblemService _problems;
    public ProblemsController(IProblemService problems) { _problems = problems; }

    private long Uid => User.GetUserId()!.Value;

    // GET /api/problems/my — cari müştərinin problemləri
    [HttpGet("my")]
    public async Task<IActionResult> My(CancellationToken ct) => Ok(await _problems.MyAsync(Uid, ct));

    // GET /api/problems/:id — detal + status timeline
    [HttpGet("{id:long}")]
    public async Task<IActionResult> One(long id, CancellationToken ct) =>
        (await _problems.GetAsync(Uid, id, ct)).ToActionResult();

    // POST /api/problems/:id/cancel — müştəri problemi geri götürür
    [HttpPost("{id:long}/cancel")]
    public async Task<IActionResult> Cancel(long id, CancellationToken ct) =>
        (await _problems.CancelAsync(Uid, id, ct)).ToActionResult();
}
