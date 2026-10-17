using Gardrop.Core.Application.Common;

namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>Admin paneli — istifadəçi idarəsi (bax menfiler 3.1: SRP üzrə bölünmüş admin servisləri).</summary>
public interface IAdminUserService
{
    Task<List<AdminUserView>> UsersAsync(string? search, int? page = null, int? pageSize = null, CancellationToken ct = default);
    Task<OpResult> UpdateUserAsync(long id, AdminUserDto dto, CancellationToken ct = default);
    Task<OpResult> ResetPasswordAsync(long id, AdminPasswordDto dto, CancellationToken ct = default);
    Task<OpResult> DeleteUserAsync(long currentUserId, long id, CancellationToken ct = default);
}
