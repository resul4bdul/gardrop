using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Gardrop.Core.Application.Common;
using Gardrop.Core.Application.Common.Interfaces;

namespace Gardrop.Presentation.Controllers;

/// <summary>Admin paneli. Nazik controller — CRUD/analitika SRP üzrə bölünmüş admin servislərindədir (bax menfiler D1/D2, 3.1).</summary>
[ApiController]
[Authorize(Policy = "Admin")]
[Route("api/admin")]
public class AdminController : ControllerBase
{
    private readonly IAdminUserService _users;
    private readonly IAdminCatalogService _catalog;
    private readonly IAdminOrderService _orders;
    private readonly IAdminAnalyticsService _analytics;
    private readonly IAdminReviewService _reviews;
    public AdminController(IAdminUserService users, IAdminCatalogService catalog, IAdminOrderService orders,
        IAdminAnalyticsService analytics, IAdminReviewService reviews)
    { _users = users; _catalog = catalog; _orders = orders; _analytics = analytics; _reviews = reviews; }

    private IActionResult Map(OpResult r) => r.ToActionResult();

    // ── Dashboard ──
    [HttpGet("stats")]
    public async Task<IActionResult> Stats(CancellationToken ct) => Ok(await _analytics.StatsAsync(ct));

    [HttpGet("analytics")]
    public async Task<IActionResult> Analytics([FromQuery] int days = 14, CancellationToken ct = default) => Ok(await _analytics.AnalyticsAsync(days, ct));

    // ── Users ──
    [HttpGet("users")]
    public async Task<IActionResult> Users([FromQuery] string? search, [FromQuery] int? page, [FromQuery] int? pageSize, CancellationToken ct) => Ok(await _users.UsersAsync(search, page, pageSize, ct));

    [HttpPut("users/{id:long}")]
    public async Task<IActionResult> UpdateUser(long id, [FromBody] AdminUserDto dto, CancellationToken ct) => Map(await _users.UpdateUserAsync(id, dto, ct));

    [HttpPost("users/{id:long}/password")]
    public async Task<IActionResult> ResetPassword(long id, [FromBody] AdminPasswordDto dto, CancellationToken ct) => Map(await _users.ResetPasswordAsync(id, dto, ct));

    [HttpDelete("users/{id:long}")]
    public async Task<IActionResult> DeleteUser(long id, CancellationToken ct) => Map(await _users.DeleteUserAsync(User.GetUserId() ?? 0, id, ct));

    // ── Products ──
    [HttpGet("products")]
    public async Task<IActionResult> Products([FromQuery] string? search, [FromQuery] string? status, [FromQuery] int? page, [FromQuery] int? pageSize, CancellationToken ct) => Ok(await _catalog.ProductsAsync(search, status, page, pageSize, ct));

    [HttpPut("products/{id:int}/approval")]
    public async Task<IActionResult> SetApproval(int id, [FromBody] ApprovalDto dto, CancellationToken ct) => Map(await _catalog.SetApprovalAsync(id, dto, ct));

    [HttpPost("products")]
    public async Task<IActionResult> CreateProduct([FromBody] AdminProductDto dto, CancellationToken ct) => Map(await _catalog.CreateProductAsync(dto, ct));

    [HttpPut("products/{id:int}")]
    public async Task<IActionResult> UpdateProduct(int id, [FromBody] AdminProductDto dto, CancellationToken ct) => Map(await _catalog.UpdateProductAsync(id, dto, ct));

    [HttpPost("products/bulk")]
    public async Task<IActionResult> BulkProducts([FromBody] BulkProductDto dto, CancellationToken ct) => Map(await _catalog.BulkProductsAsync(dto, ct));

    [HttpDelete("products/{id:int}")]
    public async Task<IActionResult> DeleteProduct(int id, CancellationToken ct) => Map(await _catalog.DeleteProductAsync(id, ct));

    // ── Stores ──
    [HttpGet("stores")]
    public async Task<IActionResult> Stores(CancellationToken ct) => Ok(await _catalog.StoresAsync(ct));

    [HttpPost("stores")]
    public async Task<IActionResult> CreateStore([FromBody] AdminStoreDto dto, CancellationToken ct) => Map(await _catalog.CreateStoreAsync(dto, ct));

    [HttpPut("stores/{id:int}")]
    public async Task<IActionResult> UpdateStore(int id, [FromBody] AdminStoreDto dto, CancellationToken ct) => Map(await _catalog.UpdateStoreAsync(id, dto, ct));

    [HttpDelete("stores/{id:int}")]
    public async Task<IActionResult> DeleteStore(int id, CancellationToken ct) => Map(await _catalog.DeleteStoreAsync(id, ct));

    // ── Coupons ──
    [HttpGet("coupons")]
    public async Task<IActionResult> Coupons(CancellationToken ct) => Ok(await _catalog.CouponsAsync(ct));

    [HttpPost("coupons")]
    public async Task<IActionResult> CreateCoupon([FromBody] AdminCouponDto dto, CancellationToken ct) => Map(await _catalog.CreateCouponAsync(dto, ct));

    [HttpPut("coupons/{id:long}")]
    public async Task<IActionResult> UpdateCoupon(long id, [FromBody] AdminCouponDto dto, CancellationToken ct) => Map(await _catalog.UpdateCouponAsync(id, dto, ct));

    [HttpDelete("coupons/{id:long}")]
    public async Task<IActionResult> DeleteCoupon(long id, CancellationToken ct) => Map(await _catalog.DeleteCouponAsync(id, ct));

    // ── Categories ──
    [HttpGet("categories")]
    public async Task<IActionResult> Categories(CancellationToken ct) => Ok(await _catalog.CategoriesAsync(ct));

    [HttpPost("categories")]
    public async Task<IActionResult> CreateCategory([FromBody] AdminCategoryDto dto, CancellationToken ct) => Map(await _catalog.CreateCategoryAsync(dto, ct));

    [HttpPut("categories/{name}")]
    public async Task<IActionResult> UpdateCategory(string name, [FromBody] AdminCategoryDto dto, CancellationToken ct) => Map(await _catalog.UpdateCategoryAsync(name, dto, ct));

    [HttpDelete("categories/{name}")]
    public async Task<IActionResult> DeleteCategory(string name, CancellationToken ct) => Map(await _catalog.DeleteCategoryAsync(name, ct));

    // ── Orders ──
    [HttpGet("orders")]
    public async Task<IActionResult> Orders([FromQuery] string? status, CancellationToken ct) => Ok(await _orders.OrdersAsync(status, ct));

    [HttpPut("orders/{id:long}/status")]
    public async Task<IActionResult> UpdateOrderStatus(long id, [FromBody] AdminOrderStatusDto dto, CancellationToken ct) => Map(await _orders.UpdateOrderStatusAsync(id, dto, ct));

    [HttpDelete("orders/{id:long}")]
    public async Task<IActionResult> DeleteOrder(long id, CancellationToken ct) => Map(await _orders.DeleteOrderAsync(id, ct));

    // ── Reviews ──
    [HttpGet("reviews")]
    public async Task<IActionResult> Reviews([FromQuery] int? productId, CancellationToken ct) => Ok(await _reviews.ReviewsAsync(productId, ct));

    [HttpDelete("reviews/{id:long}")]
    public async Task<IActionResult> DeleteReview(long id, CancellationToken ct) => Map(await _reviews.DeleteReviewAsync(id, ct));
}
