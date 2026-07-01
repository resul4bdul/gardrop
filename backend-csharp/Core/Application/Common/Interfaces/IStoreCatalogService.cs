namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>Public mağaza kataloqu (auth tələb etmir) — bax menfiler D1/D2.</summary>
public interface IStoreCatalogService
{
    Task<List<StoreView>> ListAsync(CancellationToken ct = default);
    Task<StoreView?> GetAsync(int id, CancellationToken ct = default);
    /// <summary>SEO slug (Store.Url) ilə mağaza profili (/store/{slug}). Tapılmazsa null.</summary>
    Task<StoreView?> GetByUrlAsync(string url, CancellationToken ct = default);
}
