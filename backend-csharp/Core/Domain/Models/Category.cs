namespace Gardrop.Core.Domain.Models;

/// <summary>Alt-kateqoriya düyünü — 2-ci səviyyə ad + onun 3-cü səviyyə alt-alt-kateqoriyaları.</summary>
public class SubcategoryNode
{
    public string Name { get; set; } = "";
    public List<string> Children { get; set; } = new();
}

public class Category
{
    public string Name { get; set; } = "";

    // Count artıq statik saxlanılmır — kataloq endpointlərində məhsul sayından dinamik hesablanır.
    public int Count { get; set; }

    // Geriyə-uyğunluq üçün düz (flat) 2-ci səviyyə adların siyahısı (məhsul alt-kateqoriya seçimi bundan istifadə edir).
    public List<string> Subcategories { get; set; } = new();

    // 3-səviyyəli ağac: hər alt-kateqoriyanın öz alt-alt-kateqoriyaları.
    public List<SubcategoryNode> Tree { get; set; } = new();
}
