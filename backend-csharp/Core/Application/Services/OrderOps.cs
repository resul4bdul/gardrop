using Gardrop.Core.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Core.Application.Services;

/// <summary>Sifariş statusu + stok düzəlişləri — admin və mağaza paneli üçün ortaq məntiq.</summary>
public class OrderOps : IOrderStatusService
{
    private readonly IAppDbContext _db;
    private readonly INotificationService _notify;
    public OrderOps(IAppDbContext db, INotificationService notify) { _db = db; _notify = notify; }

    // Status sətirləri OrderStatus enum-undan törədilir (tək mənbə — bax menfiler E5).
    // EF kolonu hələ string saxlayır (C3/D3 deferred); enum adları DB dəyərləri ilə eynidir.
    private static readonly string[] _statuses = OrderStatus.All;
    public IReadOnlyList<string> Statuses => _statuses;
    public bool IsValidStatus(string? s) => s is not null && _statuses.Contains(s);

    // Mağaza sahibinin təyin edə biləcəyi statuslar: Hazırlanır / Hazırlandı / Kuryerə verildi (Yolda).
    // "Çatdırıldı", "İptal", "Qaytarıldı" yalnız sistem/admin tərəfindən.
    private static readonly string[] _storeAllowed = { OrderStatus.Preparing, OrderStatus.Prepared, OrderStatus.OnTheWay };
    public IReadOnlyList<string> StoreAllowedStatuses => _storeAllowed;

    /// <summary>Sifariş statusunu dəyişir: zaman damğaları + stok azalt/qaytar (idempotent).</summary>
    public async Task ApplyStatusAsync(Order o, string status, string? cancelReason = null, string? cancelledBy = null, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        o.Status = status;

        switch (status)
        {
            case OrderStatus.Prepared: o.ConfirmedAt ??= now; break;
            case OrderStatus.OnTheWay:      o.ConfirmedAt ??= now; o.ShippedAt ??= now; break;
            case OrderStatus.Delivered:
                o.ConfirmedAt ??= now; o.ShippedAt ??= now; o.DeliveredAt ??= now;
                // COD: ödəniş çatdırılmada yığılır → Paid (bax A.1).
                if (o.PaymentProvider == "cod" && o.PaymentStatus == PaymentStatus.Pending)
                {
                    o.PaymentStatus = PaymentStatus.Paid;
                    o.PaidAt ??= now;
                }
                break;
            case OrderStatus.Cancelled:
                o.CancelledAt = now;
                if (cancelReason is not null) o.CancelReason = cancelReason.Trim();
                if (cancelledBy is not null) o.CancelledBy = cancelledBy;
                break;
        }

        bool deducting = status is OrderStatus.OnTheWay or OrderStatus.Delivered;
        if (deducting && !o.StockDeducted)
        {
            await AdjustStockAsync(o, -1, ct);
            o.StockDeducted = true;
            await StockSideEffectsAsync(o, ct);   // stok azdır / bitdi → bildiriş + silmə
        }
        else if (status == OrderStatus.Cancelled && o.StockDeducted)
        {
            await AdjustStockAsync(o, +1, ct);
            o.StockDeducted = false;
        }
    }

    /// <summary>
    /// Stok azaldıqdan sonra: stok 0 olan məhsulu sil + mağazaya bildiriş;
    /// stok 10-dan az olduqda mağazaya "stok azdır" bildirişi (bir dəfə, spam qarşısı).
    /// </summary>
    private async Task StockSideEffectsAsync(Order o, CancellationToken ct = default)
    {
        var pids = OrderProductIds(o);
        if (pids.Count == 0) return;

        // mağaza → sahib istifadəçi xəritəsi (bildiriş üçün)
        var ownerByStore = await _db.Stores.AsNoTracking()
            .Where(s => s.OwnerUserId != null)
            .ToDictionaryAsync(s => s.Id, s => s.OwnerUserId!.Value, ct);

        // Bütün məhsulları tək sorğu ilə yüklə (N+1 qarşısı, bax menfiler 4.2)
        var products = await _db.Products.Where(x => pids.Contains(x.Id)).ToListAsync(ct);

        foreach (var p in products)
        {
            ownerByStore.TryGetValue(p.StoreId, out var ownerId);

            if (p.Stock <= 0)
            {
                // Stok bitdi → məhsul silinir + mağazaya bildiriş
                if (ownerId != 0)
                    _notify.Notify(ownerId, "error", "Məhsul bitdi və silindi",
                        $"\"{p.Name}\" məhsulunun stoku bitdi və saytdan avtomatik silindi. Yenidən yükləyə bilərsiniz.");
                // Asılı səbət/seçilmiş qeydlərini təmizlə (sifariş tarixçəsi JSON-da qalır)
                _db.RemoveProductWithDependents(p);
            }
            else if (p.Stock < 10 && !p.LowStockNotified)
            {
                if (ownerId != 0)
                    _notify.Notify(ownerId, "info", "Stok azalır",
                        $"\"{p.Name}\" məhsulundan stokda yalnız {p.Stock} ədəd qaldı. Stoku artırmağı düşünün.");
                p.LowStockNotified = true;
            }
        }
    }

    private static List<int> OrderProductIds(Order o) =>
        o.Items.Select(i => i.ProductId).Where(id => id != 0).Distinct().ToList();

    /// <summary>Sifariş məhsullarının stokunu sign (-1 azalt / +1 geri qaytar) ilə tənzimləyir.</summary>
    private async Task AdjustStockAsync(Order o, int sign, CancellationToken ct = default)
    {
        // Yalnız real id-li sətirlər → məhsulları tək sorğu ilə yüklə (N+1 qarşısı, bax menfiler 4.2)
        var lines = o.Items.Where(l => l.ProductId != 0).ToList();
        if (lines.Count == 0) return;

        var ids = lines.Select(l => l.ProductId).Distinct().ToList();
        var products = await _db.Products.Where(x => ids.Contains(x.Id)).ToDictionaryAsync(x => x.Id, ct);

        foreach (var (pid, qty, size) in lines.Select(l => (l.ProductId, l.Qty, l.SelectedSize)))
        {
            if (!products.TryGetValue(pid, out var p)) continue;

            var ss = new Dictionary<string, int>(p.SizeStock);
            if (!string.IsNullOrEmpty(size) && ss.ContainsKey(size))
                ss[size] = Math.Max(0, ss[size] + sign * qty);
            else if (ss.Count > 0)
            {
                var k = ss.Keys.First();
                ss[k] = Math.Max(0, ss[k] + sign * qty);
            }
            p.SizeStock = ss;
            p.Sizes = ss.Keys.ToList();
            p.Stock = ss.Count > 0 ? ss.Values.Sum() : Math.Max(0, p.Stock + sign * qty);
            // Satış sayğacı: stok azalanda (sign=-1) artır, ləğv geri qaytaranda (sign=+1) azalt.
            p.SalesCount = Math.Max(0, p.SalesCount - sign * qty);
            if (p.Stock >= 10 && p.LowStockNotified) p.LowStockNotified = false;  // stok bərpa olundu
        }
    }
}
