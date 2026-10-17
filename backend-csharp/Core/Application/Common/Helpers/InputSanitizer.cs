using System.Text;

namespace Gardrop.Core.Application.Common.Helpers;

/// <summary>
/// İstifadəçi mətnlərinin təmizlənməsi (defense-in-depth): idarəetmə simvolları + görünməz
/// (zero-width) simvollar silinir, kənar boşluqlar trim edilir. XSS render-də React auto-escape
/// ilə qarşılanır; bu, saxlanan datanı email/CSV/qaimə/log üçün də təhlükəsiz saxlayır.
/// SQL injection EF parametrləşdirmə ilə qarşılanır (raw SQL yalnız DbSeeder-də, istifadəçi girişi yox).
/// </summary>
public static class InputSanitizer
{
    // Görünməz/istiqamət simvolları (zero-width + BOM + bidi override) — spoofing/gizli yük qarşısı.
    private static bool IsInvisible(char c) =>
        c is '​' or '‌' or '‍' or '﻿' or '‪' or '‫' or '‬' or '‭' or '‮';

    /// <summary>Tək sətir sahələr (ad, brend, ünvan…) — bütün idarəetmə + görünməz simvollar silinir.</summary>
    public static string Clean(string? s) => Clean(s, multiline: false);

    /// <summary>Çoxsətirli sahələr (təsvir, şərh) — yalnız \n/\r saxlanılır.</summary>
    public static string CleanMultiline(string? s) => Clean(s, multiline: true);

    public static string Clean(string? s, bool multiline)
    {
        if (string.IsNullOrEmpty(s)) return "";
        var sb = new StringBuilder(s.Length);
        foreach (var ch in s)
        {
            if (IsInvisible(ch)) continue;
            if (char.IsControl(ch) && !(multiline && (ch == '\n' || ch == '\r' || ch == '\t'))) continue;
            sb.Append(ch);
        }
        return sb.ToString().Trim();
    }
}
