using System.Linq.Expressions;
using System.Text.Json;
using Gardrop.Core.Application.Common.Helpers;
using Gardrop.Core.Domain.Common;
using Gardrop.Core.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Gardrop.Infrastructure.Persistance.Data;

public class AppDbContext : DbContext, IAppDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Address> Addresses => Set<Address>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<Favorite> Favorites => Set<Favorite>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Store> Stores => Set<Store>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Coupon> Coupons => Set<Coupon>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<EmailCode> EmailCodes => Set<EmailCode>();
    public DbSet<SiteContent> SiteContents => Set<SiteContent>();
    public DbSet<StoreCommission> StoreCommissions => Set<StoreCommission>();
    public DbSet<StorePayout> StorePayouts => Set<StorePayout>();
    public DbSet<Dispute> Disputes => Set<Dispute>();
    public DbSet<Problem> Problems => Set<Problem>();
    public DbSet<ProblemEvent> ProblemEvents => Set<ProblemEvent>();
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        // pg_trgm — qeyri-dəqiq (fuzzy) axtarış üçün trigram dəstəyi
        b.HasPostgresExtension("pg_trgm");

        // ── PostgreSQL schema bölgüsü (modul sərhədlərini DB səviyyəsində əks etdirir) ──
        // Sabah microservice-ə ayrılarkən hər servis öz schema-sını götürəcək.
        b.Entity<EmailCode>().ToTable("EmailCodes", "auth");

        b.Entity<User>().ToTable("Users", "users");
        b.Entity<Address>().ToTable("Addresses", "users");
        b.Entity<CartItem>().ToTable("CartItems", "users");
        b.Entity<Favorite>().ToTable("Favorites", "users");
        b.Entity<Notification>().ToTable("Notifications", "users");

        b.Entity<Product>().ToTable("Products", "catalog");
        b.Entity<Store>().ToTable("Stores", "catalog");
        b.Entity<Category>().ToTable("Categories", "catalog");
        b.Entity<SiteContent>(e => { e.ToTable("SiteContents", "catalog"); e.HasKey(c => c.Key); e.Property(c => c.Key).HasMaxLength(64); });
        b.Entity<StoreCommission>(e => { e.ToTable("StoreCommissions", "catalog"); e.Property(c => c.Percent).HasPrecision(5, 2); e.Property(c => c.Category).HasMaxLength(100); e.HasIndex(c => new { c.StoreId, c.Category }).IsUnique(); });
        b.Entity<StorePayout>(e => { e.ToTable("StorePayouts", "catalog"); e.Property(p => p.Amount).HasPrecision(18, 2); e.Property(p => p.Status).HasMaxLength(20); e.Property(p => p.Method).HasMaxLength(120); e.Property(p => p.Reference).HasMaxLength(120); e.HasIndex(p => p.StoreId); });
        b.Entity<Dispute>(e => { e.ToTable("Disputes", "orders"); e.Property(d => d.Status).HasMaxLength(20); e.Property(d => d.OrderNo).HasMaxLength(40); e.HasIndex(d => d.Status); e.HasIndex(d => d.OrderId); });
        b.Entity<ActivityLog>(e => { e.ToTable("ActivityLogs", "users"); e.Property(a => a.Action).HasMaxLength(40); e.Property(a => a.EntityType).HasMaxLength(20); e.Property(a => a.EntityId).HasMaxLength(40); e.Property(a => a.ActorName).HasMaxLength(120); e.HasIndex(a => a.CreatedAt); });

        b.Entity<Order>().ToTable("Orders", "orders");
        b.Entity<OrderItem>().ToTable("OrderItems", "orders");
        b.Entity<Coupon>().ToTable("Coupons", "orders");

        b.Entity<Review>().ToTable("Reviews", "reviews");

        // List<string> ⇄ JSON string converter (sizes, subcategories)
        var listConverter = new ValueConverter<List<string>, string>(
            v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
            v => string.IsNullOrEmpty(v)
                ? new List<string>()
                : JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>());

        var listComparer = new ValueComparer<List<string>>(
            (a, c) => (a ?? new()).SequenceEqual(c ?? new()),
            v => v == null ? 0 : v.Aggregate(0, (acc, s) => HashCode.Combine(acc, s.GetHashCode())),
            v => v == null ? new() : v.ToList());

        // List<int> ⇄ JSON (sifarişdə hazırlanmış mağaza id-ləri — bax menfiler 2.2)
        var intListConverter = new ValueConverter<List<int>, string>(
            v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
            v => string.IsNullOrEmpty(v)
                ? new List<int>()
                : JsonSerializer.Deserialize<List<int>>(v, (JsonSerializerOptions?)null) ?? new List<int>());
        var intListComparer = new ValueComparer<List<int>>(
            (a, c) => (a ?? new()).SequenceEqual(c ?? new()),
            v => v == null ? 0 : v.Aggregate(0, (acc, i) => HashCode.Combine(acc, i)),
            v => v == null ? new() : v.ToList());

        // Dictionary<string,int> ⇄ JSON (ölçü → stok)
        var dictConverter = new ValueConverter<Dictionary<string, int>, string>(
            v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
            v => string.IsNullOrEmpty(v)
                ? new Dictionary<string, int>()
                : JsonSerializer.Deserialize<Dictionary<string, int>>(v, (JsonSerializerOptions?)null) ?? new Dictionary<string, int>());
        var dictComparer = new ValueComparer<Dictionary<string, int>>(
            (a, c) => (a ?? new()).Count == (c ?? new()).Count && !(a ?? new()).Except(c ?? new()).Any(),
            v => v == null ? 0 : v.Aggregate(0, (acc, kv) => HashCode.Combine(acc, kv.Key.GetHashCode(), kv.Value)),
            v => v == null ? new() : new Dictionary<string, int>(v));

        // List<SubcategoryNode> ⇄ JSON (3-səviyyəli kateqoriya ağacı)
        var treeConverter = new ValueConverter<List<SubcategoryNode>, string>(
            v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
            v => string.IsNullOrEmpty(v)
                ? new List<SubcategoryNode>()
                : JsonSerializer.Deserialize<List<SubcategoryNode>>(v, (JsonSerializerOptions?)null) ?? new List<SubcategoryNode>());
        var treeComparer = new ValueComparer<List<SubcategoryNode>>(
            (a, c) => JsonSerializer.Serialize(a, (JsonSerializerOptions?)null) == JsonSerializer.Serialize(c, (JsonSerializerOptions?)null),
            v => v == null ? 0 : JsonSerializer.Serialize(v, (JsonSerializerOptions?)null).GetHashCode(),
            v => v == null ? new() : JsonSerializer.Deserialize<List<SubcategoryNode>>(JsonSerializer.Serialize(v, (JsonSerializerOptions?)null), (JsonSerializerOptions?)null) ?? new());

        // List<SizeChartRow> ⇄ JSON (mağazanın öz ölçü cədvəli: boy/çəki aralığı → ölçü)
        var chartConverter = new ValueConverter<List<SizeChartRow>, string>(
            v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
            v => string.IsNullOrEmpty(v)
                ? new List<SizeChartRow>()
                : JsonSerializer.Deserialize<List<SizeChartRow>>(v, (JsonSerializerOptions?)null) ?? new List<SizeChartRow>());
        var chartComparer = new ValueComparer<List<SizeChartRow>>(
            (a, c) => JsonSerializer.Serialize(a, (JsonSerializerOptions?)null) == JsonSerializer.Serialize(c, (JsonSerializerOptions?)null),
            v => v == null ? 0 : JsonSerializer.Serialize(v, (JsonSerializerOptions?)null).GetHashCode(),
            v => v == null ? new() : JsonSerializer.Deserialize<List<SizeChartRow>>(JsonSerializer.Serialize(v, (JsonSerializerOptions?)null), (JsonSerializerOptions?)null) ?? new());

        // List<ProductVariant> ⇄ JSON (variant matrisi: ölçü × rəng → SKU + stok)
        var variantConverter = new ValueConverter<List<ProductVariant>, string>(
            v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
            v => string.IsNullOrEmpty(v)
                ? new List<ProductVariant>()
                : JsonSerializer.Deserialize<List<ProductVariant>>(v, (JsonSerializerOptions?)null) ?? new List<ProductVariant>());
        var variantComparer = new ValueComparer<List<ProductVariant>>(
            (a, c) => JsonSerializer.Serialize(a, (JsonSerializerOptions?)null) == JsonSerializer.Serialize(c, (JsonSerializerOptions?)null),
            v => v == null ? 0 : JsonSerializer.Serialize(v, (JsonSerializerOptions?)null).GetHashCode(),
            v => v == null ? new() : JsonSerializer.Deserialize<List<ProductVariant>>(JsonSerializer.Serialize(v, (JsonSerializerOptions?)null), (JsonSerializerOptions?)null) ?? new());

        b.Entity<User>(e =>
        {
            e.Property(u => u.Email).HasMaxLength(190);
            // Gender? → AZ wire/DB string (Male→"Kişi"...); ingilis enum, AZ DB dəyəri (bax menfiler 3.5/3.6).
            // Sütun adı [Column("Cins")] ilə User-də təyin olunub.
            e.Property(u => u.Gender).HasConversion(
                v => CatalogEnumParsing.GenderToWire(v),
                v => CatalogEnumParsing.ParseGenderOrNull(v)).HasMaxLength(20);
            // Soft-delete olunmuş email yenidən qeydiyyatı bloklamasın → filtrlənmiş unikal indeks.
            e.HasIndex(u => u.Email).IsUnique().HasFilter("\"IsDeleted\" = false");
        });

        b.Entity<Product>(e =>
        {
            // Id DB identity (GENERATED BY DEFAULT AS IDENTITY) — manual MaxAsync+1 yarış şəraiti
            // aradan qalxdı (bax menfiler 2.3). Seed explicit Id verir; sequence boot-da DbSeeder-də
            // setval ilə sinxronlaşdırılır.
            // Enum-lar DB-də string saxlanır (köhnə dəyərlərlə eyni; bax menfiler 3.5).
            e.Property(p => p.Gender).HasConversion(
                v => CatalogEnumParsing.GenderToWire(v),
                v => CatalogEnumParsing.ParseGender(v)).HasMaxLength(20);
            e.Property(p => p.ApprovalStatus).HasConversion<string>().HasMaxLength(20);
            // SEO slug — filtrlənmiş unikal indeks (boş slug-ları və soft-delete-ləri istisna).
            e.Property(p => p.Slug).HasMaxLength(220);
            e.HasIndex(p => p.Slug).IsUnique().HasFilter("\"Slug\" <> '' AND \"IsDeleted\" = false");
            e.Property(p => p.Sizes).HasConversion(listConverter).Metadata.SetValueComparer(listComparer);
            e.Property(p => p.Tags).HasConversion(listConverter).Metadata.SetValueComparer(listComparer);
            e.Property(p => p.ImageUrls).HasConversion(listConverter).Metadata.SetValueComparer(listComparer);
            e.Property(p => p.SizeStock).HasConversion(dictConverter).Metadata.SetValueComparer(dictComparer);
            e.Property(p => p.SizeChart).HasConversion(chartConverter).Metadata.SetValueComparer(chartComparer);
            e.Property(p => p.Variants).HasConversion(variantConverter).Metadata.SetValueComparer(variantComparer);
            // Normallaşdırılmış axtarış blobu — STORED generated sütun (diakritikləri ASCII-yə folding edir).
            // Folding alfaviti TextNormalizer-dən gəlir (tək mənbə — C# ilə eyni qayda, bax menfiler C4).
            e.Property(p => p.SearchBlob).HasComputedColumnSql(
                $"lower(translate(coalesce(\"Name\",'') || ' ' || coalesce(\"Store\",'') || ' ' || coalesce(\"Category\",'') || ' ' || coalesce(\"Color\",''), '{TextNormalizer.FoldFrom}', '{TextNormalizer.FoldTo}'))",
                stored: true);
            // GIN trigram indeks — ILIKE + word_similarity axtarışını sürətləndirir
            e.HasIndex(p => p.SearchBlob).HasMethod("gin").HasOperators("gin_trgm_ops");
        });

        // Store.Id də DB identity (bax menfiler 2.3) — ValueGeneratedNever götürüldü.

        // Review şəkilləri List<string> ⇄ JSON
        b.Entity<Review>(e =>
            e.Property(r => r.ImageUrls).HasConversion(listConverter).Metadata.SetValueComparer(listComparer));

        // Problem (geri qaytarma/şikayət — Trendyol modeli) + timeline hadisələri
        b.Entity<Problem>(e =>
        {
            e.ToTable("Problems", "orders");
            e.Property(p => p.OrderNo).HasMaxLength(40);
            e.Property(p => p.Reason).HasMaxLength(40);
            e.Property(p => p.Status).HasMaxLength(40);
            e.Property(p => p.ReturnCostPayer).HasMaxLength(20);
            e.Property(p => p.Photos).HasConversion(listConverter).Metadata.SetValueComparer(listComparer);
            e.HasIndex(p => p.Status);
            e.HasIndex(p => p.OrderId);
            e.HasIndex(p => p.StoreId);
            e.HasIndex(p => p.UserId);
        });
        b.Entity<ProblemEvent>(e =>
        {
            e.ToTable("ProblemEvents", "orders");
            e.Property(x => x.Status).HasMaxLength(40);
            e.Property(x => x.ActorRole).HasMaxLength(20);
            e.HasIndex(x => x.ProblemId);
        });

        b.Entity<Coupon>(e =>
        {
            e.Property(c => c.Code).HasMaxLength(40);
            e.Property(c => c.Type).HasConversion<string>().HasMaxLength(20);  // enum → string (bax menfiler 3.5)
            // Soft-delete olunmuş kupon kodu yeni kuponu bloklamasın → filtrlənmiş unikal indeks.
            e.HasIndex(c => c.Code).IsUnique().HasFilter("\"IsDeleted\" = false");
        });

        b.Entity<Category>(e =>
        {
            e.Property(c => c.Name).HasMaxLength(100);
            e.HasKey(c => c.Name);
            e.Property(c => c.Subcategories).HasConversion(listConverter).Metadata.SetValueComparer(listComparer);
            e.Property(c => c.Tree).HasConversion(treeConverter).Metadata.SetValueComparer(treeComparer);
        });

        b.Entity<User>()
            .HasMany(u => u.Addresses).WithOne(a => a.User!).HasForeignKey(a => a.UserId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<User>()
            .HasMany(u => u.CartItems).WithOne(c => c.User!).HasForeignKey(c => c.UserId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<User>()
            .HasMany(u => u.Favorites).WithOne(f => f.User!).HasForeignKey(f => f.UserId).OnDelete(DeleteBehavior.Cascade);
        b.Entity<User>()
            .HasMany(u => u.Orders).WithOne(o => o.User!).HasForeignKey(o => o.UserId).OnDelete(DeleteBehavior.Cascade);

        // ── Pul sahələri: numeric(18,2) (bax menfiler 2.1 — double→decimal) ──
        b.Entity<Product>(e =>
        {
            e.Property(p => p.Price).HasPrecision(18, 2);
            e.Property(p => p.OldPrice).HasPrecision(18, 2);
            e.Property(p => p.BuyPrice).HasPrecision(18, 2);
        });
        b.Entity<Order>(e =>
        {
            e.Property(o => o.Total).HasPrecision(18, 2);
            e.Property(o => o.DeliveryFee).HasPrecision(18, 2);
            e.Property(o => o.Discount).HasPrecision(18, 2);
            // Sifariş nömrəsi unikal (toqquşma qarşısı — bax menfiler 2.7).
            e.Property(o => o.OrderNo).HasMaxLength(20);
            e.HasIndex(o => o.OrderNo).IsUnique();
            // Sifariş sətirləri relyasion (bax menfiler 2.2); sifariş silinəndə kaskad.
            e.HasMany(o => o.Items).WithOne(i => i.Order!).HasForeignKey(i => i.OrderId).OnDelete(DeleteBehavior.Cascade);
            // Hazırlanmış mağaza id-ləri (bax menfiler 2.2) — List<int> ⇄ JSON.
            e.Property(o => o.PreparedStores).HasConversion(intListConverter).Metadata.SetValueComparer(intListComparer);
        });
        b.Entity<OrderItem>(e =>
        {
            e.Property(i => i.Price).HasPrecision(18, 2);
            e.HasIndex(i => i.OrderId);
            e.HasIndex(i => i.ProductId);  // analitika aqreqasiyası üçün (bax menfiler 4.1)
        });
        b.Entity<Coupon>(e =>
        {
            e.Property(c => c.Value).HasPrecision(18, 2);
            e.Property(c => c.MinOrder).HasPrecision(18, 2);
        });

        // ── Optimistik konkurensiya (oversell + kupon TOCTOU qarşısı, bax menfiler 2.4) ──
        // PostgreSQL sistem sütunu xmin concurrency token kimi istifadə olunur (əlavə sütun YARATMIR;
        // hər UPDATE-də avtomatik dəyişir). Eyni məhsulun/kuponun stokunu/sayğacını eyni anda iki
        // tranzaksiya dəyişərsə, ikinci SaveChanges DbUpdateConcurrencyException atır → səssiz
        // oversell əvəzinə əməliyyat dayanır (ExceptionHandlingMiddleware 409-a çevirir).
        // Yalnız Npgsql-də; InMemory provayder bu sistem sütununu dəstəkləmir → guard.
        // (Npgsql 10-da UseXminAsConcurrencyToken helper-i yoxdur — xmin sistem sütunu shadow
        //  property kimi token-ə map olunur: IsRowVersion = ValueGeneratedOnAddOrUpdate + IsConcurrencyToken.)
        if (Database.IsNpgsql())
        {
            foreach (var clr in new[] { typeof(Product), typeof(Coupon) })
                b.Entity(clr).Property<uint>("xmin")
                    .HasColumnName("xmin").HasColumnType("xid").IsRowVersion();
        }

        // Soft-delete: ISoftDeletable implement edən hər entity üçün qlobal sorğu filtri (IsDeleted=false).
        foreach (var et in b.Model.GetEntityTypes())
        {
            if (et.BaseType is not null || !typeof(ISoftDeletable).IsAssignableFrom(et.ClrType)) continue;
            var p = Expression.Parameter(et.ClrType, "e");
            var body = Expression.Not(Expression.Property(p, nameof(ISoftDeletable.IsDeleted)));
            b.Entity(et.ClrType).HasQueryFilter(Expression.Lambda(body, p));
        }

        base.OnModelCreating(b);
    }

    // ── Audit + soft-delete avtomatlaşdırması (SaveChanges-dən əvvəl tətbiq olunur) ──
    // ── Transaction abstraksiyası (IAppDbContext — bax menfiler 2.5) ──
    public async Task<IAppDbTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default)
        => new AppDbTransaction(await Database.BeginTransactionAsync(cancellationToken));

    private sealed class AppDbTransaction(Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction tx) : IAppDbTransaction
    {
        public Task CommitAsync(CancellationToken cancellationToken = default) => tx.CommitAsync(cancellationToken);
        public ValueTask DisposeAsync() => tx.DisposeAsync();
    }

    public override int SaveChanges() { ApplyAudit(); return base.SaveChanges(); }
    public override int SaveChanges(bool acceptAllChangesOnSuccess) { ApplyAudit(); return base.SaveChanges(acceptAllChangesOnSuccess); }
    public override Task<int> SaveChangesAsync(CancellationToken ct = default) { ApplyAudit(); return base.SaveChangesAsync(ct); }
    public override Task<int> SaveChangesAsync(bool acceptAllChangesOnSuccess, CancellationToken ct = default)
    { ApplyAudit(); return base.SaveChangesAsync(acceptAllChangesOnSuccess, ct); }

    private void ApplyAudit()
    {
        var now = DateTime.UtcNow;
        foreach (var entry in ChangeTracker.Entries())
        {
            // Delete → soft-delete (fiziki silmə yerinə işarələ)
            if (entry.State == EntityState.Deleted && entry.Entity is ISoftDeletable sd)
            {
                entry.State = EntityState.Modified;
                sd.IsDeleted = true;
                sd.DeletedAt = now;
            }

            if (entry.Entity is IAuditableEntity a)
            {
                if (entry.State == EntityState.Added && a.CreatedAt == default) a.CreatedAt = now;
                if (entry.State is EntityState.Modified) a.UpdatedAt = now;
            }
        }
    }
}
