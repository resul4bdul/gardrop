using System.Text.Json;
using Gardrop.Core.Application.Common;
using Gardrop.Core.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Core.Application.Services;

/// <summary>
/// Satıcı paneli servisləri üçün ortaq baza: sahiblik (Store.OwnerUserId) yoxlaması +
/// sifariş JSON sətirlərinin ayrışdırılması. Bax menfiler 3.1 — StoreService god-class-ı
/// SRP üzrə resurs servislərinə bölündü, təkrar məntiq buradadır (DRY).
/// </summary>
public abstract class StoreOwnerServiceBase
{
    protected readonly IAppDbContext _db;
    protected StoreOwnerServiceBase(IAppDbContext db) { _db = db; }

    protected static readonly OpResult NotOwned = OpResult.Fail(403, "Bu mağaza sizin deyil");

    /// <summary>Mağazanı yalnız sahibi üçün qaytarır (yoxdursa null → çağıran 403 verir).</summary>
    protected Task<Store?> OwnedAsync(long uid, int storeId, CancellationToken ct = default) =>
        _db.Stores.FirstOrDefaultAsync(s => s.Id == storeId && s.OwnerUserId == uid, ct);

    protected static HashSet<int> OrderStoreIds(IEnumerable<OrderItem> items, Dictionary<int, int> prodStore)
    {
        var ids = new HashSet<int>();
        foreach (var li in items)
            if (li.ProductId != 0 && prodStore.TryGetValue(li.ProductId, out var sid)) ids.Add(sid);
        return ids;
    }

    protected static (int count, decimal sum) MyItems(IEnumerable<OrderItem> items, HashSet<int> mine)
    {
        var (c, sum, _) = MyItemsDetailed(items, mine);
        return (c, sum);
    }

    protected static (int count, decimal sum, List<StoreOrderItem> items) MyItemsDetailed(IEnumerable<OrderItem> source, HashSet<int> mine)
    {
        int count = 0; decimal sum = 0; var items = new List<StoreOrderItem>();
        foreach (var li in source)
        {
            if (!mine.Contains(li.ProductId)) continue;
            count += li.Qty; sum += li.Price * li.Qty;
            items.Add(new StoreOrderItem(li.ProductId, li.Name, li.Qty, li.Price, li.SelectedSize));
        }
        return (count, sum, items);
    }

    protected static JsonElement Parse(string json)
    {
        try { return JsonSerializer.Deserialize<JsonElement>(json); }
        catch { return JsonSerializer.Deserialize<JsonElement>("null"); }
    }
}
