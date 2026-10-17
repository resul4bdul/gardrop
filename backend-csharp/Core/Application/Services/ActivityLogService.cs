using Gardrop.Core.Application.Common.DTOs;
using Gardrop.Core.Application.Common.Interfaces;
using Gardrop.Core.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Core.Application.Services;

/// <summary>Aktivlik jurnalı (Scoped) — Log yalnız entity əlavə edir (çağıran SaveChanges edir/edəcək).</summary>
public class ActivityLogService : IActivityLogService
{
    private readonly IAppDbContext _db;
    public ActivityLogService(IAppDbContext db) => _db = db;

    public void Log(long actorId, string actorName, string action, string entityType, string entityId, string detail) =>
        _db.ActivityLogs.Add(new ActivityLog
        {
            ActorId = actorId, ActorName = actorName, Action = action,
            EntityType = entityType, EntityId = entityId, Detail = detail,
            CreatedAt = DateTime.UtcNow,
        });

    public async Task<List<ActivityLogView>> RecentAsync(int limit = 50, CancellationToken ct = default)
    {
        limit = Math.Clamp(limit, 1, 200);
        return (await _db.ActivityLogs.AsNoTracking()
            .OrderByDescending(a => a.Id).Take(limit).ToListAsync(ct))
            .Select(ActivityLogView.From).ToList();
    }
}
