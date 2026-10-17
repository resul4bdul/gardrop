namespace Gardrop.Core.Domain.Enums;

// Problem (geri qaytarma / şikayət) axını — Trendyol modeli (bax OrderEnums.cs qeydi:
// üzv adı ingilis ASCII, wire/DB string dəyəri Azərbaycan dilində saxlanır).

/// <summary>Problemin həyat dövrü statusu (wire/DB string dəyəri = const value).</summary>
public static class ProblemStatus
{
    public const string AwaitingStore = "Satıcı cavabı gözlənilir";   // açıldı, satıcının 48 saatı var
    public const string StoreAccepted = "Satıcı qəbul etdi";           // satıcı qəbul etdi → admin qaytarma/refund qərarı verir
    public const string Arbitration = "Arbitrajda";                    // satıcı rədd etdi VƏ YA 48 saat bitdi → admin baxır
    public const string ReturnInProgress = "Qaytarma kuryerdədir";     // kuryer malı müştəridən götürüb satıcıya aparır
    public const string Refunded = "Pul qaytarıldı";                   // terminal — ödəniş geri qaytarıldı
    public const string Rejected = "Rədd edildi";                      // terminal — admin əsassız saydı
    public const string Cancelled = "Ləğv edildi";                     // terminal — müştəri özü bağladı

    public static readonly string[] All =
        { AwaitingStore, StoreAccepted, Arbitration, ReturnInProgress, Refunded, Rejected, Cancelled };

    /// <summary>Terminal statuslar — bunlardan sonra heç bir keçid yoxdur.</summary>
    public static readonly string[] Terminal = { Refunded, Rejected, Cancelled };

    public static bool IsTerminal(string s) => Terminal.Contains(s);
}

/// <summary>Problem səbəbi (müştəri seçir; wire/DB string dəyəri = const value).</summary>
public static class ProblemReason
{
    public const string Defective = "Qüsurlu məhsul";
    public const string WrongItem = "Yanlış məhsul";
    public const string NotAsDescribed = "Təsvirə uyğun deyil";
    public const string SizeIssue = "Ölçü uyğun gəlmədi";
    public const string ChangedMind = "Fikrim dəyişdi";
    public const string NotDelivered = "Çatdırılmadı";
    public const string Other = "Digər";

    public static readonly string[] All =
        { Defective, WrongItem, NotAsDescribed, SizeIssue, ChangedMind, NotDelivered, Other };

    /// <summary>Bu səbəblər yalnız çatdırılmış sifarişdə keçərlidir (malı görmək lazımdır).</summary>
    public static readonly string[] RequiresDelivered = { SizeIssue, ChangedMind };
}

/// <summary>Qaytarma kuryer xərcini kim ödəyir — admini səbəbi analiz edib seçir.</summary>
public static class ReturnCostPayer
{
    public const string Store = "Mağaza";      // qüsur/yanlış məhsul → satıcı ödəyir
    public const string Customer = "Müştəri";  // fikir dəyişikliyi → müştəri ödəyir

    public static readonly string[] All = { Store, Customer };
}
