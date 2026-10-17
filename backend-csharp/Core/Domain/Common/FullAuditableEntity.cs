namespace Gardrop.Core.Domain.Common;

/// <summary>
/// Tam audit izi + soft-delete olan baza entity: <see cref="AuditableEntity"/> üstəgəl
/// <see cref="ISoftDeletable"/>. Aqreqat köklərinin (User, Product, Order…) əksəriyyəti bundan törəyir.
/// </summary>
public abstract class FullAuditableEntity : FullAuditableEntity<long>;

/// <summary>Generik açarlı tam audit + soft-delete entity.</summary>
public abstract class FullAuditableEntity<TKey> : AuditableEntity<TKey>, ISoftDeletable
{
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
}
