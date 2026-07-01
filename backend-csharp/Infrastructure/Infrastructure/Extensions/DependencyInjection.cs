using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Options;

namespace Gardrop.Infrastructure;

/// <summary>
/// Infrastructure layer DI qeydiyyatı (tet üslubu). Presentation yalnız bu iki
/// genişləndirməni çağırır — DB sürücüsü (Npgsql) və servis implementasiyaları
/// burada qapsanır, ona görə Presentation EF/Npgsql paketlərini birbaşa tanımır.
/// </summary>
public static class DependencyInjection
{
    /// <summary>Persistence: AppDbContext (PostgreSQL / Npgsql, split-query).</summary>
    public static IServiceCollection AddGardropPersistence(this IServiceCollection services, IConfiguration config)
    {
        var connStr = config.GetConnectionString("Default")
            ?? throw new InvalidOperationException("ConnectionStrings:Default konfiqurasiya olunmayıb.");
        services.AddDbContext<AppDbContext>(opt => opt
            .UseNpgsql(connStr, npg => npg.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery))
            // Soft-delete query filter (User) ilə məcburi naviqasiyalar (Address/CartItem/Favorite/
            // Order — Tier-C hard-delete) arasındakı qarşılıqlı təsir QƏSDƏN qəbul olunur.
            .ConfigureWarnings(w => w.Ignore(
                CoreEventId.PossibleIncorrectRequiredNavigationWithQueryFilterInteractionWarning)));

        // Biznes servisləri konkret AppDbContext-ə deyil, IAppDbContext abstraksiyasına bağlanır
        // (eyni scoped instansı təqdim olunur) — bax menfiler 1.1 / 1.5.
        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());
        return services;
    }

    /// <summary>
    /// Infrastructure servisləri: JWT, Email (SMTP) və process-daxili abstraksiyalar.
    /// Obyekt anbarı production-da dəyişir: IStorageService → MinIO/S3.
    /// </summary>
    public static IServiceCollection AddGardropInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        // Cari HTTP kontekstinə (istifadəçi claim-ləri) servis qatından çıxış üçün.
        services.AddHttpContextAccessor();

        // JWT — bind + startup-da DataAnnotations validasiyası (boş/qısa Secret-lə açılmasın).
        services.AddOptions<JwtOptions>().Bind(config.GetSection("Jwt"))
            .ValidateDataAnnotations().ValidateOnStart();
        services.AddSingleton<ITokenService, JwtTokenService>();

        // Email (SMTP) — bind + validasiya.
        services.AddOptions<SmtpOptions>().Bind(config.GetSection("Smtp"))
            .ValidateDataAnnotations().ValidateOnStart();
        services.AddSingleton<IEmailSender, EmailSender>();
        services.AddSingleton<DevCodeCapture>();   // boş qalır; yalnız Development-də CapturingEmailSender doldurur (C.1)
        services.AddScoped<IEmailCodeService, EmailAuthService>();

        // Google OAuth — Jwt/Smtp kimi IOptions ilə (controller/servisdə birbaşa IConfiguration yox).
        services.AddOptions<GoogleOptions>().Bind(config.GetSection("Google"));
        services.AddScoped<IGoogleAuthValidator, GoogleAuthValidator>();

        // Şifrə hash-ləmə (BCrypt) — Application qatı abstraksiya arxasında işlədir.
        services.AddSingleton<IPasswordHasher, BcryptPasswordHasher>();

        // Giriş validasiyası (DataAnnotations) — servis-sərhədi yoxlaması (bax menfiler 3.4).
        // Stateless → Singleton.
        services.AddSingleton<Gardrop.Core.Application.Common.Validation.IValidationService,
            Gardrop.Core.Application.Common.Validation.DataAnnotationsValidationService>();

        // ── Sağlamlıq yoxlamaları (readiness: DB probe; liveness: yoxlamasız) ──
        services.AddHealthChecks()
            .AddCheck<Gardrop.Infrastructure.HealthChecks.DbHealthCheck>(
                "database", tags: new[] { "ready" });

        // ── Arxa-plan işləri (Hosted Services) ──
        // Reytinq worker: ilkin hesablama + coalesce edilmiş debounce recompute (bax menfiler 4.4).
        // Tək instans həm IRatingRecomputeQueue (mutasiyalar Request() çağırır), həm HostedService.
        services.AddSingleton<RatingRecomputeService>();
        services.AddSingleton<IRatingRecomputeQueue>(sp => sp.GetRequiredService<RatingRecomputeService>());
        services.AddHostedService(sp => sp.GetRequiredService<RatingRecomputeService>());
        services.AddHostedService<ExpiredCodeCleanupService>(); // vaxtı keçmiş OTP təmizliyi (saatlıq)
        services.AddHostedService<ExpressAutoCancelService>();  // ekspress 30dq auto-cancel + reytinq cəzası

        // Process-daxili defolt implementasiyalar
        services.AddMemoryCache();

        // Obyekt anbarı: Storage:Provider env-ə görə Local (disk) və ya S3/MinIO (bax A.2).
        services.AddOptions<StorageOptions>().Bind(config.GetSection("Storage"));
        var storageProvider = config["Storage:Provider"] ?? "Local";
        if (string.Equals(storageProvider, "S3", StringComparison.OrdinalIgnoreCase))
        {
            services.AddSingleton<Amazon.S3.IAmazonS3>(sp =>
            {
                var o = sp.GetRequiredService<IOptions<StorageOptions>>().Value.S3;
                var s3cfg = new Amazon.S3.AmazonS3Config { ForcePathStyle = o.ForcePathStyle };
                if (!string.IsNullOrWhiteSpace(o.ServiceUrl)) s3cfg.ServiceURL = o.ServiceUrl;
                else s3cfg.RegionEndpoint = Amazon.RegionEndpoint.GetBySystemName(o.Region);
                return new Amazon.S3.AmazonS3Client(o.AccessKey, o.SecretKey, s3cfg);
            });
            services.AddSingleton<IStorageService, S3StorageService>();
        }
        else
        {
            services.AddSingleton<IStorageService, LocalStorageService>();
        }

        // ── Domain/Application servisləri (onion: Core interfeysi ← Infrastructure impl) ──
        // DbContext-dən asılı olanlar Scoped; saf (stateless) məntiq Singleton.
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<IFavoriteService, FavoriteService>();
        services.AddScoped<IAddressService, AddressService>();
        services.AddScoped<ICartService, CartService>();
        services.AddScoped<IStoreCatalogService, StoreCatalogService>();
        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<ISiteContentService, SiteContentService>();
        services.AddScoped<ICommissionService, CommissionService>();
        services.AddScoped<IStorePayoutService, StorePayoutService>();
        services.AddScoped<IActivityLogService, ActivityLogService>();
        services.AddScoped<IDisputeService, DisputeService>();
        services.AddScoped<ISizeService, SizeService>();
        services.AddScoped<IProfileService, ProfileService>();
        services.AddScoped<IReviewService, ReviewService>();
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<ICheckoutService, CheckoutService>();
        services.AddScoped<IHealthService, HealthService>();
        services.AddScoped<IAuthService, AuthService>();
        // Satıcı paneli SRP üzrə bölünmüş servislər (bax menfiler 3.1).
        services.AddScoped<IStoreProfileService, StoreProfileService>();
        services.AddScoped<IStoreOwnerProductService, StoreOwnerProductService>();
        services.AddScoped<IStoreOwnerOrderService, StoreOwnerOrderService>();
        services.AddScoped<IStoreOwnerReviewService, StoreOwnerReviewService>();
        // Admin paneli SRP üzrə bölünmüş servislər (bax menfiler 3.1).
        services.AddScoped<IAdminUserService, AdminUserService>();
        services.AddScoped<IAdminCatalogService, AdminCatalogService>();
        services.AddScoped<IAdminOrderService, AdminOrderService>();
        services.AddScoped<IAdminAnalyticsService, AdminAnalyticsService>();
        services.AddScoped<IAdminReviewService, AdminReviewService>();
        services.AddScoped<IProductCatalogService, ProductCatalogService>();
        services.AddScoped<IRatingService, RatingEngine>();
        services.AddScoped<IOrderStatusService, OrderOps>();

        // Ödəniş şlüzü (bax A.1): Payment:Provider env-ə görə. Default COD (qapıda nağd);
        // onlayn provayder (Stripe/PayPal) qoşulanda yalnız bu switch dəyişir.
        services.AddOptions<PaymentOptions>().Bind(config.GetSection("Payment"));
        services.AddHttpClient();   // onlayn şlüz REST çağırışları üçün
        var paymentProvider = config["Payment:Provider"] ?? "cod";
        switch (paymentProvider.ToLowerInvariant())
        {
            // YERLİ BANK gateway buraya qoşulur (Azericard/Kapital/Pasha...):
            //   case "azericard": services.AddScoped<IPaymentService, AzericardPaymentService>(); break;
            // StripePaymentService REFERANS impl-dir (redirect + HMAC webhook nümunəsi) — qoşulmayıb:
            //   case "stripe": services.AddScoped<IPaymentService, StripePaymentService>(); break;
            default: services.AddScoped<IPaymentService, CodPaymentService>(); break;
        }
        services.AddScoped<IPaymentWebhookService, PaymentWebhookService>();
        services.AddSingleton<IProductWriter, ProductWriter>();
        services.AddSingleton<IDeliveryService, DeliveryEngine>();
        services.AddSingleton<ICouponService, CouponEngine>();
        // Ölçü mühərriki — provider seam + Strategy pattern (bax Sizing/). Static data → singleton.
        services.AddSingleton<ISizeChartProvider, StaticSizeChartProvider>();
        services.AddSingleton<IBrandBehaviorProvider, StaticBrandBehaviorProvider>();
        services.AddSingleton<ISizeRecommenderStrategy, ShoeSizeStrategy>();
        services.AddSingleton<ISizeRecommenderStrategy, CustomChartSizeStrategy>();
        services.AddSingleton<ISizeRecommenderStrategy, ClothingSizeStrategy>();
        services.AddSingleton<ISizeRecommender, SizeEngine>();

        return services;
    }
}
