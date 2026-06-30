using Gardrop.Core.Application.Common.DTOs;
using Gardrop.Core.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Core.Application.Services;

/// <summary>Sağlamlıq yoxlaması — EF implementasiyası (Scoped).</summary>
public class HealthService : IHealthService
{
    private readonly IAppDbContext _db;
    public HealthService(IAppDbContext db) => _db = db;

    public async Task<HealthSnapshot> SnapshotAsync(CancellationToken ct = default) => new(
        Ok: true,
        Users: await _db.Users.CountAsync(ct),
        Orders: await _db.Orders.CountAsync(ct),
        Ts: DateTime.UtcNow);
}
