namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>Məhsul/mağaza reytinqlərini real datadan yenidən hesablayır.</summary>
public interface IRatingService
{
    Task RecomputeAsync(CancellationToken ct = default);
}
