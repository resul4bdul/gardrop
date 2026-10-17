namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>Mağaza üzrə çatdırılma xərci təfərrüatı.</summary>
public record DeliveryStoreQuote(int StoreId, string Store, double? Km, decimal Fee);

/// <summary>Çatdırılma hesablama nəticəsi.</summary>
public record DeliveryQuote(
    decimal Total, double? Km,
    decimal StandardFee, decimal ExpressFee,
    bool Free, decimal FreeThreshold,
    List<DeliveryStoreQuote> PerStore);

/// <summary>Mağaza(lar)a görə standart + ekspress çatdırılma xərclərini hesablayır.</summary>
public interface IDeliveryService
{
    DeliveryQuote Quote(IEnumerable<Store> stores, double? lat, double? lng, decimal subtotal = 0, bool express = false);
}
