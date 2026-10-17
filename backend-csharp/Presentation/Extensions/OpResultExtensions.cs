using Microsoft.AspNetCore.Mvc;
using Gardrop.Core.Application.Common;

namespace Gardrop.Presentation.Extensions;

// OpResult → IActionResult tək yerdə (bax menfiler 3.3 — controller boilerplate DRY).
public static class OpResultExtensions
{
    // Uğur: status + data; xəta: status + { error }.
    public static IActionResult ToActionResult(this OpResult r) =>
        new ObjectResult(r.IsSuccess ? r.Data : new { error = r.Error }) { StatusCode = r.Status };
}
