using Gardrop.Core.Application.Common;

namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>Profil əməliyyatları (ad/ölçülər/şifrə) — biznes məntiqi Application qatında (menfiler D1/D2).</summary>
public interface IProfileService
{
    Task<OpResult> UpdateAsync(long userId, ProfileDto dto, CancellationToken ct = default);
    Task<OpResult> UpdateMeasurementsAsync(long userId, MeasurementsDto dto, CancellationToken ct = default);
    Task<OpResult> SetPasswordAsync(long userId, SetPasswordDto dto, CancellationToken ct = default);
}
