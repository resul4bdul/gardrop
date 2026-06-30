using System.Text.Json;

namespace Gardrop.Core.Application.Services;

/// <summary>Gələn sifariş sətri — checkout DTO-sundan (JSON) oxunan tipli forma.</summary>
public sealed record OrderLineItem(int Id, int Qty, decimal Price, string Name, string SelectedSize, string Store = "");

/// <summary>
/// Checkout-dan gələn item massivini (frontend JSON: {id,name,store,price,qty,selectedSize})
/// tipli forma oxuyur + relyasion <see cref="OrderItem"/> sətirlərini view JSON formasına geri yığır.
/// (2.2 — saxlanc relyasion OrderItem cədvəlinə köçdü; bu yalnız sərhəd çevirməsidir.)
/// Korlanmış JSON üçün <see cref="JsonException"/> atır (çağıran loglayır — bax menfiler 5.1).
/// </summary>
public static class OrderItemsJson
{
    public static IReadOnlyList<OrderLineItem> Parse(string itemsJson) =>
        Parse(JsonSerializer.Deserialize<JsonElement>(itemsJson));

    public static IReadOnlyList<OrderLineItem> Parse(JsonElement arr)
    {
        if (arr.ValueKind != JsonValueKind.Array) return Array.Empty<OrderLineItem>();
        var list = new List<OrderLineItem>();
        foreach (var it in arr.EnumerateArray())
        {
            if (it.ValueKind != JsonValueKind.Object) continue;
            int id = ReadInt(it, "id") ?? ReadInt(it, "productId") ?? 0;
            int qty = it.TryGetProperty("qty", out var q) && q.TryGetInt32(out var qq) ? Math.Max(1, qq) : 1;
            decimal price = it.TryGetProperty("price", out var p) && p.ValueKind == JsonValueKind.Number ? p.GetDecimal() : 0m;
            string name = ReadStr(it, "name");
            string size = ReadStr(it, "selectedSize");
            string store = ReadStr(it, "store");
            list.Add(new OrderLineItem(id, qty, price, name, size, store));
        }
        return list;
    }

    /// <summary>Relyasion sətirləri → frontend gözlədiyi item massivi (wire forması dəyişmir).</summary>
    public static JsonElement ToElement(IEnumerable<OrderItem> items) =>
        JsonSerializer.SerializeToElement(items.Select(i => new
        {
            id = i.ProductId,
            name = i.Name,
            store = i.Store,
            price = i.Price,
            qty = i.Qty,
            selectedSize = i.SelectedSize,
        }));

    private static string ReadStr(JsonElement el, string prop) =>
        el.TryGetProperty(prop, out var v) && v.ValueKind == JsonValueKind.String ? v.GetString() ?? "" : "";

    private static int? ReadInt(JsonElement el, string prop)
    {
        if (!el.TryGetProperty(prop, out var v)) return null;
        if (v.ValueKind == JsonValueKind.Number && v.TryGetInt32(out var n)) return n;
        if (v.ValueKind == JsonValueKind.String && int.TryParse(v.GetString(), out var n2)) return n2;
        return null;
    }
}
