namespace Gardrop.Core.Application.Common.Interfaces;

/// <summary>İstifadəçi bildirişləri — yaratma (Notify, SaveChanges çağıranda) + oxuma/işarələmə.</summary>
public interface INotificationService
{
    void Notify(long userId, string type, string title, string body);

    Task<(int Unread, List<Notification> Items)> ListAsync(long userId, CancellationToken ct = default);
    Task MarkAllReadAsync(long userId, CancellationToken ct = default);
    Task<bool> MarkReadAsync(long userId, long id, CancellationToken ct = default);  // false = tapılmadı
}
