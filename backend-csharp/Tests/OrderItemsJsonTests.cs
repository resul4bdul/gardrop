using System.Text.Json;
using Gardrop.Core.Application.Services;
using Gardrop.Core.Domain.Models;

namespace Gardrop.Tests;

// Checkout item parseri + relyasion → wire JSON çevirməsi (bax menfiler 2.2/3.2).
public class OrderItemsJsonTests
{
    [Fact]
    public void Parses_fields_id_qty_price_name_size_store()
    {
        var json = """[{"id":7,"qty":3,"price":19.90,"name":"Köynək","selectedSize":"M","store":"BakuWear"}]""";
        var items = OrderItemsJson.Parse(json);
        var li = Assert.Single(items);
        Assert.Equal(7, li.Id);
        Assert.Equal(3, li.Qty);
        Assert.Equal(19.90m, li.Price);
        Assert.Equal("Köynək", li.Name);
        Assert.Equal("M", li.SelectedSize);
        Assert.Equal("BakuWear", li.Store);
    }

    [Fact]
    public void ToElement_preserves_frontend_wire_shape()
    {
        // OrderItem → view JSON: frontend {id,name,store,price,qty,selectedSize} oxuyur (dəyişməməlidir).
        var el = OrderItemsJson.ToElement(new[]
        {
            new OrderItem { ProductId = 5, Name = "Köynək", Store = "BakuWear", Price = 19.90m, Qty = 2, SelectedSize = "L" },
        });
        var it = el.EnumerateArray().Single();
        Assert.Equal(5, it.GetProperty("id").GetInt32());
        Assert.Equal("Köynək", it.GetProperty("name").GetString());
        Assert.Equal("BakuWear", it.GetProperty("store").GetString());
        Assert.Equal(19.90m, it.GetProperty("price").GetDecimal());
        Assert.Equal(2, it.GetProperty("qty").GetInt32());
        Assert.Equal("L", it.GetProperty("selectedSize").GetString());
    }

    [Fact]
    public void Missing_qty_defaults_to_one_and_clamps_min()
    {
        Assert.Equal(1, OrderItemsJson.Parse("""[{"id":1}]""")[0].Qty);
        Assert.Equal(1, OrderItemsJson.Parse("""[{"id":1,"qty":0}]""")[0].Qty);
    }

    [Fact]
    public void Falls_back_to_productId_when_id_absent()
    {
        Assert.Equal(42, OrderItemsJson.Parse("""[{"productId":42}]""")[0].Id);
    }

    [Fact]
    public void Non_array_returns_empty()
    {
        Assert.Empty(OrderItemsJson.Parse("""{"id":1}"""));
    }

    [Fact]
    public void Corrupt_json_throws_for_caller_to_log()
    {
        Assert.Throws<JsonException>(() => OrderItemsJson.Parse("not-json"));
    }
}
