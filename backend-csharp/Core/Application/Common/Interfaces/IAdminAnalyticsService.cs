namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>Admin paneli — dashboard statistikası + analitika (bax menfiler 3.1).</summary>
public interface IAdminAnalyticsService
{
    Task<AdminStats> StatsAsync(CancellationToken ct = default);
    Task<AdminAnalytics> AnalyticsAsync(int days, CancellationToken ct = default);
}
