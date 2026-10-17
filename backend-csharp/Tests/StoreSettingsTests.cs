using Gardrop.Core.Application.Common.DTOs;
using Gardrop.Core.Application.Services;
using Gardrop.Core.Domain.Models;
using Gardrop.Infrastructure.Persistance.Data;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Tests;

/// <summary>Mağaza ayarları (FAZA 6): UpdateSelf həssas/public sahələri yazır, Settings həssasları qaytarır, sahiblik 403.</summary>
public class StoreSettingsTests
{
    private const int StoreId = 10;
    private const long Owner = 7;

    private static async Task<AppDbContext> SeedAsync()
    {
        var db = TestDb.New();
        db.Stores.Add(new Store { Id = StoreId, Name = "BakuWear", OwnerUserId = Owner });
        await db.SaveChangesAsync();
        return db;
    }

    private static StoreProfileService Svc(AppDbContext db) =>
        new(db, new FakeRatingQueue(), new CommissionService(db));

    [Fact]
    public async Task Update_writes_public_and_sensitive_fields()
    {
        using var db = await SeedAsync();
        var dto = new StoreSelfDto(null, null, null, null, null, null, null,
            Instagram: "@shop", Phone: "+994", PrepDays: 2,
            BankName: "Kapital", Iban: "AZ00", Voen: "123", NotifyEmail: false);

        var r = await Svc(db).UpdateSelfAsync(Owner, StoreId, dto);
        Assert.Equal(200, r.Status);

        var s = await db.Stores.SingleAsync(x => x.Id == StoreId);
        Assert.Equal("@shop", s.Instagram);
        Assert.Equal("+994", s.Phone);
        Assert.Equal(2, s.PrepDays);
        Assert.Equal("Kapital", s.BankName);
        Assert.Equal("123", s.Voen);
        Assert.False(s.NotifyEmail);
    }

    [Fact]
    public async Task Settings_returns_sensitive_only()
    {
        using var db = await SeedAsync();
        await Svc(db).UpdateSelfAsync(Owner, StoreId,
            new StoreSelfDto(null, null, null, null, null, null, null, BankName: "B", Beneficiary: "Ali", Voen: "999"));

        var r = await Svc(db).SettingsAsync(Owner, StoreId);
        var st = Assert.IsType<StoreSettings>(r.Data);
        Assert.Equal("B", st.BankName);
        Assert.Equal("Ali", st.Beneficiary);
        Assert.Equal("999", st.Voen);
        Assert.True(st.NotifyNewOrder);   // default açıq
    }

    [Fact]
    public async Task Update_by_non_owner_is_forbidden()
    {
        using var db = await SeedAsync();
        var r = await Svc(db).UpdateSelfAsync(999, StoreId, new StoreSelfDto("Hack", null, null, null, null, null, null));
        Assert.Equal(403, r.Status);
    }

    [Fact]
    public async Task Settings_by_non_owner_is_forbidden()
    {
        using var db = await SeedAsync();
        var r = await Svc(db).SettingsAsync(999, StoreId);
        Assert.Equal(403, r.Status);
    }
}
