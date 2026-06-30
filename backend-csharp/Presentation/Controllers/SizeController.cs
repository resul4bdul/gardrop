using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Gardrop.Core.Application.Common.Interfaces;

namespace Gardrop.Presentation.Controllers;

// Nazik controller — orkestrasiya ISizeService-dədir (Application qatı, bax menfiler D1/D2).
[ApiController]
[Authorize]
[Route("api/size-recommendation")]
public class SizeController : ControllerBase
{
    private readonly ISizeService _size;
    public SizeController(ISizeService size) => _size = size;

    private async Task<IActionResult> Recommend(int productId, CancellationToken ct)
    {
        var r = await _size.RecommendAsync(User.GetUserId()!.Value, productId, ct);
        return r.ToActionResult();
    }

    // GET /api/size-recommendation/:productId
    [HttpGet("{productId:int}")]
    public Task<IActionResult> Get(int productId, CancellationToken ct) => Recommend(productId, ct);

    // POST /api/size-recommendation  { productId }
    [HttpPost]
    public Task<IActionResult> Post([FromBody] SizeReqDto dto, CancellationToken ct) => Recommend(dto.ProductId ?? 0, ct);
}
