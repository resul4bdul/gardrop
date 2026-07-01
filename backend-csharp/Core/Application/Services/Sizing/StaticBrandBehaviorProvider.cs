using Gardrop.Core.Application.Common.Interfaces;

namespace Gardrop.Core.Application.Services;

/// <summary>
/// Brend kəsim profilləri — kodda (əvvəlki BrandProfiles ilə eyni). Açar: normallaşdırılmış marka adı.
/// DB-driven-a keçid: brend→davranış sətirlərini DB-dən oxuyan impl yaz, DI-də əvəzlə.
/// </summary>
public sealed class StaticBrandBehaviorProvider : IBrandBehaviorProvider
{
    private static readonly Dictionary<string, string> Profiles = new()
    {
        // Inditex qrupu — adətən kiçik kəsilir
        ["zara"] = "RunsSmall", ["bershka"] = "RunsSmall", ["pullbear"] = "RunsSmall",
        ["stradivarius"] = "RunsSmall", ["massimodutti"] = "RunsSmall", ["oysho"] = "RunsSmall",
        // Digər fast-fashion
        ["mango"] = "RunsSmall", ["hm"] = "RunsSmall", ["asos"] = "RunsSmall",
        ["levis"] = "RunsSmall", ["pingo"] = "RunsSmall",
        // Türk markaları
        ["lcwaikiki"] = "Standard", ["lcw"] = "Standard", ["defacto"] = "Standard",
        ["mavi"] = "Standard", ["colins"] = "Standard", ["kigili"] = "Standard",
        ["koton"] = "RunsLarge", ["gap"] = "RunsLarge", ["uspoloassn"] = "RunsLarge",
        // İdman / digər
        ["nike"] = "Standard", ["adidas"] = "Standard", ["puma"] = "Standard",
    };

    public string GetBehavior(string? brand)
    {
        if (string.IsNullOrWhiteSpace(brand)) return "Standard";
        var key = new string(brand.ToLowerInvariant().Where(char.IsLetterOrDigit).ToArray());
        return Profiles.TryGetValue(key, out var b) ? b : "Standard";
    }
}
