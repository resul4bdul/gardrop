namespace Gardrop.Core.Application.Common.DTOs;

public record CartAddDto(int ProductId, int? Qty, string? Size);
public record CartQtyDto(int? Qty);
