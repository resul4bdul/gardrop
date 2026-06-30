namespace Gardrop.Core.Domain.Common;

/// <summary>
/// Məntiqi (soft) silinmə: sətir fiziki silinmir, <see cref="IsDeleted"/>=true qoyulur.
/// <c>AppDbContext</c> Delete əməliyyatını avtomatik soft-delete-ə çevirir və qlobal sorğu
/// filtri ilə silinmiş sətirləri nəticələrdən gizlədir (lazım olsa <c>IgnoreQueryFilters()</c>).
/// </summary>
public interface ISoftDeletable
{
    bool IsDeleted { get; set; }
    DateTime? DeletedAt { get; set; }
}
