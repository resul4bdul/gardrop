using Gardrop.Core.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Gardrop.Core.Application.Services;

/// <summary>
/// Məhsul silmə siyasətinin tək mənbəyi (bax menfiler 2.6). Məhsulu silərkən ona istinad
/// edən asılı sətirlər (səbət + seçilmişlər) də təmizlənir ki, orfan istinad qalmasın.
/// Sifariş tarixçəsi JSON-da qaldığı üçün ona toxunulmur. Admin tək/toplu silmə, mağaza
/// silməsi və stok bitməsi (OrderOps) eyni yoldan keçir.
/// </summary>
public static class ProductDeletionExtensions
{
    public static void RemoveProductWithDependents(this IAppDbContext db, Product product)
    {
        db.CartItems.RemoveRange(db.CartItems.Where(c => c.ProductId == product.Id));
        db.Favorites.RemoveRange(db.Favorites.Where(f => f.ProductId == product.Id));
        db.Products.Remove(product);
    }
}
