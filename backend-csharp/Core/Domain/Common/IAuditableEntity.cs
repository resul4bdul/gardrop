namespace Gardrop.Core.Domain.Common;

/// <summary>
/// Audit izi: yaradılma və son yenilənmə vaxtı.
/// Sahələr <c>AppDbContext.SaveChanges</c>-də avtomatik doldurulur — əl ilə təyin etməyə ehtiyac yoxdur.
/// </summary>
public interface IAuditableEntity
{
    DateTime CreatedAt { get; set; }
    DateTime? UpdatedAt { get; set; }
}
