using Gardrop.Core.Domain.Enums;

namespace Gardrop.Core.Application.Common.DTOs;

/// <summary>Səbət sətri — məhsul detalı (alt-çoxluq) + qty + seçilmiş ölçü.
/// JSON şəkli əvvəlki anonim CartService.Hydrate proyeksiyası ilə birə-bir.</summary>
public record CartItemView
{
    public int Id { get; init; }
    public string Name { get; init; } = "";
    public string Store { get; init; } = "";
    public int StoreId { get; init; }
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
    public string Color { get; init; } = "";
    public List<string> Sizes { get; init; } = new();
    public Dictionary<string, int> SizeStock { get; init; } = new();
    public string Material { get; init; } = "";
    public List<string> ImageUrls { get; init; } = new();
    public int Images { get; init; }
    public int Stock { get; init; }
    public string Description { get; init; } = "";
    public int Qty { get; init; }
    public string SelectedSize { get; init; } = "";

    public static CartItemView From(Product p, int qty, string selectedSize) => new()
    {
        Id = p.Id, Name = p.Name, Store = p.Store, StoreId = p.StoreId, Price = p.Price,
        OldPrice = p.OldPrice, Rating = p.Rating, Reviews = p.Reviews, Size = p.Size,
        Discount = p.Discount, Category = p.Category, Subcategory = p.Subcategory,
        SubSubcategory = p.SubSubcategory, Gender = CatalogEnumParsing.GenderToWire(p.Gender), SizeSystem = p.SizeSystem,
        FitType = p.FitType, Stretch = p.Stretch, Color = p.Color, Sizes = p.Sizes,
        SizeStock = p.SizeStock, Material = p.Material, ImageUrls = p.ImageUrls, Images = p.Images,
        Stock = p.Stock, Description = p.Description, Qty = qty, SelectedSize = selectedSize,
    };
}
