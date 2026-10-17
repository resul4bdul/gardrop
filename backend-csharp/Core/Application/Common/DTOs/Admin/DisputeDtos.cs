using Gardrop.Core.Domain.Models;

namespace Gardrop.Core.Application.Common.DTOs;

// ── Münaqişə (dispute) ──
public record DisputeCreateDto(string? Reason);
public record DisputeResolveDto(string? Action, string? Note);   // Action: "refund" | "freeze" | "dismiss"

public record DisputeView(
    long Id, long OrderId, string OrderNo, long UserId, string UserName, int? StoreId, string StoreName,
    string Reason, string Status, string Resolution, DateTime? ResolvedAt, DateTime CreatedAt);

// ── Aktivlik jurnalı ──
public record ActivityLogView(long Id, string ActorName, string Action, string EntityType, string EntityId, string Detail, DateTime CreatedAt)
{
    public static ActivityLogView From(ActivityLog a) =>
        new(a.Id, a.ActorName, a.Action, a.EntityType, a.EntityId, a.Detail, a.CreatedAt);
}
