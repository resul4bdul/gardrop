namespace Gardrop.Core.Application.Common.DTOs;

/// <summary>GET /api/health — DB əlçatanlığı + əsas sayğaclar.
/// JSON: { ok, users, orders, ts } (əvvəlki anonim şəkillə eyni).</summary>
public record HealthSnapshot(bool Ok, int Users, int Orders, DateTime Ts);
