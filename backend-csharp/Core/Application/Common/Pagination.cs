namespace Gardrop.Core.Application.Common;

/// <summary>
/// Səhifələmə köməkçisi (bax menfiler 4.3). Opt-in: page/pageSize verilməyibsə (null/≤0)
/// sorğu olduğu kimi qalır (köhnə davranış — frontend müqaviləsi pozulmur); verilibsə
/// Skip/Take tətbiq olunur. pageSize MaxPageSize ilə məhdudlaşır (DoS qarşısı).
/// </summary>
public static class Pagination
{
    public const int MaxPageSize = 100;

    /// <summary>page 1-əsaslıdır. page/pageSize yoxdursa sorğu dəyişməz qaytarılır.</summary>
    public static IQueryable<T> Page<T>(this IQueryable<T> query, int? page, int? pageSize)
    {
        if (page is not { } p || pageSize is not { } s || p < 1 || s < 1) return query;
        s = Math.Min(s, MaxPageSize);
        return query.Skip((p - 1) * s).Take(s);
    }
}
