using System.Text.Json.Serialization;
using Gardrop.Core.Application.Common.Interfaces;

namespace Gardrop.Core.Application.Common.DTOs;

/// <summary>POST /api/checkout/coupon — kupon yoxlama nəticəsi.
/// Uğurda { valid:true, code, type, value, discount }; uğursuzda { valid:false, error }.
/// Boş sahələr JSON-dan buraxılır (WhenWritingNull) — əvvəlki iki anonim şəkillə eyni.</summary>
public record CouponValidationResult
{
    public bool Valid { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Code { get; init; }
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Type { get; init; }
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public decimal? Value { get; init; }
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public decimal? Discount { get; init; }
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public string? Error { get; init; }

    public static CouponValidationResult Invalid(string? error) => new() { Valid = false, Error = error };
}

/// <summary>POST /api/checkout/delivery — çatdırılma qiymət təklifi.
/// JSON sahələri əvvəlki anonim şəkillə birə-bir (fee = standardFee geriyə-uyğunluq).</summary>
public record DeliveryQuoteResult(
    decimal Fee, decimal StandardFee, decimal ExpressFee, double? Km,
    bool Free, decimal FreeThreshold, List<DeliveryStoreQuote> PerStore,
    bool MultiStore, bool HasCoords)
{
    public static DeliveryQuoteResult From(DeliveryQuote q, bool multiStore, bool hasCoords) => new(
        Fee: q.StandardFee, StandardFee: q.StandardFee, ExpressFee: q.ExpressFee, Km: q.Km,
        Free: q.Free, FreeThreshold: q.FreeThreshold, PerStore: q.PerStore,
        MultiStore: multiStore, HasCoords: hasCoords);
}
