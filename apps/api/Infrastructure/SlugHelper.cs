using System.Globalization;
using System.Text;

namespace GjirafaNewsAPI;

/// <summary>
/// Lower-cases and converts a string into a URL-safe kebab slug.
/// Strips diacritics so "Botë" → "bote".
/// </summary>
public static class SlugHelper
{
    public static string Slugify(string input)
    {
        if (string.IsNullOrWhiteSpace(input)) return string.Empty;

        var normalized = input.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(normalized.Length);
        foreach (var ch in normalized)
        {
            var category = CharUnicodeInfo.GetUnicodeCategory(ch);
            if (category == UnicodeCategory.NonSpacingMark) continue;
            sb.Append(char.ToLowerInvariant(ch));
        }

        var stripped = sb.ToString();
        var slug = new StringBuilder(stripped.Length);
        var lastWasHyphen = false;
        foreach (var ch in stripped)
        {
            if ((ch >= 'a' && ch <= 'z') || (ch >= '0' && ch <= '9'))
            {
                slug.Append(ch);
                lastWasHyphen = false;
            }
            else if (!lastWasHyphen)
            {
                slug.Append('-');
                lastWasHyphen = true;
            }
        }
        return slug.ToString().Trim('-');
    }
}
