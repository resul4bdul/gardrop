using Gardrop.Core.Application.Common.Helpers;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Infrastructure.Persistance.Data;

/// <summary>
/// Sxemanı EF Core Migrations ilə tətbiq edir və seed datanı doldurur.
/// İdempotentdir — yalnız boş cədvəlləri doldurur, hər başlanğıcda təkrarlamır.
/// </summary>
public static class DbSeeder
{
    public const string DemoEmail = "resul4bdul@gmail.com";
    public const string DemoPassword = "123456";

    public static async Task SeedAsync(AppDbContext db, CancellationToken ct = default)
    {
        await MigrateAsync(db, ct);

        if (!await db.Stores.AnyAsync(ct))
            db.Stores.AddRange(CatalogSeed.Stores());

        if (!await db.Categories.AnyAsync(ct))
            db.Categories.AddRange(CatalogSeed.Categories());

        if (!await db.Products.AnyAsync(ct))
            db.Products.AddRange(CatalogSeed.Products());

        if (!await db.Reviews.AnyAsync(ct))
            db.Reviews.AddRange(CatalogSeed.Reviews());

        if (!await db.Coupons.AnyAsync(ct))
            db.Coupons.AddRange(CatalogSeed.Coupons());

        // Komissiya dərəcələri — hər mağaza üçün default 10% (idempotent; yalnız heç yoxdursa).
        if (!await db.StoreCommissions.AnyAsync(ct))
            foreach (var st in CatalogSeed.Stores())
                db.StoreCommissions.Add(new Gardrop.Core.Domain.Models.StoreCommission { StoreId = st.Id, Category = "", Percent = 10m });

        // Mövcud (köhnə) mağaza sətirlərində koordinat boşdursa seed dəyərləri ilə doldur.
        var seedStores = CatalogSeed.Stores().ToDictionary(s => s.Id);
        foreach (var s in await db.Stores.Where(s => s.Lat == null).ToListAsync(ct))
            if (seedStores.TryGetValue(s.Id, out var seed))
            {
                s.Lat = seed.Lat; s.Lng = seed.Lng;
                if (string.IsNullOrEmpty(s.Address)) s.Address = seed.Address;
            }

        var demo = await db.Users.FirstOrDefaultAsync(u => u.Email == DemoEmail, ct);
        if (demo is null)
        {
            db.Users.Add(new User
            {
                FirstName = "Rasul",
                LastName = "Abdul",
                Email = DemoEmail,
                Phone = "+994 50 123 45 67",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(DemoPassword, 12),
                CreatedAt = DateTime.UtcNow,
                IsAdmin = true,  // demo hesab admin paneli üçün
                EmailVerified = true,
            });
        }
        else if (!demo.IsAdmin)
        {
            demo.IsAdmin = true;  // mövcud demo hesabı admin et
        }

        await db.SaveChangesAsync(ct);

        // ── SEO slug backfill: slug-u boş məhsullara addan unikal slug ver (mövcud/köhnə data) ──
        await BackfillProductSlugsAsync(db, ct);

        // Seed explicit Id-lər yazır (Stores 1..7, Products 1..N), amma Id artıq DB identity-dir
        // (bax menfiler 2.3). Identity sequence-i seed-dən sonra max(Id)-ə sinxronlaşdır ki,
        // növbəti avtomatik insert toqquşmasın. Yalnız PostgreSQL.
        if (db.Database.IsNpgsql())
            await SyncIdentitySequencesAsync(db, ct);
    }

    /// <summary>
    /// Slug-u boş məhsullara addan unikal SEO slug təyin edir (bir dəfə; idempotent).
    /// Toqquşmada -2, -3 … əlavə olunur (həm DB-də, həm bu batch daxilində).
    /// </summary>
    private static async Task BackfillProductSlugsAsync(AppDbContext db, CancellationToken ct = default)
    {
        var missing = await db.Products.Where(p => p.Slug == "").OrderBy(p => p.Id).ToListAsync(ct);
        if (missing.Count == 0) return;

        // Mövcud slug-ları yığ (batch daxilində toqquşma qarşısı).
        var used = new HashSet<string>(await db.Products.Where(p => p.Slug != "").Select(p => p.Slug).ToListAsync(ct));
        foreach (var p in missing)
        {
            var baseSlug = SlugHelper.Generate(p.Name);
            if (baseSlug.Length == 0) baseSlug = "mehsul";
            var slug = baseSlug;
            var i = 2;
            while (!used.Add(slug)) slug = $"{baseSlug}-{i++}";
            p.Slug = slug;
        }
        await db.SaveChangesAsync(ct);
    }

    /// <summary>
    /// Explicit Id-li seed-dən sonra identity sequence-ləri max(Id)-ə çəkir (Products/Stores).
    /// setval(seq, max, is_called): cədvəl boşdursa is_called=false → növbəti = 1; doludursa
    /// is_called=true → növbəti = max+1. pg_get_serial_sequence identity sütunları üçün də işləyir.
    /// </summary>
    private static async Task SyncIdentitySequencesAsync(AppDbContext db, CancellationToken ct = default)
    {
        // Table adları SABİT literal-dır (istifadəçi girişi yox) — SQL injection riski yoxdur.
#pragma warning disable EF1002
        foreach (var table in new[] { "catalog.\"Products\"", "catalog.\"Stores\"" })
            await db.Database.ExecuteSqlRawAsync($"""
                SELECT setval(
                    pg_get_serial_sequence('{table}', 'Id'),
                    GREATEST(COALESCE((SELECT MAX("Id") FROM {table}), 0), 1),
                    (SELECT COUNT(*) FROM {table}) > 0);
                """, ct);
#pragma warning restore EF1002
    }

    /// <summary>
    /// Sxemanı EF Core Migrations ilə tətbiq edir (əvvəlki EnsureCreated + əl-ilə ALTER əvəzinə).
    /// Köhnə bazalar (EnsureCreated ilə yaradılıb, migration tarixçəsi yoxdur) baseline edilir
    /// ki, Migrate mövcud sxemanı yenidən yaratmağa çalışmasın.
    /// </summary>
    private static async Task MigrateAsync(AppDbContext db, CancellationToken ct = default)
    {
        // Relyasion olmayan provider (məs. test InMemory) migration tətbiq edə bilmir → sadəcə sxema yarat.
        if (!db.Database.IsRelational())
        {
            await db.Database.EnsureCreatedAsync(ct);
            return;
        }
        // Baseline yoxlaması yalnız MÖVCUD baza üçün (köhnə EnsureCreated, tarixçəsiz).
        // Baza yoxdursa probe sorğusu 3D000 atardı → MigrateAsync onsuz da yaradıb tətbiq edir.
        if (await db.Database.CanConnectAsync(ct))
        {
            var applied = await db.Database.GetAppliedMigrationsAsync();
            if (!applied.Any() && await LegacySchemaExistsAsync(db, ct))
                await BaselineAsync(db, ct);
        }
        await db.Database.MigrateAsync(ct);
    }

    // users."Users" varsa, baza köhnə EnsureCreated ilə yaradılıb (tarixçəsiz) → baseline lazımdır.
    private static async Task<bool> LegacySchemaExistsAsync(AppDbContext db, CancellationToken ct = default) =>
        await db.Database.SqlQueryRaw<bool>(
            """SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'users' AND table_name = 'Users') AS "Value" """)
            .FirstAsync(ct);

    // Mövcud sxemanı bütün migrationlar "tətbiq olunmuş" kimi qeyd et (heç nə yenidən yaratmadan).
    private static async Task BaselineAsync(AppDbContext db, CancellationToken ct = default)
    {
        await db.Database.ExecuteSqlRawAsync(
            """
            CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
                "MigrationId" character varying(150) NOT NULL,
                "ProductVersion" character varying(32) NOT NULL,
                CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
            );
            """, ct);
        foreach (var id in db.Database.GetMigrations())
            await db.Database.ExecuteSqlRawAsync(
                """INSERT INTO ""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"") VALUES ({0}, {1}) ON CONFLICT (""MigrationId"") DO NOTHING""",
                id, "10.0.0", ct);
    }
}
