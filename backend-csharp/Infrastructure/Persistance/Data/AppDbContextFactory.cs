using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Gardrop.Infrastructure.Persistance.Data;

/// <summary>
/// Design-time (dotnet ef migrations/database) üçün AppDbContext fabriki — Program.cs host-undan asılı deyil.
/// Migration generasiyası üçün connstr əhəmiyyətsizdir (DB-yə qoşulmur), AMMA `database drop/update`
/// real DB-yə qoşulur → connstr ConnectionStrings__Default env-dən oxunur (fallback: lokal placeholder).
/// </summary>
public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var connStr = Environment.GetEnvironmentVariable("ConnectionStrings__Default")
            ?? "Host=localhost;Database=gardrop;Username=postgres;Password=postgres";
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(connStr)
            .Options;
        return new AppDbContext(options);
    }
}
