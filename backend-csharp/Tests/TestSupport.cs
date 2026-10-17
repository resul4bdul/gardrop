using Gardrop.Core.Application.Common.Exceptions;
using Gardrop.Core.Application.Common.Interfaces;
using Gardrop.Core.Domain.Models;
using Gardrop.Infrastructure.Persistance.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace Gardrop.Tests;

/// <summary>
/// Servis-səviyyə testlər üçün köməkçilər: hər test üçün təcrid olunmuş EF InMemory
/// AppDbContext + sadə test ikiqatları (no-op notification/rating queue).
/// InMemory relational annotasiyaları (computed column, gin indeks, schema) görməzdən gəlir.
/// </summary>
internal static class TestDb
{
    public static AppDbContext New()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            // InMemory transaction-ları icra etmir; OrderService BeginTransactionAsync çağırır —
            // testdə xəbərdarlığı söndürürük (atomiklik real DB ilə inteqrasiya testində yoxlanılır).
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        return new AppDbContext(options);
    }
}

/// <summary>Bildirişləri yığan test ikiqatı.</summary>
internal sealed class FakeNotificationService : INotificationService
{
    public List<(long userId, string type, string title, string body)> Sent { get; } = new();
    public void Notify(long userId, string type, string title, string body) => Sent.Add((userId, type, title, body));
    public Task<(int Unread, List<Notification> Items)> ListAsync(long userId, CancellationToken ct = default)
        => Task.FromResult((0, new List<Notification>()));
    public Task MarkAllReadAsync(long userId, CancellationToken ct = default) => Task.CompletedTask;
    public Task<bool> MarkReadAsync(long userId, long id, CancellationToken ct = default) => Task.FromResult(false);
}

/// <summary>Reytinq sorğularını sayan no-op queue (fon hesablama testdə işlədilmir).</summary>
internal sealed class FakeRatingQueue : IRatingRecomputeQueue
{
    public int Requests { get; private set; }
    public void Request() => Requests++;
}

// ── Auth test ikiqatları (5.4: AuthService üçün fake email/jwt/hash/google) ──

/// <summary>Deterministik token imzalayan fake (user.Id-ə bağlı).</summary>
internal sealed class FakeTokenService : ITokenService
{
    public string Sign(User user) => $"token-{user.Id}";
}

/// <summary>Email göndərmələrini yığan fake; Throw=true olduqda EmailSendException atır.</summary>
internal sealed class FakeEmailSender : IEmailSender
{
    public bool Throw { get; set; }
    public List<(string To, string Kind, string Value)> Sent { get; } = new();
    private Task Record(string to, string kind, string val)
    {
        if (Throw) throw new EmailSendException("SMTP əlçatmazdır");
        Sent.Add((to, kind, val));
        return Task.CompletedTask;
    }
    public Task SendVerifyAsync(string to, string code) => Record(to, "verify", code);
    public Task SendOtpAsync(string to, string code) => Record(to, "otp", code);
    public Task SendResetAsync(string to, string token) => Record(to, "reset", token);
    public Task SendAsync(string to, string subject, string htmlBody) => Record(to, "generic", subject);
}

/// <summary>In-memory kod/token saxlayan fake (real hash/TTL əvəzinə).</summary>
internal sealed class FakeEmailCodeService : IEmailCodeService
{
    public const string Code = "123456";
    private readonly Dictionary<string, string> _codes = new();   // "email|purpose" → code
    private readonly Dictionary<string, (string Email, string Purpose)> _tokens = new();

    public Task<string> NewCodeAsync(string email, string purpose, TimeSpan ttl)
    { _codes[$"{email}|{purpose}"] = Code; return Task.FromResult(Code); }

    public Task<string> NewTokenAsync(string email, string purpose, TimeSpan ttl)
    { var t = Guid.NewGuid().ToString("N"); _tokens[t] = (email, purpose); return Task.FromResult(t); }

    public Task<bool> VerifyCodeAsync(string email, string purpose, string code)
        => Task.FromResult(_codes.TryGetValue($"{email}|{purpose}", out var c) && c == code);

    public Task<string?> ConsumeTokenAsync(string purpose, string token)
    {
        if (_tokens.TryGetValue(token, out var v) && v.Purpose == purpose) { _tokens.Remove(token); return Task.FromResult<string?>(v.Email); }
        return Task.FromResult<string?>(null);
    }
}

/// <summary>Aşkar (təhlükəsiz olmayan) hash fake — yalnız test üçün.</summary>
internal sealed class FakePasswordHasher : IPasswordHasher
{
    public string Hash(string password) => "hash:" + password;
    public bool Verify(string password, string hash) => hash == "hash:" + password;
}

/// <summary>COD davranışlı ödəniş fake (intent Gözləyir; webhook idarə olunmur). Bax A.1.</summary>
internal sealed class FakePaymentService : IPaymentService
{
    public string Provider => "cod";
    public bool IsOnline => false;
    public Task<PaymentIntentResult> CreateIntentAsync(Order order, CancellationToken ct = default)
        => Task.FromResult(new PaymentIntentResult(Provider, Gardrop.Core.Domain.Enums.PaymentStatus.Pending));
    public Task<PaymentWebhookResult> HandleWebhookAsync(string payload, IReadOnlyDictionary<string, string> headers, CancellationToken ct = default)
        => Task.FromResult(new PaymentWebhookResult(false));
}

/// <summary>Konfiqurasiya/payload-u test idarə edən Google validator fake.</summary>
internal sealed class FakeGoogleAuthValidator : IGoogleAuthValidator
{
    public bool IsConfigured { get; set; } = true;
    public GoogleUserInfo? Payload { get; set; }
    public Task<GoogleUserInfo?> ValidateAsync(string credential, CancellationToken ct = default) => Task.FromResult(Payload);
}
