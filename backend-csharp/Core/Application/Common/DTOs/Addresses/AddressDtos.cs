namespace Gardrop.Core.Application.Common.DTOs;

public record AddressDto(string? Label, string? Sehir, string? Unvan, double? Lat, double? Lng, bool? IsDefault);
