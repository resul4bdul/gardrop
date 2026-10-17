namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>Kateqoriya kataloqu — Count məhsullardan dinamik hesablanır (bax menfiler D1/D2).</summary>
public interface ICategoryService
{
    Task<List<CategoryView>> ListWithCountsAsync(CancellationToken ct = default);
}
