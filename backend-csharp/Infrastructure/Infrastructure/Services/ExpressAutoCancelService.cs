using Gardrop.Core.Application.Common.Interfaces;
using Gardrop.Core.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Gardrop.Infrastructure.Services;

/// <summary>
/// Ekspress sifarişlər: yaradılışdan 30 dəqiqə ərzində "Hazırlandı" işarələnməyibsə avtomatik ləğv edilir.
/// Ləğv → reytinq yenidən hesablanır (RatingEngine ləğvə görə mağazanı cərimələyir) + müştəri/mağaza bildirişi + email.
/// </summary>
public sealed class ExpressAutoCancelService : BackgroundService
{
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(2);
    private static readonly TimeSpan Limit = TimeSpan.FromMinutes(30);
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<ExpressAutoCancelService> _log;

    public ExpressAutoCancelService(IServiceScopeFactory scopeFactory, ILogger<ExpressAutoCancelService> log)
    { _scopeFactory = scopeFactory; _log = log; }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(Interval);
        do
        {
            try { await SweepAsync(stoppingToken); }
            catch (OperationCanceledException) { break; }
            catch (Exception ex) { _log.LogError(ex, "Ekspress auto-cancel sweep uğursuz oldu."); }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    private async Task SweepAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<IAppDbContext>();
        var orderStatus = scope.ServiceProvider.GetRequiredService<IOrderStatusService>();
        var notify = scope.ServiceProvider.GetRequiredService<INotificationService>();
        var rating = scope.ServiceProvider.GetRequiredService<IRatingRecomputeQueue>();
        var email = scope.ServiceProvider.GetRequiredService<IEmailSender>();

        var cutoff = DateTime.UtcNow - Limit;
        var stale = await db.Orders.Include(o => o.Items).Include(o => o.User)
            .Where(o => o.DeliveryType == DeliveryType.Express && o.Status == OrderStatus.Preparing && o.CreatedAt < cutoff)
            .ToListAsync(ct);
        if (stale.Count == 0) return;

        // Məhsul → mağaza sahibi (bildiriş üçün).
        var ownerByStore = await db.Stores.AsNoTracking().Where(s => s.OwnerUserId != null)
            .ToDictionaryAsync(s => s.Id, s => s.OwnerUserId!.Value, ct);
        var prodStore = await db.Products.AsNoTracking().Select(p => new { p.Id, p.StoreId })
            .ToDictionaryAsync(p => p.Id, p => p.StoreId, ct);

        foreach (var o in stale)
        {
            const string reason = "Ekspress sifariş 30 dəqiqə ərzində hazırlanmadığı üçün avtomatik ləğv edildi.";
            await orderStatus.ApplyStatusAsync(o, OrderStatus.Cancelled, reason, "Sistem", ct);
            notify.Notify(o.UserId, "order", "Sifariş ləğv edildi",
                $"{o.OrderNo} ekspress sifarişiniz vaxtında hazırlanmadığı üçün avtomatik ləğv edildi.");

            // Sifarişdəki mağaza sahiblərinə xəbərdarlıq (reytinqə təsir).
            var ownerIds = o.Items.Where(i => i.ProductId != 0 && prodStore.ContainsKey(i.ProductId))
                .Select(i => prodStore[i.ProductId]).Distinct()
                .Where(sid => ownerByStore.ContainsKey(sid)).Select(sid => ownerByStore[sid]).Distinct();
            foreach (var ownerId in ownerIds)
                notify.Notify(ownerId, "error", "Ekspress sifariş ləğv edildi",
                    $"{o.OrderNo} ekspress sifariş 30 dəqiqə ərzində hazırlanmadı və avtomatik ləğv edildi. Bu reytinqinizə mənfi təsir edir.");

            if (!string.IsNullOrWhiteSpace(o.User?.Email))
                _ = SafeEmail(email, o.User!.Email, "Sifarişiniz ləğv edildi",
                    $"<p><b>{o.OrderNo}</b> ekspress sifarişiniz vaxtında hazırlanmadığı üçün avtomatik ləğv edildi. Üzr istəyirik.</p>");
        }

        await db.SaveChangesAsync(ct);
        rating.Request();  // ləğvlər → mağaza reytinqi yenidən hesablanır (fon)
        _log.LogInformation("Ekspress auto-cancel: {Count} sifariş ləğv edildi.", stale.Count);
    }

    private static async Task SafeEmail(IEmailSender email, string to, string subject, string html)
    {
        try { await email.SendAsync(to, subject, html); } catch { /* email xətası sifarişi pozmasın */ }
    }
}
