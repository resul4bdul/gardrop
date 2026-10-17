namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>Məhsul DTO-sunu Product modelinə tətbiq edir (admin və mağaza paneli üçün ortaq).</summary>
public interface IProductWriter
{
    void Apply(Product product, AdminProductDto dto);
}
