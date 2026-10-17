namespace Gardrop.Core.Application.Common.DTOs;

public record OrderDto(List<object>? Items, decimal? Total, object? DeliveryAddress, object? Payment,
    decimal? DeliveryFee, string? CouponCode, int? StoreId, string? DeliveryType);

// Kupon yoxlama (checkout) — kod + cari səbət cəmi
public record CouponCheckDto(string? Code, decimal? Subtotal);
// Çatdırılma xərci sorğusu — müştəri koordinatları (mağazalar səbətdən götürülür) + cəm (200₼ pulsuz üçün)
public record DeliveryQuoteDto(double? Lat, double? Lng, decimal? Subtotal);

public record AdminCouponDto(
    string? Code, string? Type, decimal? Value, decimal? MinOrder, bool? Active,
    DateTime? ExpiresAt, int? MaxUses);

public record AdminOrderStatusDto(string? Status, string? Reason);

// Sifariş ləğvi — səbəb mütləqdir
public record CancelDto(string? Reason);
