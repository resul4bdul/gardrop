namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>Sayt məzmunu (CMS) key-value anbarı — admin paneldən idarə olunur (bax menfiler D1/D2).</summary>
public interface ISiteContentService
{
    /// <summary>Bütün məzmun bloklarını açar→JSON kimi qaytarır (public oxuma üçün).</summary>
    Task<Dictionary<string, string>> AllAsync(CancellationToken ct = default);

    /// <summary>Tək açarın JSON dəyəri (yoxdursa null).</summary>
    Task<string?> GetAsync(string key, CancellationToken ct = default);

    /// <summary>Açarı yaradır və ya yeniləyir (upsert).</summary>
    Task SetAsync(string key, string json, CancellationToken ct = default);
}
