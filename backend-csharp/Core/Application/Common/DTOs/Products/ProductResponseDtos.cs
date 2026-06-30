using Gardrop.Core.Domain.Enums;
using Gardrop.Core.Domain.Models;

namespace Gardrop.Core.Application.Common.DTOs;

/// <summary>GET /api/products — kataloq siyahısı + ümumi say.
/// JSON şəkli əvvəlki anonim { total, products } ilə eynidir (frontend müqaviləsi qorunur).</summary>
public record ProductListResponse(int Total, IReadOnlyList<ProductView> Products);

/// <summary>GET /api/products/{id} — məhsul detalı + mağaza loqosu + əlaqəli məhsullar.
/// Sahələr əvvəlki anonim proyeksiya ilə birə-bir uyğundur (E1 — typed müqavilə).</summary>
public record ProductDetailDto
{
    public int Id { get; init; }
    public string Name { get; init; } = "";
    public string Store { get; init; } = "";
    public int StoreId { get; init; }
    public string StoreLogo { get; init; } = "";
    public decimal Price { get; init; }
    public decimal? OldPrice { get; init; }
    public double Rating { get; init; }
    public int Reviews { get; init; }
    public string Size { get; init; } = "";
    public int? Discount { get; init; }
    public string Category { get; init; } = "";
    public string Subcategory { get; init; } = "";
    public string SubSubcategory { get; init; } = "";
    public string Gender { get; init; } = "";
    public string SizeSystem { get; init; } = "";
    public string FitType { get; init; } = "";
    public string Stretch { get; init; } = "";
    public string SizeBehavior { get; init; } = "";
    public bool WashShrink { get; init; }
    public List<SizeChartRow> SizeChart { get; init; } = new();
    public string Brand { get; init; } = "";
    public string Color { get; init; } = "";
    public List<string> Sizes { get; init; } = new();
    public Dictionary<string, int> SizeStock { get; init; } = new();
    public string Material { get; init; } = "";
    public List<string> ImageUrls { get; init; } = new();
    public int Images { get; init; }
    public int Stock { get; init; }
    public string Description { get; init; } = "";
    public IReadOnlyList<ProductView> Related { get; init; } = [];

    public static ProductDetailDto From(Product p, string storeLogo, IReadOnlyList<ProductView> related) => new()
    {
        Id = p.Id, Name = p.Name, Store = p.Store, StoreId = p.StoreId, StoreLogo = storeLogo,
        Price = p.Price, OldPrice = p.OldPrice, Rating = p.Rating, Reviews = p.Reviews,
        Size = p.Size, Discount = p.Discount, Category = p.Category, Subcategory = p.Subcategory,
        SubSubcategory = p.SubSubcategory, Gender = CatalogEnumParsing.GenderToWire(p.Gender), SizeSystem = p.SizeSystem,
        FitType = p.FitType, Stretch = p.Stretch, SizeBehavior = p.SizeBehavior, WashShrink = p.WashShrink,
        SizeChart = p.SizeChart, Brand = p.Brand, Color = p.Color, Sizes = p.Sizes,
        SizeStock = p.SizeStock, Material = p.Material, ImageUrls = p.ImageUrls, Images = p.Images,
        Stock = p.Stock, Description = p.Description, Related = related,
    };
}
