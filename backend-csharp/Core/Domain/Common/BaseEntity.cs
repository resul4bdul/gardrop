namespace Gardrop.Core.Domain.Common;

/// <summary>
/// Bütün entity-lər üçün açar (Id) daşıyan baza.
/// Default açar tipi <see cref="long"/>; fərqli açar lazımdırsa <see cref="BaseEntity{TKey}"/> işlət.
/// </summary>
public abstract class BaseEntity : BaseEntity<long>;

/// <summary>Generik açarlı baza entity (məs. int, Guid, string).</summary>
public abstract class BaseEntity<TKey>
{
    public TKey Id { get; set; } = default!;
}
