using Gardrop.Core.Application.Common.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Gardrop.Infrastructure.Services;

/// <summary>
/// Problem eskalasiya sweep-i: satıcının 48 saat cavab pəncərəsi bitmiş
/// "Satıcı cavabı gözlənilir" problemləri avtomatik arbitraja keçirir
/// (müştəri + adminlər bildiriş alır). Məntiq <see cref="IProblemService.EscalateOverdueAsync"/>-dədir.
/// </summary>
public sealed class ProblemEscalationService : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(5);
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ProblemEscalationService> _log;

    public ProblemEscalationService(IServiceScopeFactory scopeFactory, ILogger<ProblemEscalationService> log)
    { _scopeFactory = scopeFactory; _log = log; }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(Interval);
        do
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var problems = scope.ServiceProvider.GetRequiredService<IProblemService>();
                var n = await problems.EscalateOverdueAsync(stoppingToken);
                if (n > 0) _log.LogInformation("Problem eskalasiyası: {Count} problem arbitraja keçirildi.", n);
            }
            catch (OperationCanceledException) { break; }
            catch (Exception ex) { _log.LogError(ex, "Problem eskalasiya sweep uğursuz oldu."); }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
