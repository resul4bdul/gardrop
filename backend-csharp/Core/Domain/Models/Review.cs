using Gardrop.Core.Domain.Common;

namespace Gardrop.Core.Domain.Models;

// Id, CreatedAt, UpdatedAt, IsDeleted, DeletedAt → FullAuditableEntity.
public class Review : FullAuditableEntity
{
    public int ProductId { get; set; }
    public long UserId { get; set; }
    public string UserName { get; set; } = "";
    public int Rating { get; set; }
    public string Comment { get; set; } = "";

    // Müştərinin əlavə etdiyi şəkillər (yüklənmiş URL-lər).
    public List<string> ImageUrls { get; set; } = new();

    // Satıcı (mağaza) cavabı — müştəri rəyinə.
    public string StoreReply { get; set; } = "";
    public DateTime? StoreReplyAt { get; set; }
}
