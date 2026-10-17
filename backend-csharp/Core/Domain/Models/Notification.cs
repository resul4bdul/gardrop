using Gardrop.Core.Domain.Common;

namespace Gardrop.Core.Domain.Models;

/// <summary>
/// İstifadəçiyə (xüsusilə mağaza sahibinə) göndərilən bildiriş.
/// Məs: məhsul təsdiqləndi / rədd edildi, ekspress sifariş gəldi və s.
/// Id, CreatedAt, UpdatedAt → AuditableEntity (soft-delete yox — sadəcə Read bayrağı).
/// </summary>
public class Notification : AuditableEntity
{
    public long UserId { get; set; }            // alıcı istifadəçi
    public string Type { get; set; } = "info";  // "success" | "error" | "info" | "order"
    public string Title { get; set; } = "";
    public string Body { get; set; } = "";
    public bool Read { get; set; }
}
