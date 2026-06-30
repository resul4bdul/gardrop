namespace Gardrop.Core.Domain.Common;

/// <summary>
/// Audit izi olan baza entity. <see cref="CreatedAt"/>/<see cref="UpdatedAt"/> avtomatik doldurulur.
/// Soft-delete də lazımdırsa <see cref="ISoftDeletable"/> əlavə implement et:
/// <c>class Foo : AuditableEntity, ISoftDeletable</c>.
/// </summary>
public abstract class AuditableEntity : AuditableEntity<long>;

/// <summary>Generik açarlı audit entity.</summary>
public abstract class AuditableEntity<TKey> : BaseEntity<TKey>, IAuditableEntity
{
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
