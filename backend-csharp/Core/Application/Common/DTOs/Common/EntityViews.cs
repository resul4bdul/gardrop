using Gardrop.Core.Domain.Models;
using Gardrop.Core.Domain.Enums;

namespace Gardrop.Core.Application.Common.DTOs;

// ── Entity → API cavab DTO-ları (View) ──
// Məqsəd: domain/persistence entity-ləri birbaşa API müqaviləsi kimi sızdırmamaq (bax menfiler 1.3).
// JSON forması mövcud entity serializasiyası ilə BİRƏBİR eynidir (frontend müqaviləsi qorunur):
// audit sahələri (createdAt/updatedAt/isDeleted/deletedAt) də daxildir. SearchBlob əvvəlki kimi xaric.

public record ProductView
{
    public int Id { get; init; }
    public string Name { get; init; } = "";
    public string Store { get; init; } = "";
    public int StoreId { get; init; }
    public string Brand { get; init; } = "";
    public decimal Price { get; init; }
    public decimal? OldPrice { get; init; }
    public double Rating { get; init; }
    public int Reviews { get; init; }
    public string Size { get; init; } = "";
    public int? Discount { get; init; }
    public string Category { get; init; } = "";
    public string Subcategory { get; init; } = "";
    public string SubSubcategory { get; init; } = "";
    public string Color { get; init; } = "";
    public string Gender { get; init; } = "";
    public string SizeSystem { get; init; } = "";
    public string FitType { get; init; } = "";
    public string Stretch { get; init; } = "";
    public string SizeBehavior { get; init; } = "";
    public bool WashShrink { get; init; }
    public List<SizeChartRow> SizeChart { get; init; } = new();
    public List<string> Sizes { get; init; } = new();
    public Dictionary<string, int> SizeStock { get; init; } = new();
    public List<ProductVariant> Variants { get; init; } = new();
    public List<string> Colors { get; init; } = new();  // variantlardan törədilmiş fərqli rənglər
    public string Material { get; init; } = "";
    public List<string> ImageUrls { get; init; } = new();
    public int Images { get; init; }
    public int Stock { get; init; }
    public string Description { get; init; } = "";
    public string ApprovalStatus { get; init; } = "";
    public string RejectReason { get; init; } = "";
    public bool LowStockNotified { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
    public bool IsDeleted { get; init; }
    public DateTime? DeletedAt { get; init; }

    public static ProductView From(Product p) => new()
    {
        Id = p.Id, Name = p.Name, Store = p.Store, StoreId = p.StoreId, Brand = p.Brand,
        Price = p.Price, OldPrice = p.OldPrice, Rating = p.Rating, Reviews = p.Reviews,
        Size = p.Size, Discount = p.Discount, Category = p.Category, Subcategory = p.Subcategory,
        SubSubcategory = p.SubSubcategory, Color = p.Color, Gender = CatalogEnumParsing.GenderToWire(p.Gender), SizeSystem = p.SizeSystem,
        FitType = p.FitType, Stretch = p.Stretch, SizeBehavior = p.SizeBehavior, WashShrink = p.WashShrink,
        SizeChart = p.SizeChart, Sizes = p.Sizes, SizeStock = p.SizeStock,
        Variants = p.Variants, Colors = p.Variants.Where(v => !string.IsNullOrWhiteSpace(v.Color)).Select(v => v.Color).Distinct().ToList(),
        Material = p.Material,
        ImageUrls = p.ImageUrls, Images = p.Images, Stock = p.Stock, Description = p.Description,
        ApprovalStatus = p.ApprovalStatus.ToString(), RejectReason = p.RejectReason, LowStockNotified = p.LowStockNotified,
        CreatedAt = p.CreatedAt, UpdatedAt = p.UpdatedAt, IsDeleted = p.IsDeleted, DeletedAt = p.DeletedAt,
    };
}

public record StoreView
{
    public int Id { get; init; }
    public string Name { get; init; } = "";
    public double Rating { get; init; }
    public int Reviews { get; init; }
    public int Products { get; init; }
    public string City { get; init; } = "";
    public int Established { get; init; }
    public double? Lat { get; init; }
    public double? Lng { get; init; }
    public string Address { get; init; } = "";
    public string Logo { get; init; } = "";
    // Public profil/sosial/əlaqə/çatdırılma (həssas bank/VÖEN/notif DAXİL DEYİL — /settings qaytarır).
    public string Banner { get; init; } = "";
    public string Url { get; init; } = "";
    public string About { get; init; } = "";
    public string Instagram { get; init; } = "";
    public string Facebook { get; init; } = "";
    public string Tiktok { get; init; } = "";
    public string Whatsapp { get; init; } = "";
    public string Phone { get; init; } = "";
    public string Email { get; init; } = "";
    public int? PrepDays { get; init; }
    public int? ReturnDays { get; init; }
    public long? OwnerUserId { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
    public bool IsDeleted { get; init; }
    public DateTime? DeletedAt { get; init; }

    public static StoreView From(Store s) => new()
    {
        Id = s.Id, Name = s.Name, Rating = s.Rating, Reviews = s.Reviews, Products = s.Products,
        City = s.City, Established = s.Established, Lat = s.Lat, Lng = s.Lng, Address = s.Address,
        Logo = s.Logo, Banner = s.Banner, Url = s.Url, About = s.About,
        Instagram = s.Instagram, Facebook = s.Facebook, Tiktok = s.Tiktok, Whatsapp = s.Whatsapp,
        Phone = s.Phone, Email = s.Email, PrepDays = s.PrepDays, ReturnDays = s.ReturnDays,
        OwnerUserId = s.OwnerUserId,
        CreatedAt = s.CreatedAt, UpdatedAt = s.UpdatedAt, IsDeleted = s.IsDeleted, DeletedAt = s.DeletedAt,
    };
}

public record SubcategoryNodeView(string Name, List<string> Children);

public record CategoryView
{
    public string Name { get; init; } = "";
    public int Count { get; init; }
    public List<string> Subcategories { get; init; } = new();
    public List<SubcategoryNodeView> Tree { get; init; } = new();

    public static CategoryView From(Category c) => new()
    {
        Name = c.Name, Count = c.Count, Subcategories = c.Subcategories,
        Tree = c.Tree.Select(t => new SubcategoryNodeView(t.Name, t.Children)).ToList(),
    };
}

public record CouponView
{
    public long Id { get; init; }
    public string Code { get; init; } = "";
    public string Type { get; init; } = "";
    public decimal Value { get; init; }
    public decimal MinOrder { get; init; }
    public bool Active { get; init; }
    public DateTime? ExpiresAt { get; init; }
    public int? MaxUses { get; init; }
    public int Used { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
    public bool IsDeleted { get; init; }
    public DateTime? DeletedAt { get; init; }

    public static CouponView From(Coupon c) => new()
    {
        Id = c.Id, Code = c.Code, Type = c.Type.ToString(), Value = c.Value, MinOrder = c.MinOrder,
        Active = c.Active, ExpiresAt = c.ExpiresAt, MaxUses = c.MaxUses, Used = c.Used,
        CreatedAt = c.CreatedAt, UpdatedAt = c.UpdatedAt, IsDeleted = c.IsDeleted, DeletedAt = c.DeletedAt,
    };
}

public record ReviewView
{
    public long Id { get; init; }
    public int ProductId { get; init; }
    public long UserId { get; init; }
    public string UserName { get; init; } = "";
    public int Rating { get; init; }
    public string Comment { get; init; } = "";
    public List<string> ImageUrls { get; init; } = new();
    public string StoreReply { get; init; } = "";
    public DateTime? StoreReplyAt { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? UpdatedAt { get; init; }
    public bool IsDeleted { get; init; }
    public DateTime? DeletedAt { get; init; }

    public static ReviewView From(Review r) => new()
    {
        Id = r.Id, ProductId = r.ProductId, UserId = r.UserId, UserName = r.UserName,
        Rating = r.Rating, Comment = r.Comment, ImageUrls = r.ImageUrls,
        StoreReply = r.StoreReply, StoreReplyAt = r.StoreReplyAt,
        CreatedAt = r.CreatedAt, UpdatedAt = r.UpdatedAt, IsDeleted = r.IsDeleted, DeletedAt = r.DeletedAt,
    };
}

/// <summary>Entity kolleksiyalarını View-lara çevirmək üçün köməkçi genişləndirmələr.</summary>
public static class EntityViewMappings
{
    public static List<ProductView> ToViews(this IEnumerable<Product> items) => items.Select(ProductView.From).ToList();
    public static List<StoreView> ToViews(this IEnumerable<Store> items) => items.Select(StoreView.From).ToList();
    public static List<CategoryView> ToViews(this IEnumerable<Category> items) => items.Select(CategoryView.From).ToList();
    public static List<CouponView> ToViews(this IEnumerable<Coupon> items) => items.Select(CouponView.From).ToList();
    public static List<ReviewView> ToViews(this IEnumerable<Review> items) => items.Select(ReviewView.From).ToList();
}
