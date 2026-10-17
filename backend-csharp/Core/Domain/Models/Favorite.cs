using Gardrop.Core.Domain.Common;

namespace Gardrop.Core.Domain.Models;

// Id → BaseEntity (long). Favorit qeydi — toggle/silinmə fiziki silinir.
public class Favorite : BaseEntity
{
    public long UserId { get; set; }
    public int ProductId { get; set; }

    public User? User { get; set; }
}
