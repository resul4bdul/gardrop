namespace Gardrop.Core.Domain.Models;

/// <summary>
/// Mağaza komissiyası — platformanın mağaza satışından tutduğu pay (%).
/// Category = "" → mağaza üzrə default (bütün kateqoriyalar); dolu → həmin kateqoriyaya xüsusi pay.
/// Mağaza gəlir olaraq net payını (1 − pay%) görür; admin/platforma brutu görür.
/// </summary>
public class StoreCommission
{
    public int Id { get; set; }
    public int StoreId { get; set; }
    public string Category { get; set; } = "";   // "" = default
    public decimal Percent { get; set; }          // 0–100
}
