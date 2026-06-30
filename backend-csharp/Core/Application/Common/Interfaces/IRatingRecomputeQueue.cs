namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>
/// Reytinq yenidən hesablamasını fon-da coalesce edib planlaşdırır (bax menfiler 4.4).
/// Mutasiyalardan sonra `RecomputeAsync`-i sinxron gözləmək əvəzinə `Request()` çağırılır;
/// ardıcıl istəklər tək hesablamaya birləşir (debounce). Reytinq nəticədə tutarlı (eventual).
/// </summary>
public interface IRatingRecomputeQueue
{
    void Request();
}
