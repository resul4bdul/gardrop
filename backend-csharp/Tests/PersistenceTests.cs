using Gardrop.Core.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Tests;

/// <summary>
/// Persistence davranışı — bax menfiler 2.2 / 2.3.
/// 2.3: Product/Store.Id DB identity tərəfindən təyin olunur (manual MaxAsync+1 silindi) —
///      explicit Id verilmədikdə avtomatik sıfırdan fərqli Id alınır.
/// 2.2: Order.PreparedStores relyasion List&lt;int&gt; kimi davam edir (əvvəl JSON string blob).
/// </summary>
public class PersistenceTests
{
    [Fact]
    public async Task Product_id_is_db_generated_when_not_set()
    {
        using var db = TestDb.New();
        var p = new Product { Name = "Auto", StoreId = 1, Price = 5m };   // Id təyin edilmir
        db.Products.Add(p);
        await db.SaveChangesAsync();
        Assert.NotEqual(0, p.Id);   // DB identity Id verdi (bax menfiler 2.3)
    }

    [Fact]
    public async Task Store_id_is_db_generated_when_not_set()
    {
        using var db = TestDb.New();
        var s = new Store { Name = "AutoStore" };   // Id təyin edilmir
        db.Stores.Add(s);
        await db.SaveChangesAsync();
        Assert.NotEqual(0, s.Id);
    }

    [Fact]
    public async Task Order_prepared_stores_round_trips_as_list()
    {
        using var db = TestDb.New();
        var o = new Order { UserId = 1, OrderNo = "#GD-111111", PreparedStores = new() { 3, 7 } };
        db.Orders.Add(o);
        await db.SaveChangesAsync();
        db.ChangeTracker.Clear();

        var loaded = await db.Orders.SingleAsync(x => x.Id == o.Id);
        Assert.Equal(new[] { 3, 7 }, loaded.PreparedStores);
    }
}
