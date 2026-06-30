using Gardrop.Infrastructure.Persistance.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Gardrop.Infrastructure.HealthChecks;

/// <summary>
/// Readiness probe — PostgreSQL əlçatandırmı (sadə CanConnect yoxlaması).
/// MapHealthChecks("/health/ready") bunu işlədir; liveness ayrıca (heç bir yoxlama) qalır.
/// </summary>
public sealed class DbHealthCheck : IHealthCheck
{
    private readonly AppDbContext _db;
    public DbHealthCheck(AppDbContext db) => _db = db;

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        try
        {
            var ok = await _db.Database.CanConnectAsync(cancellationToken);
            return ok
                ? HealthCheckResult.Healthy("Verilənlər bazası əlçatandır.")
                : HealthCheckResult.Unhealthy("Verilənlər bazasına qoşulmaq mümkün olmadı.");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Verilənlər bazası yoxlaması uğursuz oldu.", ex);
        }
    }
}
