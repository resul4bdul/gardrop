using Microsoft.AspNetCore.Mvc;
using Gardrop.Core.Application.Common.Interfaces;

namespace Gardrop.Presentation.Controllers;

// Nazik controller — məntiq ICategoryService-dədir (Application qatı, bax menfiler D1/D2).
[ApiController]
[Route("api/categories")]
public class CategoriesController : ControllerBase
{
    private readonly ICategoryService _categories;
    public CategoriesController(ICategoryService categories) => _categories = categories;

    // GET /api/categories — say (Count) məhsullardan dinamik hesablanır
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct) => Ok(await _categories.ListWithCountsAsync(ct));
}
