using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Gardrop.Infrastructure;

namespace Gardrop.Infrastructure.Hosted
{
    public class DbSeedHostedService : IHostedService
    {
        private readonly IServiceProvider _sp;
        private readonly ILogger<DbSeedHostedService> _logger;

        public DbSeedHostedService(IServiceProvider sp, ILogger<DbSeedHostedService> logger)
        {
            _sp = sp;
            _logger = logger;
        }

        public async Task StartAsync(CancellationToken cancellationToken)
        {
            try
            {
                using var scope = _sp.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                // Seed with cancellation support; DbSeeder.SeedAsync should accept CancellationToken if available.
                await DbSeeder.SeedAsync(db, cancellationToken);
                _logger.LogInformation("Database seeding completed (background hosted service).");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while running DB seeding in hosted service.");
            }
        }

        public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
    }
}
