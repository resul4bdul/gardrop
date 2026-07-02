using Microsoft.EntityFrameworkCore;
using Gardrop.Core.Domain.Models;

namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>
/// Persistence abstraksiyası (Application qatına məxsus). Biznes servisləri konkret
/// <c>AppDbContext</c>-ə deyil, bu interfeysə bağlanır — beləcə Application qatı EF/Npgsql
/// implementasiyasından asılı qalmır (bax menfiler 1.1 / 1.5). Konkret DbContext bunu
/// Infrastructure-da implement edir.
/// </summary>
public interface IAppDbContext
{
    DbSet<User> Users { get; }
    DbSet<Address> Addresses { get; }
    DbSet<CartItem> CartItems { get; }
    DbSet<Favorite> Favorites { get; }
    DbSet<Order> Orders { get; }
    DbSet<OrderItem> OrderItems { get; }
    DbSet<Review> Reviews { get; }
    DbSet<Store> Stores { get; }
    DbSet<Category> Categories { get; }
    DbSet<Product> Products { get; }
    DbSet<Coupon> Coupons { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<EmailCode> EmailCodes { get; }
    DbSet<SiteContent> SiteContents { get; }
    DbSet<StoreCommission> StoreCommissions { get; }
    DbSet<StorePayout> StorePayouts { get; }
    DbSet<Dispute> Disputes { get; }
    DbSet<Problem> Problems { get; }
    DbSet<ProblemEvent> ProblemEvents { get; }
    DbSet<ActivityLog> ActivityLogs { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Çoxaddımlı yazıları vahid atomik əməliyyatda birləşdirmək üçün transaction başladır
    /// (bax menfiler 2.5). Commit çağırılmazsa Dispose-da geri qaytarılır.
    /// </summary>
    Task<IAppDbTransaction> BeginTransactionAsync(CancellationToken cancellationToken = default);
}

/// <summary>EF-dən asılı olmayan transaction abstraksiyası (Application qatı üçün).</summary>
public interface IAppDbTransaction : IAsyncDisposable
{
    Task CommitAsync(CancellationToken cancellationToken = default);
}
