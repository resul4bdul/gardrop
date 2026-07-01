using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Gardrop.Core.Application.Common;
using Gardrop.Core.Application.Common.Interfaces;

namespace Gardrop.Presentation.Controllers;

/// <summary>Satıcı (mağaza) paneli. Nazik controller — məntiq SRP üzrə bölünmüş satıcı servislərindədir (bax menfiler D1/D2, 3.1).</summary>
[ApiController]
[Authorize]
[Route("api/store")]
public class StoreController : ControllerBase
{
    // SRP üzrə bölünmüş satıcı paneli servisləri (bax menfiler 3.1).
    private readonly IStoreProfileService _profile;
    private readonly IStoreOwnerProductService _products;
    private readonly IStoreOwnerOrderService _orders;
    private readonly IStoreOwnerReviewService _reviews;
    public StoreController(IStoreProfileService profile, IStoreOwnerProductService products,
        IStoreOwnerOrderService orders, IStoreOwnerReviewService reviews)
    { _profile = profile; _products = products; _orders = orders; _reviews = reviews; }

    private long Uid => User.GetUserId()!.Value;
    private IActionResult Map(OpResult r) => r.ToActionResult();

    // GET /api/store/me
    [HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken ct) => Ok(await _profile.MyStoresAsync(Uid, ct));

    // PUT /api/store/me/{id}
    [HttpPut("me/{id:int}")]
    public async Task<IActionResult> UpdateSelf(int id, [FromBody] StoreSelfDto dto, CancellationToken ct) =>
        Map(await _profile.UpdateSelfAsync(Uid, id, dto, ct));

    // GET /api/store/{id}/settings — həssas ayarlar (bank/hüquqi/bildiriş), yalnız sahib.
    [HttpGet("{id:int}/settings")]
    public async Task<IActionResult> Settings(int id, CancellationToken ct) => Map(await _profile.SettingsAsync(Uid, id, ct));

    // GET /api/store/{id}/dashboard
    [HttpGet("{id:int}/dashboard")]
    public async Task<IActionResult> Dashboard(int id, CancellationToken ct) => Map(await _profile.DashboardAsync(Uid, id, ct));

    // ── Məhsullar ──
    [HttpGet("{id:int}/products")]
    public async Task<IActionResult> Products(int id, [FromQuery] string? search, CancellationToken ct) =>
        Map(await _products.ProductsAsync(Uid, id, search, ct));

    [HttpPost("{id:int}/products")]
    public async Task<IActionResult> CreateProduct(int id, [FromBody] AdminProductDto dto, CancellationToken ct) =>
        Map(await _products.CreateProductAsync(Uid, id, dto, ct));

    [HttpPut("{id:int}/products/{pid:int}")]
    public async Task<IActionResult> UpdateProduct(int id, int pid, [FromBody] AdminProductDto dto, CancellationToken ct) =>
        Map(await _products.UpdateProductAsync(Uid, id, pid, dto, ct));

    [HttpDelete("{id:int}/products/{pid:int}")]
    public async Task<IActionResult> DeleteProduct(int id, int pid, CancellationToken ct) =>
        Map(await _products.DeleteProductAsync(Uid, id, pid, ct));

    // ── Sifarişlər ──
    [HttpGet("{id:int}/orders")]
    public async Task<IActionResult> Orders(int id, [FromQuery] string? status, CancellationToken ct) =>
        Map(await _orders.OrdersAsync(Uid, id, status, ct));

    [HttpPut("{id:int}/orders/{oid:long}/status")]
    public async Task<IActionResult> UpdateOrderStatus(int id, long oid, [FromBody] AdminOrderStatusDto dto, CancellationToken ct) =>
        Map(await _orders.UpdateOrderStatusAsync(Uid, id, oid, dto, ct));

    // POST /api/store/{id}/orders/{oid}/courier — kuryeri çağır (dispatch bildirişi)
    [HttpPost("{id:int}/orders/{oid:long}/courier")]
    public async Task<IActionResult> RequestCourier(int id, long oid, CancellationToken ct) =>
        Map(await _orders.RequestCourierAsync(Uid, id, oid, ct));

    // ── Rəylər ──
    [HttpGet("{id:int}/reviews")]
    public async Task<IActionResult> Reviews(int id, CancellationToken ct) => Map(await _reviews.ReviewsAsync(Uid, id, ct));

    [HttpPut("{id:int}/reviews/{rid:long}/reply")]
    public async Task<IActionResult> ReplyReview(int id, long rid, [FromBody] ReviewReplyDto dto, CancellationToken ct) =>
        Map(await _reviews.ReplyReviewAsync(Uid, id, rid, dto, ct));

    // ── Analitika ──
    [HttpGet("{id:int}/analytics")]
    public async Task<IActionResult> Analytics(int id, [FromQuery] int days = 14, CancellationToken ct = default) =>
        Map(await _profile.AnalyticsAsync(Uid, id, days, ct));

    // GET /api/store/{id}/finance
    [HttpGet("{id:int}/finance")]
    public async Task<IActionResult> Finance(int id, CancellationToken ct) => Map(await _profile.FinanceAsync(Uid, id, ct));
}
