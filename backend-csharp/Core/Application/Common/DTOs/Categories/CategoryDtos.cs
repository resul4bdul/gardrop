namespace Gardrop.Core.Application.Common.DTOs;

// Tree = 3-səviyyəli ağac (alt-kateqoriya → alt-alt-kateqoriyalar).
public record SubcategoryNodeDto(string? Name, List<string>? Children);
public record AdminCategoryDto(string? Name, int? Count, List<string>? Subcategories, List<SubcategoryNodeDto>? Tree);
