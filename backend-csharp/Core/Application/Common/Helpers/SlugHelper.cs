using System.Text;
using System.Text.RegularExpressions;

namespace Gardrop.Core.Application.Common.Helpers;

/// <summary>
/// SEO-uyğun URL slug yaradır (məhsul/mağaza). Azərbaycan diakritiklərini ASCII-yə çevirir,
/// kiçik hərf + kebab-case. Unikallıq DB səviyyəsində (bax IAppDbContextSlugExtensions).
/// </summary>
public static class SlugHelper
{
    private static readonly (char From, string To)[] Map =
    {
        ('ə',"e"),('Ə',"e"),('ğ',"g"),('Ğ',"g"),('ı',"i"),('I',"i"),('İ',"i"),
        ('ö',"o"),('Ö',"o"),('ü',"u"),('Ü',"u"),('ş',"s"),('Ş',"s"),('ç',"c"),('Ç',"c"),('â',"a"),
    };

    public static string Generate(string input)
    {
        if (string.IsNullOrWhiteSpace(input)) return "";
        var sb = new StringBuilder(input.Length);
        foreach (var ch in input.Trim())
        {
            var mapped = false;
            foreach (var (from, to) in Map)
                if (ch == from) { sb.Append(to); mapped = true; break; }
            if (!mapped) sb.Append(ch);
        }
        var s = sb.ToString().ToLowerInvariant();
        s = Regex.Replace(s, "[^a-z0-9]+", "-"); // qeyri-ASCII/simvol → tire
        s = Regex.Replace(s, "-+", "-").Trim('-');
        return s;
    }
}
