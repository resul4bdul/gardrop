using Gardrop.Core.Domain.Common;

namespace Gardrop.Core.Domain.Models;

/// <summary>
/// Sifariş sətri — relyasion (bax menfiler 2.2; əvvəl Order.ItemsJson blob idi).
/// Sifariş anına aid snapshot saxlayır (ad/mağaza/qiymət/ölçü) — məhsul sonra dəyişsə/silinsə də
/// sifariş tarixçəsi sabit qalır. ProductId snapshot istinaddır (FK məcburi deyil — məhsul silinə bilər).
/// </summary>
public class OrderItem : BaseEntity
{
    public long OrderId { get; set; }
    public int ProductId { get; set; }     // sifariş anındakı məhsul id-si (snapshot istinad)
    public string Name { get; set; } = "";
    public string Store { get; set; } = "";
    public decimal Price { get; set; }     // vahid qiymət (sifariş anı snapshot)
    public int Qty { get; set; }
    public string SelectedSize { get; set; } = "";

    public Order? Order { get; set; }
}
