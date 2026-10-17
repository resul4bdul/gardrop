using Gardrop.Core.Application.Common.DTOs;
using Gardrop.Core.Application.Services;
using Gardrop.Core.Domain.Enums;
using Gardrop.Core.Domain.Models;
using Gardrop.Infrastructure.Persistance.Data;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Tests;

/// <summary>Payout/settlement admin CRUD + validasiya + soft-delete.</summary>
public class StorePayoutServiceTests
{
    private const int StoreId = 10;

    private static async Task<AppDbContext> SeedStoreAsync()
    {
        var db = TestDb.New();
        db.Stores.Add(new Store { Id = StoreId, Name = "BakuWear" });
        await db.SaveChangesAsync();
        return db;
    }

    [Fact]
    public async Task Create_paid_sets_paidAt_and_lists()
    {
        using var db = await SeedStoreAsync();
        var svc = new StorePayoutService(db);

        var r = await svc.CreateAsync(new AdminPayoutDto(StoreId, DateTime.UtcNow.AddDays(-30), DateTime.UtcNow, 250m, PayoutStatus.Paid, "Kapital", "REF1", "iyun"));
        Assert.Equal(201, r.Status);

        var list = await svc.ListAsync(StoreId);
        Assert.Single(list);
        Assert.Equal(250m, list[0].Amount);
        Assert.Equal(PayoutStatus.Paid, list[0].Status);
        Assert.NotNull(list[0].PaidAt);
    }

    [Fact]
    public async Task Create_pending_has_no_paidAt()
    {
        using var db = await SeedStoreAsync();
        var r = await new StorePayoutService(db).CreateAsync(new AdminPayoutDto(StoreId, null, null, 100m, null, null, null, null));
        var view = Assert.IsType<PayoutView>(r.Data);
        Assert.Equal(PayoutStatus.Pending, view.Status);
        Assert.Null(view.PaidAt);
    }

    [Fact]
    public async Task Create_rejects_non_positive_amount()
    {
        using var db = await SeedStoreAsync();
        var r = await new StorePayoutService(db).CreateAsync(new AdminPayoutDto(StoreId, null, null, 0m, null, null, null, null));
        Assert.Equal(400, r.Status);
    }

    [Fact]
    public async Task Create_rejects_unknown_store()
    {
        using var db = await SeedStoreAsync();
        var r = await new StorePayoutService(db).CreateAsync(new AdminPayoutDto(999, null, null, 10m, null, null, null, null));
        Assert.Equal(404, r.Status);
    }

    [Fact]
    public async Task Delete_soft_removes()
    {
        using var db = await SeedStoreAsync();
        var svc = new StorePayoutService(db);
        var view = Assert.IsType<PayoutView>((await svc.CreateAsync(new AdminPayoutDto(StoreId, null, null, 10m, null, null, null, null))).Data);

        var d = await svc.DeleteAsync(view.Id);
        Assert.Equal(200, d.Status);
        Assert.Empty(await svc.ListAsync(StoreId));
        Assert.False(await db.StorePayouts.AnyAsync());   // qlobal soft-delete filtri
    }

    [Fact]
    public async Task Delete_missing_returns_404()
    {
        using var db = await SeedStoreAsync();
        var r = await new StorePayoutService(db).DeleteAsync(12345);
        Assert.Equal(404, r.Status);
    }
}
