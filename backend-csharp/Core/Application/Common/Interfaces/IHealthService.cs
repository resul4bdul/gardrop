using Gardrop.Core.Application.Common.DTOs;

namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>Sağlamlıq yoxlaması — DB əlçatanlığı + əsas sayğaclar (bax menfiler D1/D2).</summary>
public interface IHealthService
{
    Task<HealthSnapshot> SnapshotAsync(CancellationToken ct = default);
}
