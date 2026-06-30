namespace Gardrop.Core.Application.Common.Helpers;

/// <summary>
/// Azərbaycan diakritiklərini ASCII-yə folding edib kiçik hərfə çevirir —
/// DB-dəki SearchBlob STORED sütunu ilə eyni qayda (bax AppDbContext).
/// </summary>
public static class TextNormalizer
{
    // Folding cütləri — TƏK MƏNBƏ. DB computed sütunu (AppDbContext) bu sabitlərdən SQL translate()
    // qurur, ona görə C# və SQL həmişə eyni qaydadan istifadə edir (bax menfiler C4).
    public const string FoldFrom = "ƏəĞğıİÖöÜüÇçŞş";
    public const string FoldTo   = "eeggiioouuccss";

    public static string Normalize(string? s)
    {
        if (string.IsNullOrEmpty(s)) return "";
        var sb = new System.Text.StringBuilder(s.Length);
        foreach (var ch in s)
        {
            var i = FoldFrom.IndexOf(ch);
            sb.Append(i >= 0 ? FoldTo[i] : ch);
        }
        return sb.ToString().ToLowerInvariant();
    }
}
