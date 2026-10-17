using Gardrop.Core.Application.Common;
using Gardrop.Core.Application.Common.DTOs;

namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>Platforma aktivlik jurnalı — yazma (fire-and-forget kimi çağırılır) + admin oxuma.</summary>
public interface IActivityLogService
{
    /// <summary>Bir aktivlik qeyd et (SaveChanges özü etmir — cari əməliyyatla birgə yazılır).</summary>
    void Log(long actorId, string actorName, string action, string entityType, string entityId, string detail);
    Task<List<ActivityLogView>> RecentAsync(int limit = 50, CancellationToken ct = default);
}

/// <summary>Müştəri münaqişələri — müştəri açır, admin həll edir.</summary>
public interface IDisputeService
{
    Task<OpResult> CreateAsync(long userId, long orderId, DisputeCreateDto dto, CancellationToken ct = default);
    Task<List<DisputeView>> ListAsync(string? status, CancellationToken ct = default);
    Task<OpResult> ResolveAsync(long adminId, long disputeId, DisputeResolveDto dto, CancellationToken ct = default);
}
