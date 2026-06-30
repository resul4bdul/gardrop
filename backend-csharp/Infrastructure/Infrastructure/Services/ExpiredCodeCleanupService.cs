using Gardrop.Infrastructure.Persistance.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Gardrop.Infrastructure.Services;

/// <summary>
/// Vaxtı keçmiş birdəfəlik email kodlarını (OTP/verify/reset) dövri olaraq təmizləyir.
/// Əvvəl yalnız yeni kod göndəriləndə inline silinirdi (menfiler A3 — arxa-plan işi yox idi).
/// </summary>
public sealed class ExpiredCodeCleanupService : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromHours(1);
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ExpiredCodeCleanupService> _log;

    public ExpiredCodeCleanupService(IServiceScopeFactory scopeFactory, ILogger<ExpiredCodeCleanupService> log)
    {
        _scopeFactory = scopeFactory;
        _log = log;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(Interval);
        do
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<IAppDbContext>();
                var cutoff = DateTime.UtcNow;
                var removed = await db.EmailCodes.Where(c => c.ExpiresAt < cutoff).ExecuteDeleteAsync(stoppingToken);
                if (removed > 0) _log.LogInformation("Vaxtı keçmiş {Count} email kodu təmizləndi.", removed);
            }
            catch (OperationCanceledException) { break; }
            catch (Exception ex)
            {
                _log.LogError(ex, "Email kodu təmizliyi uğursuz oldu.");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
