using Gardrop.Core.Application.Common.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Gardrop.Infrastructure.Services;

/// <summary>
/// Reytinq hesablamasını fon-da icra edir (bax menfiler 4.4):
///  • Startup-dan sonra bir dəfə ilkin hesablama (host açılışını bloklamır).
///  • Mutasiyalar `IRatingRecomputeQueue.Request()` çağırır; ardıcıl istəklər qısa
///    debounce pəncərəsində tək hesablamaya birləşir (ağır tam recompute spam-ı qarşısı).
/// Singleton + HostedService kimi qeyd olunur; scoped IRatingService-i scope ilə çözür.
/// </summary>
public sealed class RatingRecomputeService : BackgroundService, IRatingRecomputeQueue
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<RatingRecomputeService> _log;
    private readonly SemaphoreSlim _signal = new(0);
    private int _pending;   // 0/1 coalesce bayrağı — çoxlu istək tək hesablamaya birləşir
    private static readonly TimeSpan Debounce = TimeSpan.FromSeconds(2);

    public RatingRecomputeService(IServiceScopeFactory scopeFactory, ILogger<RatingRecomputeService> log)
    {
        _scopeFactory = scopeFactory;
        _log = log;
    }

    public void Request()
    {
        // Yalnız 0→1 keçidində siqnal ver; gözləyən istək varsa təkrar release etmə.
        if (Interlocked.Exchange(ref _pending, 1) == 0)
            _signal.Release();
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await RecomputeAsync(stoppingToken, "İlkin");

        while (!stoppingToken.IsCancellationRequested)
        {
            try { await _signal.WaitAsync(stoppingToken); }
            catch (OperationCanceledException) { break; }

            // Debounce: qısa pəncərədə yığılan istəkləri birləşdir.
            try { await Task.Delay(Debounce, stoppingToken); }
            catch (OperationCanceledException) { break; }

            Interlocked.Exchange(ref _pending, 0);
            await RecomputeAsync(stoppingToken, "Fon");
        }
    }

    private async Task RecomputeAsync(CancellationToken ct, string reason)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var rating = scope.ServiceProvider.GetRequiredService<IRatingService>();
            await rating.RecomputeAsync(ct);
            _log.LogInformation("{Reason} reytinq/məhsul sayı hesablandı.", reason);
        }
        catch (OperationCanceledException) { }
        catch (Exception ex)
        {
            _log.LogError(ex, "{Reason} reytinq hesablaması uğursuz oldu.", reason);
        }
    }
}
