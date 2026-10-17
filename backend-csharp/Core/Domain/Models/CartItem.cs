using Gardrop.Core.Domain.Common;

namespace Gardrop.Core.Domain.Models;

// Id → BaseEntity (long). Səbət sətri — silinəndə fiziki silinir (soft-delete yox).
public class CartItem : BaseEntity
{
    public long UserId { get; set; }
    public int ProductId { get; set; }
    public int Qty { get; set; } = 1;
    public string? Size { get; set; }

    public User? User { get; set; }
}
