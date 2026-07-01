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

    public static async Task SeedAsync(AppDbContext db)
    {
        await MigrateAsync(db);

        if (!await db.Stores.AnyAsync())
            db.Stores.AddRange(CatalogSeed.Stores());

        if (!await db.Categories.AnyAsync())
            db.Categories.AddRange(CatalogSeed.Categories());

        if (!await db.Products.AnyAsync())
            db.Products.AddRange(CatalogSeed.Products());

        if (!await db.Reviews.AnyAsync())
            db.Reviews.AddRange(CatalogSeed.Reviews());

        if (!await db.Coupons.AnyAsync())
            db.Coupons.AddRange(CatalogSeed.Coupons());

        // Komissiya dərəcələri — hər mağaza üçün default 10% (idempotent; yalnız heç yoxdursa).
        if (!await db.StoreCommissions.AnyAsync())
            foreach (var st in CatalogSeed.Stores())
                db.StoreCommissions.Add(new Gardrop.Core.Domain.Models.StoreCommission { StoreId = st.Id, Category = "", Percent = 10m });

        // Mövcud (köhnə) mağaza sətirlərində koordinat boşdursa seed dəyərləri ilə doldur.
        var seedStores = CatalogSeed.Stores().ToDictionary(s => s.Id);
        foreach (var s in await db.Stores.Where(s => s.Lat == null).ToListAsync())
            if (seedStores.TryGetValue(s.Id, out var seed))
            {
                s.Lat = seed.Lat; s.Lng = seed.Lng;
                if (string.IsNullOrEmpty(s.Address)) s.Address = seed.Address;
            }

        var demo = await db.Users.FirstOrDefaultAsync(u => u.Email == DemoEmail);
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

        await db.SaveChangesAsync();

        // Seed explicit Id-lər yazır (Stores 1..7, Products 1..N), amma Id artıq DB identity-dir
        // (bax menfiler 2.3). Identity sequence-i seed-dən sonra max(Id)-ə sinxronlaşdır ki,
        // növbəti avtomatik insert toqquşmasın. Yalnız PostgreSQL.
        if (db.Database.IsNpgsql())
            await SyncIdentitySequencesAsync(db);
    }

    /// <summary>
    /// Explicit Id-li seed-dən sonra identity sequence-ləri max(Id)-ə çəkir (Products/Stores).
    /// setval(seq, max, is_called): cədvəl boşdursa is_called=false → növbəti = 1; doludursa
    /// is_called=true → növbəti = max+1. pg_get_serial_sequence identity sütunları üçün də işləyir.
    /// </summary>
    private static async Task SyncIdentitySequencesAsync(AppDbContext db)
    {
        // Table adları SABİT literal-dır (istifadəçi girişi yox) — SQL injection riski yoxdur.
#pragma warning disable EF1002
        foreach (var table in new[] { "catalog.\"Products\"", "catalog.\"Stores\"" })
            await db.Database.ExecuteSqlRawAsync($"""
                SELECT setval(
                    pg_get_serial_sequence('{table}', 'Id'),
                    GREATEST(COALESCE((SELECT MAX("Id") FROM {table}), 0), 1),
                    (SELECT COUNT(*) FROM {table}) > 0);
                """);
#pragma warning restore EF1002
    }

    /// <summary>
    /// Sxemanı EF Core Migrations ilə tətbiq edir (əvvəlki EnsureCreated + əl-ilə ALTER əvəzinə).
    /// Köhnə bazalar (EnsureCreated ilə yaradılıb, migration tarixçəsi yoxdur) baseline edilir
    /// ki, Migrate mövcud sxemanı yenidən yaratmağa çalışmasın.
    /// </summary>
    private static async Task MigrateAsync(AppDbContext db)
    {
        // Relyasion olmayan provider (məs. test InMemory) migration tətbiq edə bilmir → sadəcə sxema yarat.
        if (!db.Database.IsRelational())
        {
            await db.Database.EnsureCreatedAsync();
            return;
        }
        // Baseline yoxlaması yalnız MÖVCUD baza üçün (köhnə EnsureCreated, tarixçəsiz).
        // Baza yoxdursa probe sorğusu 3D000 atardı → MigrateAsync onsuz da yaradıb tətbiq edir.
        if (await db.Database.CanConnectAsync())
        {
            var applied = await db.Database.GetAppliedMigrationsAsync();
            if (!applied.Any() && await LegacySchemaExistsAsync(db))
                await BaselineAsync(db);
        }
        await db.Database.MigrateAsync();
    }

    // users."Users" varsa, baza köhnə EnsureCreated ilə yaradılıb (tarixçəsiz) → baseline lazımdır.
    private static async Task<bool> LegacySchemaExistsAsync(AppDbContext db) =>
        await db.Database.SqlQueryRaw<bool>(
            """SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'users' AND table_name = 'Users') AS "Value" """)
            .FirstAsync();

    // Mövcud sxemanı bütün migrationlar "tətbiq olunmuş" kimi qeyd et (heç nə yenidən yaratmadan).
    private static async Task BaselineAsync(AppDbContext db)
    {
        await db.Database.ExecuteSqlRawAsync(
            """
            CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
                "MigrationId" character varying(150) NOT NULL,
                "ProductVersion" character varying(32) NOT NULL,
                CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
            );
            """);
        foreach (var id in db.Database.GetMigrations())
            await db.Database.ExecuteSqlRawAsync(
                """INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion") VALUES ({0}, {1}) ON CONFLICT ("MigrationId") DO NOTHING""",
                id, "10.0.0");
    }
}
