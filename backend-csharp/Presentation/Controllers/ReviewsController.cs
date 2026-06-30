using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Gardrop.Core.Application.Common.Interfaces;

namespace Gardrop.Presentation.Controllers;

// Nazik controller — biznes qaydaları IReviewService-dədir (Application qatı, bax menfiler D1/D2).
[ApiController]
[Route("api/reviews")]
public class ReviewsController : ControllerBase
{
    private readonly IReviewService _reviews;
    public ReviewsController(IReviewService reviews) => _reviews = reviews;

    // GET /api/reviews/:productId  (public)
    [HttpGet("{productId:int}")]
    public async Task<IActionResult> Get(int productId, CancellationToken ct) =>
        Ok(await _reviews.GetForProductAsync(productId, ct));

    // GET /api/reviews/eligible  (auth)
    [Authorize]
    [HttpGet("eligible")]
    public async Task<IActionResult> Eligible(CancellationToken ct) =>
        Ok(await _reviews.EligibleAsync(User.GetUserId()!.Value, ct));

    // POST /api/reviews/:productId  { rating, comment, imageUrls }  (auth)
    [Authorize]
    [HttpPost("{productId:int}")]
    public async Task<IActionResult> Create(int productId, [FromBody] ReviewDto dto, CancellationToken ct)
    {
        var r = await _reviews.CreateAsync(User.GetUserId()!.Value, productId, dto, ct);
        return r.ToActionResult();
    }
}
