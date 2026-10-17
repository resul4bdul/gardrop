using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Gardrop.Core.Application.Common.Interfaces;

namespace Gardrop.Presentation.Controllers;

// Nazik controller — məntiq INotificationService-dədir (Application qatı, bax menfiler D1/D2).
[ApiController]
[Authorize]
[Route("api/notifications")]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notifications;
    public NotificationsController(INotificationService notifications) => _notifications = notifications;

    // GET /api/notifications — cari istifadəçinin bildirişləri (ən yeni öndə)
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct)
    {
        var (unread, items) = await _notifications.ListAsync(User.GetUserId()!.Value, ct);
        return Ok(new { unread, items });
    }

    // POST /api/notifications/read  — hamısını oxunmuş işarələ
    [HttpPost("read")]
    public async Task<IActionResult> MarkAllRead(CancellationToken ct)
    {
        await _notifications.MarkAllReadAsync(User.GetUserId()!.Value, ct);
        return Ok(new { ok = true });
    }

    // POST /api/notifications/:id/read — birini oxunmuş işarələ
    [HttpPost("{id:long}/read")]
    public async Task<IActionResult> MarkRead(long id, CancellationToken ct)
    {
        if (!await _notifications.MarkReadAsync(User.GetUserId()!.Value, id, ct))
            return NotFound(new { error = "Bildiriş tapılmadı" });
        return Ok(new { ok = true });
    }
}
