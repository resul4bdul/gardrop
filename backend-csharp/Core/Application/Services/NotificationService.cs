using Microsoft.EntityFrameworkCore;

namespace Gardrop.Core.Application.Services;

/// <summary>İstifadəçi bildirişləri — yaratma + oxuma/işarələmə (Scoped, DbContext inject).</summary>
public class NotificationService : INotificationService
{
    private readonly IAppDbContext _db;
    public NotificationService(IAppDbContext db) => _db = db;

    public void Notify(long userId, string type, string title, string body)
    {
        _db.Notifications.Add(new Notification
        {
            UserId = userId,
            Type = type,
            Title = title,
            Body = body,
            CreatedAt = DateTime.UtcNow,
        });
    }

    public async Task<(int Unread, List<Notification> Items)> ListAsync(long userId, CancellationToken ct = default)
    {
        var items = await _db.Notifications.AsNoTracking()
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt).Take(50).ToListAsync(ct);
        return (items.Count(n => !n.Read), items);
    }

    public async Task MarkAllReadAsync(long userId, CancellationToken ct = default)
    {
        var items = await _db.Notifications.Where(n => n.UserId == userId && !n.Read).ToListAsync(ct);
        foreach (var n in items) n.Read = true;
        await _db.SaveChangesAsync(ct);
    }

    public async Task<bool> MarkReadAsync(long userId, long id, CancellationToken ct = default)
    {
        var n = await _db.Notifications.FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId, ct);
        if (n is null) return false;
        n.Read = true;
        await _db.SaveChangesAsync(ct);
        return true;
    }
}
