using Gardrop.Core.Application.Common.DTOs;
using Gardrop.Core.Application.Services;
using Gardrop.Core.Domain.Models;

namespace Gardrop.Tests;

/// <summary>Variant matrisi → SizeStock/Sizes/Stock/Color törəməsi (bax ProductWriter). Saf məntiq, DB yox.</summary>
public class ProductWriterVariantTests
{
    private static Product Apply(AdminProductDto dto, Product? seed = null)
    {
        var p = seed ?? new Product();
        new ProductWriter().Apply(p, dto);
        return p;
    }

    [Fact]
    public void Variants_derive_sizestock_sizes_stock_color()
    {
        var dto = new AdminProductDto
        {
            Variants = new()
            {
                new() { Size = "M", Color = "Qara", Sku = "M-BLK", Stock = 3 },
                new() { Size = "L", Color = "Qara", Sku = "L-BLK", Stock = 2 },
                new() { Size = "M", Color = "Ağ", Sku = "M-WHT", Stock = 4 },
            }
        };
        var p = Apply(dto);

        Assert.Equal(9, p.Stock);                 // 3+2+4
        Assert.Equal(7, p.SizeStock["M"]);        // 3+4 (rənglər cəmlənir)
        Assert.Equal(2, p.SizeStock["L"]);
        Assert.Equal(2, p.Sizes.Count);
        Assert.Contains("Qara", p.Color);
        Assert.Contains("Ağ", p.Color);
    }

    [Fact]
    public void Empty_variants_clears_and_falls_back_to_sizestock()
    {
        var seed = new Product { Variants = new() { new() { Size = "M", Stock = 5 } }, SizeStock = new() { ["M"] = 5 }, Stock = 5 };
        var dto = new AdminProductDto { Variants = new(), SizeStock = new() { ["S"] = 2 } };
        var p = Apply(dto, seed);

        Assert.Empty(p.Variants);                 // matris təmizləndi
        Assert.True(p.SizeStock.ContainsKey("S")); // SizeStock rejiminə qayıtdı
        Assert.Equal(2, p.Stock);
    }

    [Fact]
    public void Variant_dedupe_sums_duplicate_size_color()
    {
        var dto = new AdminProductDto
        {
            Variants = new()
            {
                new() { Size = "M", Color = "Qara", Stock = 2 },
                new() { Size = "M", Color = "Qara", Stock = 3 },
            }
        };
        var p = Apply(dto);

        Assert.Single(p.Variants);
        Assert.Equal(5, p.Variants[0].Stock);
    }

    [Fact]
    public void Blank_size_and_color_rows_dropped()
    {
        var dto = new AdminProductDto
        {
            Variants = new()
            {
                new() { Size = "", Color = "", Sku = "X", Stock = 9 },   // atılmalı
                new() { Size = "S", Color = "Qara", Stock = 1 },
            }
        };
        var p = Apply(dto);

        Assert.Single(p.Variants);
        Assert.Equal("S", p.Variants[0].Size);
    }
}
