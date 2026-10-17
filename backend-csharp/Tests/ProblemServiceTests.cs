using Gardrop.Core.Application.Common.DTOs;
using Gardrop.Core.Application.Services;
using Gardrop.Core.Domain.Enums;
using Gardrop.Core.Domain.Models;
using Gardrop.Infrastructure.Persistance.Data;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Tests;

/// <summary>
/// Problem (geri qaytarma/şikayət — Trendyol modeli) axını: müştəri açır (14 gün pəncərə),
/// satıcı 48 saatda qəbul/rədd, admin arbitraj + kuryer xərci qərarı, auto-refund, eskalasiya.
/// </summary>
public class ProblemServiceTests
{
    private const long CustomerId = 1;
    private const long OwnerId = 2;
    private const long AdminId = 3;
    private const int StoreId = 10;
    private const int ProductId = 100;
    private const long OrderId = 1000;

    private static async Task<(AppDbContext db, ProblemService svc, FakeNotificationService notify)> SeedAsync(
        DateTime? deliveredAt = null)
    {
        var db = TestDb.New();
        db.Users.Add(new User { Id = CustomerId, Email = "c@x.az", FirstName = "Müştəri" });
        db.Users.Add(new User { Id = OwnerId, Email = "o@x.az", FirstName = "Sahib" });
        db.Users.Add(new User { Id = AdminId, Email = "a@x.az", FirstName = "Admin", IsAdmin = true });
        db.Stores.Add(new Store { Id = StoreId, Name = "BakuWear", OwnerUserId = OwnerId });
        db.Products.Add(new Product { Id = ProductId, Name = "Köynək", StoreId = StoreId });
        db.Orders.Add(new Order
        {
            Id = OrderId, UserId = CustomerId, OrderNo = "GD-1", Status = OrderStatus.Delivered,
            DeliveredAt = deliveredAt ?? DateTime.UtcNow.AddDays(-1),
            Items = new List<OrderItem> { new() { ProductId = ProductId, Name = "Köynək", Qty = 1, Price = 50m } },
        });
        await db.SaveChangesAsync();
        var notify = new FakeNotificationService();
        var svc = new ProblemService(db, notify, new ActivityLogService(db));
        return (db, svc, notify);
    }

    private static ProblemCreateDto Dto(string reason = ProblemReason.Defective, string desc = "Tikişi sökülüb") =>
        new(reason, desc, new List<string> { "/uploads/p1.webp" });

    // ── Müştəri: açılış ──

    [Fact]
    public async Task Create_opens_awaiting_store_with_event_and_deadline()
    {
        var (db, svc, notify) = await SeedAsync();
        var r = await svc.CreateAsync(CustomerId, OrderId, Dto());
        Assert.Equal(201, r.Status);

        var p = await db.Problems.SingleAsync();
        Assert.Equal(ProblemStatus.AwaitingStore, p.Status);
        Assert.True(p.StoreDeadline > DateTime.UtcNow.AddHours(47) && p.StoreDeadline < DateTime.UtcNow.AddHours(49));
        Assert.Equal(StoreId, p.StoreId);
        Assert.Single(await db.ProblemEvents.Where(e => e.ProblemId == p.Id).ToListAsync());
        // Satıcı + admin bildiriş aldı.
        Assert.Contains(notify.Sent, n => n.userId == OwnerId);
        Assert.Contains(notify.Sent, n => n.userId == AdminId);
    }

    [Fact]
    public async Task Create_rejects_unknown_reason_and_short_description()
    {
        var (_, svc, _) = await SeedAsync();
        Assert.Equal(400, (await svc.CreateAsync(CustomerId, OrderId, new ProblemCreateDto("Yox belə səbəb", "təsvir uzun", null))).Status);
        Assert.Equal(400, (await svc.CreateAsync(CustomerId, OrderId, new ProblemCreateDto(ProblemReason.Defective, "qs", null))).Status);
    }

    [Fact]
    public async Task Create_rejects_after_14_day_window()
    {
        var (_, svc, _) = await SeedAsync(deliveredAt: DateTime.UtcNow.AddDays(-15));
        Assert.Equal(409, (await svc.CreateAsync(CustomerId, OrderId, Dto())).Status);
    }

    [Fact]
    public async Task Create_rejects_duplicate_active_problem()
    {
        var (_, svc, _) = await SeedAsync();
        Assert.Equal(201, (await svc.CreateAsync(CustomerId, OrderId, Dto())).Status);
        Assert.Equal(409, (await svc.CreateAsync(CustomerId, OrderId, Dto())).Status);
    }

    [Fact]
    public async Task Create_rejects_foreign_order()
    {
        var (_, svc, _) = await SeedAsync();
        Assert.Equal(403, (await svc.CreateAsync(OwnerId, OrderId, Dto())).Status);
    }

    // ── Satıcı cavabı ──

    [Fact]
    public async Task Store_accept_moves_to_accepted()
    {
        var (db, svc, notify) = await SeedAsync();
        await svc.CreateAsync(CustomerId, OrderId, Dto());
        var pid = (await db.Problems.SingleAsync()).Id;

        var r = await svc.StoreRespondAsync(OwnerId, StoreId, pid, new ProblemStoreRespondDto(true, "Qəbul edirik"));
        Assert.Equal(200, r.Status);
        Assert.Equal(ProblemStatus.StoreAccepted, (await db.Problems.SingleAsync()).Status);
        Assert.Contains(notify.Sent, n => n.userId == CustomerId && n.title.Contains("qəbul"));
    }

    [Fact]
    public async Task Store_reject_requires_note_and_escalates_to_arbitration()
    {
        var (db, svc, _) = await SeedAsync();
        await svc.CreateAsync(CustomerId, OrderId, Dto());
        var pid = (await db.Problems.SingleAsync()).Id;

        Assert.Equal(400, (await svc.StoreRespondAsync(OwnerId, StoreId, pid, new ProblemStoreRespondDto(false, ""))).Status);
        Assert.Equal(200, (await svc.StoreRespondAsync(OwnerId, StoreId, pid, new ProblemStoreRespondDto(false, "Mal qüsursuz göndərilib"))).Status);
        Assert.Equal(ProblemStatus.Arbitration, (await db.Problems.SingleAsync()).Status);
    }

    [Fact]
    public async Task Store_respond_rejects_non_owner()
    {
        var (db, svc, _) = await SeedAsync();
        await svc.CreateAsync(CustomerId, OrderId, Dto());
        var pid = (await db.Problems.SingleAsync()).Id;
        Assert.Equal(403, (await svc.StoreRespondAsync(CustomerId, StoreId, pid, new ProblemStoreRespondDto(true, ""))).Status);
    }

    // ── Admin qərarı ──

    [Fact]
    public async Task Admin_return_requires_cost_payer_then_starts_return()
    {
        var (db, svc, _) = await SeedAsync();
        await svc.CreateAsync(CustomerId, OrderId, Dto());
        var pid = (await db.Problems.SingleAsync()).Id;
        await svc.StoreRespondAsync(OwnerId, StoreId, pid, new ProblemStoreRespondDto(true, "ok"));

        Assert.Equal(400, (await svc.AdminDecideAsync(AdminId, pid, new ProblemDecideDto("return", null, null))).Status);

        var r = await svc.AdminDecideAsync(AdminId, pid, new ProblemDecideDto("return", "Qüsur təsdiqləndi", ReturnCostPayer.Store));
        Assert.Equal(200, r.Status);
        var p = await db.Problems.SingleAsync();
        Assert.Equal(ProblemStatus.ReturnInProgress, p.Status);
        Assert.True(p.ReturnRequired);
        Assert.Equal(ReturnCostPayer.Store, p.ReturnCostPayer);
    }

    [Fact]
    public async Task Store_received_auto_refunds_order()
    {
        var (db, svc, notify) = await SeedAsync();
        await svc.CreateAsync(CustomerId, OrderId, Dto());
        var pid = (await db.Problems.SingleAsync()).Id;
        await svc.StoreRespondAsync(OwnerId, StoreId, pid, new ProblemStoreRespondDto(true, "ok"));
        await svc.AdminDecideAsync(AdminId, pid, new ProblemDecideDto("return", null, ReturnCostPayer.Customer));

        var r = await svc.StoreReceivedAsync(OwnerId, StoreId, pid);
        Assert.Equal(200, r.Status);
        Assert.Equal(ProblemStatus.Refunded, (await db.Problems.SingleAsync()).Status);
        Assert.Equal(PaymentStatus.Refunded, (await db.Orders.SingleAsync()).PaymentStatus);
        Assert.Contains(notify.Sent, n => n.userId == CustomerId && n.title.Contains("geri qaytarıldı"));
    }

    [Fact]
    public async Task Admin_direct_refund_closes_problem()
    {
        var (db, svc, _) = await SeedAsync();
        await svc.CreateAsync(CustomerId, OrderId, Dto());
        var pid = (await db.Problems.SingleAsync()).Id;

        var r = await svc.AdminDecideAsync(AdminId, pid, new ProblemDecideDto("refund", "kiçik məbləğ", null));
        Assert.Equal(200, r.Status);
        Assert.Equal(ProblemStatus.Refunded, (await db.Problems.SingleAsync()).Status);
        Assert.Equal(PaymentStatus.Refunded, (await db.Orders.SingleAsync()).PaymentStatus);
        // Terminal problemə ikinci qərar olmaz.
        Assert.Equal(409, (await svc.AdminDecideAsync(AdminId, pid, new ProblemDecideDto("reject", null, null))).Status);
    }

    [Fact]
    public async Task Admin_reject_closes_without_refund()
    {
        var (db, svc, _) = await SeedAsync();
        await svc.CreateAsync(CustomerId, OrderId, Dto());
        var pid = (await db.Problems.SingleAsync()).Id;

        Assert.Equal(200, (await svc.AdminDecideAsync(AdminId, pid, new ProblemDecideDto("reject", "əsassız", null))).Status);
        Assert.Equal(ProblemStatus.Rejected, (await db.Problems.SingleAsync()).Status);
        Assert.NotEqual(PaymentStatus.Refunded, (await db.Orders.SingleAsync()).PaymentStatus);
    }

    // ── Eskalasiya + müştəri imtinası ──

    [Fact]
    public async Task Escalate_moves_overdue_to_arbitration()
    {
        var (db, svc, notify) = await SeedAsync();
        await svc.CreateAsync(CustomerId, OrderId, Dto());
        var p = await db.Problems.SingleAsync();
        p.StoreDeadline = DateTime.UtcNow.AddHours(-1);
        await db.SaveChangesAsync();

        Assert.Equal(1, await svc.EscalateOverdueAsync());
        Assert.Equal(ProblemStatus.Arbitration, (await db.Problems.SingleAsync()).Status);
        Assert.Contains(notify.Sent, n => n.userId == AdminId && n.title.Contains("48 saat"));
        // İkinci sweep heç nə etmir.
        Assert.Equal(0, await svc.EscalateOverdueAsync());
    }

    [Fact]
    public async Task Customer_cancel_closes_problem()
    {
        var (db, svc, _) = await SeedAsync();
        await svc.CreateAsync(CustomerId, OrderId, Dto());
        var pid = (await db.Problems.SingleAsync()).Id;

        Assert.Equal(200, (await svc.CancelAsync(CustomerId, pid)).Status);
        Assert.Equal(ProblemStatus.Cancelled, (await db.Problems.SingleAsync()).Status);
        // Bağlanandan sonra yenidən problem açmaq olar (aktiv yoxdur).
        Assert.Equal(201, (await svc.CreateAsync(CustomerId, OrderId, Dto())).Status);
    }

    [Fact]
    public async Task Timeline_events_visible_in_detail()
    {
        var (db, svc, _) = await SeedAsync();
        await svc.CreateAsync(CustomerId, OrderId, Dto());
        var pid = (await db.Problems.SingleAsync()).Id;
        await svc.StoreRespondAsync(OwnerId, StoreId, pid, new ProblemStoreRespondDto(true, "ok"));
        await svc.AdminDecideAsync(AdminId, pid, new ProblemDecideDto("return", null, ReturnCostPayer.Store));

        var r = await svc.GetAsync(CustomerId, pid);
        Assert.Equal(200, r.Status);
        var view = Assert.IsType<ProblemView>(r.Data);
        Assert.NotNull(view.Events);
        Assert.Equal(3, view.Events!.Count);  // açıldı → satıcı qəbul → qaytarma başladı
        Assert.Equal(ProblemStatus.AwaitingStore, view.Events[0].Status);
    }
}
