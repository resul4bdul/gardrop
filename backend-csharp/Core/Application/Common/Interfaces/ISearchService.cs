namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>
/// Tam-mətn axtarış abstraksiyası. İndi PostgreSQL pg_trgm (DB-daxili) işləyir;
/// miqyas böyüdükdə Elasticsearch/Meilisearch implementasiyası ilə əvəzlənə bilər.
/// </summary>
public interface ISearchService
{
    Task<IReadOnlyList<int>> SearchProductIdsAsync(string query, int limit = 50, CancellationToken ct = default);
}
