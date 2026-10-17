using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Gardrop.Core.Application.Common.Interfaces;
using Gardrop.Core.Domain.Models;
using Gardrop.Infrastructure.Persistance.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;

namespace Gardrop.Tests;

/// <summary>
/// Controller/HTTP boru xətti smoke testləri (bax menfiler 5.4): auth/policy, routing,
/// model-binding + {error} formatı, public yol. DB InMemory ilə əvəzlənir; xarici
/// asılılıqlar (SMTP/Google) sınanmır (yalnız yola düşmür endpoint-lər vurulur).
/// </summary>
public class ControllerSmokeTests : IClassFixture<ControllerSmokeTests.Factory>
{
    private readonly Factory _factory;
    public ControllerSmokeTests(Factory factory) => _factory = factory;

    public sealed class Factory : WebApplicationFactory<Program>
    {
        protected override IHost CreateHost(IHostBuilder builder)
        {
            // Options validasiyasını (Jwt/Smtp ValidateOnStart) + connection string yoxlamasını
            // ödəmək üçün test konfiqurasiyası.
            builder.ConfigureHostConfiguration(cfg => cfg.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:Default"] = "Host=test;Database=test;Username=test;Password=test",
                ["Jwt:Secret"] = "test-secret-key-at-least-32-characters-long!!",
                ["Jwt:Issuer"] = "gardrop",
                ["Jwt:Audience"] = "gardrop",
                ["Smtp:Host"] = "smtp.test",
                ["Smtp:Port"] = "587",
                ["Smtp:User"] = "test",
                ["Smtp:Password"] = "test",
                ["Smtp:FromEmail"] = "test@example.com",
                ["Smtp:AppBaseUrl"] = "http://localhost",
            }));
            return base.CreateHost(builder);
        }

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Production");  // Scalar/OpenAPI dev-only ötürülsün
            builder.ConfigureServices(services =>
            {
                // Npgsql DbContext qeydiyyatını (options + provider konfiqurasiyası) tam çıxar,
                // sonra InMemory əlavə et — yoxsa "iki provider" xətası.
                foreach (var d in services.Where(d =>
                             d.ServiceType.FullName?.Contains("DbContextOptions") == true ||
                             d.ServiceType == typeof(AppDbContext)).ToList())
                    services.Remove(d);
                services.AddDbContext<AppDbContext>(o => o
                    .UseInMemoryDatabase("smoke")
                    .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning)));
            });
        }
    }

    [Fact]
    public async Task Health_live_returns_200()
    {
        var res = await _factory.CreateClient().GetAsync("/health/live");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
    }

    [Fact]
    public async Task Public_products_list_returns_200()
    {
        var res = await _factory.CreateClient().GetAsync("/api/products");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
    }

    [Fact]
    public async Task Admin_endpoint_without_token_is_401()
    {
        var res = await _factory.CreateClient().GetAsync("/api/admin/users");
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task Orders_endpoint_without_token_is_401()
    {
        var res = await _factory.CreateClient().GetAsync("/api/orders");
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task Admin_endpoint_with_non_admin_token_is_403()
    {
        // Etibarlı JWT (real ITokenService ilə imzalanır), amma isAdmin=false → Admin siyasəti 403.
        using var scope = _factory.Services.CreateScope();
        var jwt = scope.ServiceProvider.GetRequiredService<ITokenService>();
        var token = jwt.Sign(new User { Id = 1, Email = "user@example.com", FirstName = "U", LastName = "S", IsAdmin = false });

        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var res = await client.GetAsync("/api/admin/users");
        Assert.Equal(HttpStatusCode.Forbidden, res.StatusCode);
    }

    [Fact]
    public async Task Register_invalid_body_returns_400_with_error_key()
    {
        var res = await _factory.CreateClient().PostAsJsonAsync("/api/auth/register", new { email = "bad" });
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<Dictionary<string, object>>();
        Assert.NotNull(body);
        Assert.True(body!.ContainsKey("error"));   // {error} formatı qorunur (menfiler B5)
    }

    [Fact]
    public async Task Unknown_api_route_returns_404()
    {
        var res = await _factory.CreateClient().GetAsync("/api/does-not-exist");
        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
    }
}
