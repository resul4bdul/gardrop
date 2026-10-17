using Gardrop.Core.Domain.Common;
using Gardrop.Core.Domain.Enums;

namespace Gardrop.Core.Domain.Models;

/// <summary>
/// Endirim kuponu. Type: "percent" (faiz) və ya "amount" (sabit ₼ məbləğ).
/// MinOrder — kuponun işləməsi üçün səbətin minimum cəmi (₼).
/// Id, CreatedAt, UpdatedAt, IsDeleted, DeletedAt → FullAuditableEntity.
/// </summary>
public class Coupon : FullAuditableEntity
{
    public string Code { get; set; } = "";        // böyük hərflərlə saxlanılır (məs. "YAY10")
    public CouponType Type { get; set; } = CouponType.amount;  // enum (bax menfiler 3.5); DB-də string
    public decimal Value { get; set; }             // percent → 0-100, amount → ₼
    public decimal MinOrder { get; set; }          // minimum səbət cəmi (₼)
    public bool Active { get; set; } = true;
    public DateTime? ExpiresAt { get; set; }
    public int? MaxUses { get; set; }              // null = limitsiz
    public int Used { get; set; }
}
