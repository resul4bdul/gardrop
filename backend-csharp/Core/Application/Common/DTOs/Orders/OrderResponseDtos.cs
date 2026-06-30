using System.Text.Json;

namespace Gardrop.Core.Application.Common.DTOs;

/// <summary>Müştəri sifariş forması (list/detail). Items/DeliveryAddress/Payment hələ
/// JSON saxlanılır → JsonElement kimi ötürülür (şəkil əvvəlki anonim Shape ilə eyni).</summary>
public record OrderView(
    long Id, long UserId, string OrderNo, JsonElement Items, decimal Total,
    decimal DeliveryFee, string DeliveryType, decimal Discount, string? CouponCode,
    JsonElement DeliveryAddress, JsonElement Payment, string Status, DateTime CreatedAt,
    DateTime? ConfirmedAt, DateTime? ShippedAt, DateTime? DeliveredAt, DateTime? CancelledAt,
    string CancelReason, string CancelledBy,
    string PaymentMethod, string PaymentStatus);

/// <summary>Sifariş yaradıldı + ödəniş axını (COD → Gözləyir; onlayn → checkoutUrl/clientSecret). Bax A.1.</summary>
public record OrderCreatedResult(
    string OrderNo, long OrderId, decimal Total, decimal DeliveryFee, decimal Discount,
    string PaymentStatus = "", string PaymentProvider = "",
    string? CheckoutUrl = null, string? ClientSecret = null, bool RequiresAction = false);
