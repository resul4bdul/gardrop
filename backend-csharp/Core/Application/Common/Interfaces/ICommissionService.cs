namespace Gardrop.Core.Application.Common.Interfaces;

public record StoreCommissionDto(string Category, decimal Percent);

/// <summary>Mağaza komissiyaları — admin idarəsi + mağaza net gəlir faktoru (bax menfiler D1/D2).</summary>
public interface ICommissionService
{
    /// <summary>Mağazanın hər məhsulu üçün net faktor: productId → (1 − pay%/100).</summary>
    Task<Dictionary<int, decimal>> NetFactorsAsync(int storeId, CancellationToken ct = default);

    Task<List<StoreCommissionDto>> ListAsync(int storeId, CancellationToken ct = default);

    /// <summary>Mağazanın bütün komissiya sətirlərini verilənlərlə əvəz edir (upsert/replace).</summary>
    Task ReplaceAsync(int storeId, List<StoreCommissionDto> rows, CancellationToken ct = default);
}
