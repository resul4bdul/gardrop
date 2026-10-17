using Gardrop.Core.Domain.Common;

namespace Gardrop.Core.Domain.Models;

// Id → BaseEntity (long). Audit/soft-delete yox — User ilə cascade silinən törəmə.
public class Address : BaseEntity
{
    public long UserId { get; set; }
    public string Label { get; set; } = "";
    public string Sehir { get; set; } = "Bakı";
    public string Unvan { get; set; } = "";
    public double? Lat { get; set; }   // xəritədən seçilən koordinat
    public double? Lng { get; set; }
    public bool IsDefault { get; set; }

    public User? User { get; set; }
}
