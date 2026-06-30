namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>Public mağaza kataloqu (auth tələb etmir) — bax menfiler D1/D2.</summary>
public interface IStoreCatalogService
{
    Task<List<StoreView>> ListAsync(CancellationToken ct = default);
    Task<StoreView?> GetAsync(int id, CancellationToken ct = default);
}
