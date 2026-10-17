using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.FileProviders;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.HttpOverrides;
using Gardrop.Infrastructure;
using Gardrop.Presentation.Auth;
using Gardrop.Infrastructure.Hosted;
using Scalar.AspNetCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// ── Strukturlu logging (Serilog) — konfiqurasiyadan oxunur (Serilog bölməsi), defolt console ──
builder.Host.UseSerilog((ctx, cfg) => cfg
    .ReadFrom.Configuration(ctx.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console());

// ── Infrastructure: persistence (PostgreSQL/Npgsql) + servislər (JWT/Email/Storage) ──
builder.Services.AddGardropPersistence(builder.Configuration);
builder.Services.AddGardropInfrastructure(builder.Configuration);

// Reuse HttpClientFactory for external HTTP calls (enables connection pooling)
builder.Services.AddHttpClient();

// Forwarded headers (when behind proxy) — ensure RateLimiter uses real client IP.
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;

    try
    {
        var t = options.GetType();
        foreach (var name in new[] { "KnownIPNetworks", "KnownIPAddresses" })
        {
            var prop = t.GetProperty(name);
            if (prop == null) continue;
            if (prop.GetValue(options) is System.Collections.IList lst)
                lst.Clear();
        }
    }
    catch
    {
        // ignore reflection errors
    }

    try { options.KnownIPNetworks.Clear(); } catch { }
    try { options.KnownProxies.Clear(); } catch { }
});

// Run DB seeding as a background hosted service to avoid blocking startup
builder.Services.AddHostedService<DbSeedHostedService>();

// ── Secrets fail-fast (production) — sirlər env-dən gəlməlidir; boşdursa açılışda dayan (heç vaxt zəif default ilə işləmə).
if (!builder.Environment.IsDevelopment())
{
    if (string.IsNullOrWhiteSpace(builder.Configuration.GetConnectionString("Default")))
        throw new InvalidOperationException("ConnectionStrings:Default production-da təyin edilməlidir (env: ConnectionStrings__Default).");
    var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "";
    if (jwtSecret.Length < 32)
        throw new InvalidOperationException("Jwt:Secret production-da ən azı 32 simvol olmalıdır (env: Jwt__Secret).");
}

// YALNIZ Development: göndərilən OTP/təsdiq kodunu yaddaşda tut (e2e dev-mail seam, bax C.1).
// IEmailSender real impl-i CapturingEmailSender ilə sarınır; prod-da bu qoşulmur.
if (builder.Environment.IsDevelopment())
    builder.Services.AddSingleton<Gardrop.Core.Application.Common.Interfaces.IEmailSender>(sp =>
        new Gardrop.Infrastructure.Services.CapturingEmailSender(
            Microsoft.Extensions.DependencyInjection.ActivatorUtilities.CreateInstance<Gardrop.Infrastructure.Services.EmailSender>(sp),
            sp.GetRequiredService<Gardrop.Infrastructure.Services.DevCodeCapture>()));

// ── Controllers + JSON (camelCase, enum-as-string) ──
builder.Services.AddControllers().AddJsonOptions(o =>
{
    o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

// ── Model validasiyası (E2): DataAnnotations DTO-larda → [ApiController] avtomatik 400.
// Defolt RFC7807 ProblemDetails ƏVƏZİNƏ frontend-in gözlədiyi { error } formatı qaytarılır
// (bax menfiler B5 / yaddaş gardrop-auth-flow — `error` açarı qorunur). İlk xəta mesajı seçilir.
builder.Services.Configure<Microsoft.AspNetCore.Mvc.ApiBehaviorOptions>(o =>
{
    o.InvalidModelStateResponseFactory = ctx =>
    {
        var msg = ctx.ModelState.Values
            .SelectMany(v => v.Errors)
            .Select(e => e.ErrorMessage)
            .FirstOrDefault(m => !string.IsNullOrWhiteSpace(m)) ?? "Yanlış sorğu";
        return new Microsoft.AspNetCore.Mvc.BadRequestObjectResult(new { error = msg });
    };
});

// ── API versiyalama (F3) — Asp.Versioning. QEYRİ-SINDIRICI: URL-segment İŞLƏNMİR,
// yəni mövcud /api/... route-ları olduğu kimi qalır (frontend toxunulmur). Versiya
// defolt v1.0-dır; müştəri istəsə ?api-version= və ya X-Api-Version header ilə seçə bilər.
// Cavaba api-supported-versions başlığı əlavə olunur. Gələcək v2 controller-ləri
// [ApiVersion("2.0")] + öz route-u ilə əlavə olunar.
builder.Services.AddApiVersioning(o =>
{
    o.DefaultApiVersion = new Asp.Versioning.ApiVersion(1, 0);
    o.AssumeDefaultVersionWhenUnspecified = true;   // versiyasız sorğu → v1.0
    o.ReportApiVersions = true;
    o.ApiVersionReader = Asp.Versioning.ApiVersionReader.Combine(
        new Asp.Versioning.QueryStringApiVersionReader("api-version"),
        new Asp.Versioning.HeaderApiVersionReader("X-Api-Version"));
}).AddApiExplorer(o =>
{
    o.GroupNameFormat = "'v'VVV";
    o.SubstituteApiVersionInUrl = false;   // URL-də versiya seqmenti yoxdur
});

// ── OpenAPI sənədi (/openapi/v1.json) + Scalar test UI (dev: /scalar) ──
builder.Services.AddOpenApi();

// ── CORS — origin-lər konfiqurasiyadan (Cors:Origins). Boşdursa YALNIZ dev üçün hər origin;
//    production-da boş origin = açılış xətası (fail fast, bax menfiler 5.2). ──
var corsOrigins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? Array.Empty<string>();
if (corsOrigins.Length == 0 && !builder.Environment.IsDevelopment())
    throw new InvalidOperationException(
        "Cors:Origins production-da boş ola bilməz (AllowAnyOrigin təhlükəlidir). Konfiqurasiyada təyin et.");
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
{
    if (corsOrigins.Length > 0) p.WithOrigins(corsOrigins).AllowAnyHeader().AllowAnyMethod();
    else p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
}));

// ── Rate limiting — "auth" siyasəti: OTP/login brute-force qarşısı (IP üzrə, 10/dəq) ──
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    static string Ip(HttpContext c)
    {
        var xf = c.Request.Headers["X-Forwarded-For"].FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(xf)) return xf.Split(',')[0].Trim();
        return c.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    }

    // Global (IP üzrə) — bütün sorğular üçün DoS/bot müdafiəsi (dəqiqədə 120).
    o.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(ctx =>
        RateLimitPartition.GetFixedWindowLimiter(Ip(ctx),
            _ => new FixedWindowRateLimiterOptions { Window = TimeSpan.FromMinutes(1), PermitLimit = 120, QueueLimit = 0 }));

    // "auth" — OTP/login brute-force qarşısı (IP üzrə, 10/dəq).
    o.AddPolicy("auth", ctx => RateLimitPartition.GetFixedWindowLimiter(Ip(ctx),
        _ => new FixedWindowRateLimiterOptions { Window = TimeSpan.FromMinutes(1), PermitLimit = 10, QueueLimit = 0 }));

    // "search" — kataloq/axtarış scraping qarşısı (IP üzrə, 40/dəq).
    o.AddPolicy("search", ctx => RateLimitPartition.GetFixedWindowLimiter(Ip(ctx),
        _ => new FixedWindowRateLimiterOptions { Window = TimeSpan.FromMinutes(1), PermitLimit = 40, QueueLimit = 0 }));

    // "coupon" — kupon kodu brute-force/enumeration qarşısı (IP üzrə, 8/dəq).
    o.AddPolicy("coupon", ctx => RateLimitPartition.GetFixedWindowLimiter(Ip(ctx),
        _ => new FixedWindowRateLimiterOptions { Window = TimeSpan.FromMinutes(1), PermitLimit = 8, QueueLimit = 0 }));
});

// ── JWT Authentication ──
// Parametrlər ConfigureJwtBearerOptions ilə IOptions<JwtOptions>-dan qurulur (tək mənbə).
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();
builder.Services.ConfigureOptions<ConfigureJwtBearerOptions>();
builder.Services.AddAuthorization(o =>
    o.AddPolicy("Admin", p => p.RequireClaim("isAdmin", "true")));

var app = builder.Build();

// Honor forwarded headers before other middleware so IPs and scheme are correct
app.UseForwardedHeaders();

// ── Apply DB migrations (non-blocking seed moved to hosted service) ──
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    // Apply pending migrations to ensure schema exists; this is quick compared to heavy seeding.
    await db.Database.MigrateAsync();
}

// ── Vahid istisna emalı (ən xarici middleware) ──
app.UseExceptionHandling();

// ── Strukturlu request logging (status + müddət; health səs-küyü Verbose-a endirilir) ──
app.UseSerilogRequestLogging(opts =>
    opts.GetLevel = (ctx, _, ex) =>
        ex != null ? Serilog.Events.LogEventLevel.Error
        : ctx.Request.Path.StartsWithSegments("/health") || ctx.Request.Path.StartsWithSegments("/api/health")
            ? Serilog.Events.LogEventLevel.Verbose
            : Serilog.Events.LogEventLevel.Information);

// ── HTTPS/HSTS yalnız production-da (dev http://localhost:3001 işləyir) ──
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

// ── OpenAPI sənədi + Scalar UI (yalnız development) ──
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(); // /scalar
}

app.MapControllers();

// ── Sağlamlıq yoxlamaları: liveness (proses ayaqdadır) + readiness (DB probe) ──
app.MapHealthChecks("/health/live", new() { Predicate = _ => false });
app.MapHealthChecks("/health/ready", new() { Predicate = hc => hc.Tags.Contains("ready") });

// ── Yüklənmiş şəkilləri statik ver (/uploads) ──
// Frontend ayrıca React app-dır (bax ../frontend); backend yalnız API + upload verir.
var uploadsDir = Gardrop.Infrastructure.Services.UploadsPath.Resolve(builder.Configuration, builder.Environment.ContentRootPath);
Directory.CreateDirectory(uploadsDir);
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsDir),
    RequestPath = "/uploads",
    OnPrepareResponse = ctx =>
    {
        // Encourage caching on CDN / reverse proxy. Ensure invalidation on upload.
        ctx.Context.Response.Headers["Cache-Control"] = "public,max-age=31536000";
    }
});

// ── Naməlum /api üçün 404 (fallback — ən aşağı presedens) ──
app.MapFallback("/api/{**rest}", () => Results.NotFound(new { error = "Endpoint tapılmadı" }));

app.Logger.LogInformation("\n  🚀  Gardrop API çalışır\n  📦  API: http://localhost:3001/api\n  🖼️  Uploads: http://localhost:3001/uploads\n  🌐  Frontend (dev): http://localhost:5173\n");

app.Run();

// WebApplicationFactory smoke testləri üçün giriş nöqtəsini görünən edir (bax menfiler 5.4).
public partial class Program { }
