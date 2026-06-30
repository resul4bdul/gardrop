namespace Gardrop.Core.Domain.Models;

/// <summary>
/// Sayt məzmununun açar-dəyər anbarı (CMS). Admin paneldən idarə olunan sərbəst JSON bloklar:
///   home_hero        → əsas səhifə slider slaydları (massiv)
///   category_images  → kateqoriya adı → şəkil URL (obyekt)
///   legal_docs       → hüquqi sənədlərin mətnləri (privacy/terms/cookies/delivery/returns)
/// Sxem dəyişmədən yeni açarlar əlavə etmək olur — ona görə ayrıca sütun/cədvəl yox, key-value.
/// </summary>
public class SiteContent
{
    public string Key { get; set; } = "";
    public string Json { get; set; } = "";   // sərbəst JSON mətni (UTF-8)
    public DateTime UpdatedAt { get; set; }
}
