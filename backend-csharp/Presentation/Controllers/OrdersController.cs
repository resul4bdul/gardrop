using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Gardrop.Core.Application.Common.Interfaces;

namespace Gardrop.Presentation.Controllers;

// Nazik controller — biznes məntiqi IOrderService-dədir (Application qatı, bax menfiler D1/D2).
[ApiController]
[Authorize]
[Route("api/orders")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orders;
    private readonly IDisputeService _disputes;
    private readonly IProblemService _problems;
    public OrdersController(IOrderService orders, IDisputeService disputes, IProblemService problems)
    { _orders = orders; _disputes = disputes; _problems = problems; }

    // POST /api/orders/:id/problem  { reason, description, photos } — müştəri problem açır (Trendyol modeli)
    [HttpPost("{id:long}/problem")]
    public async Task<IActionResult> OpenProblem(long id, [FromBody] ProblemCreateDto dto, CancellationToken ct) =>
        (await _problems.CreateAsync(User.GetUserId()!.Value, id, dto, ct)).ToActionResult();

    // POST /api/orders/:id/dispute — KÖHNƏ sadə şikayət axını (yeni UI /problem istifadə edir; geriyə uyumluluq üçün saxlanılır)
    [HttpPost("{id:long}/dispute")]
    public async Task<IActionResult> OpenDispute(long id, [FromBody] DisputeCreateDto dto, CancellationToken ct) =>
        (await _disputes.CreateAsync(User.GetUserId()!.Value, id, dto, ct)).ToActionResult();

    // POST /api/orders
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] OrderDto dto, CancellationToken ct)
    {
        var r = await _orders.CreateAsync(User.GetUserId()!.Value, dto, ct);
        return r.ToActionResult();
    }

    // GET /api/orders  (cari istifadəçi) — opt-in səhifələmə (page/pageSize, bax menfiler 4.3)
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] int? page, [FromQuery] int? pageSize, CancellationToken ct) =>
        Ok(await _orders.ListAsync(User.GetUserId()!.Value, page, pageSize, ct));

    // GET /api/orders/:id
    [HttpGet("{id:long}")]
    public async Task<IActionResult> One(long id, CancellationToken ct)
    {
        var order = await _orders.GetAsync(User.GetUserId()!.Value, id, ct);
        return order is null ? NotFound(new { error = "Sifariş tapılmadı" }) : Ok(order);
    }

    // POST /api/orders/:id/cancel  { reason }
    [HttpPost("{id:long}/cancel")]
    public async Task<IActionResult> Cancel(long id, [FromBody] CancelDto? dto, CancellationToken ct)
    {
        var r = await _orders.CancelAsync(User.GetUserId()!.Value, id, dto, ct);
        return r.ToActionResult();
    }
}
