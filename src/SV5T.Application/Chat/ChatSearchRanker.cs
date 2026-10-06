using System.Globalization;
using System.Text;

namespace SV5T.Application.Chat;

public sealed record ChatSearchViewerContext(
    bool IsStaff,
    string? Faculty,
    IReadOnlySet<Guid> AssignedMentorIds,
    IReadOnlySet<Guid> RecentContactIds);

public static class ChatSearchRanker
{
    public static string Normalize(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;
        var decomposed = text.Trim().ToLowerInvariant().Replace('đ', 'd').Normalize(NormalizationForm.FormD);
        var result = new StringBuilder(decomposed.Length);
        var previousSpace = false;
        foreach (var value in decomposed)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(value) == UnicodeCategory.NonSpacingMark)
                continue;
            if (char.IsWhiteSpace(value))
            {
                if (!previousSpace && result.Length > 0) result.Append(' ');
                previousSpace = true;
            }
            else
            {
                result.Append(value);
                previousSpace = false;
            }
        }
        return result.ToString().Trim().Normalize(NormalizationForm.FormC);
    }

    public static int ScoreContact(string query, ChatUserData contact, ChatSearchViewerContext viewer)
    {
        var normalizedQuery = Normalize(query);
        var name = Normalize(contact.DisplayName);
        var unit = Normalize(string.Join(' ', new[]
            { contact.Faculty, contact.AdministrativeClass, contact.School, contact.Major }
            .Where(x => !string.IsNullOrWhiteSpace(x))));
        var studentCode = Normalize(contact.StudentCode);
        var queryTokens = normalizedQuery.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        var nameTokens = name.Split(' ', StringSplitOptions.RemoveEmptyEntries);

        var score = name == normalizedQuery ? 100 : name.StartsWith(normalizedQuery, StringComparison.Ordinal) ? 80 : 0;
        var allNameTokensMatch = true;
        foreach (var queryToken in queryTokens)
        {
            if (nameTokens.Any(token => token.StartsWith(queryToken, StringComparison.Ordinal)))
            {
                score += 30;
                continue;
            }
            if (queryToken.Length >= 4 && nameTokens.Any(token => EditDistanceAtMostOne(queryToken, token)))
            {
                score += 15;
                continue;
            }
            allNameTokensMatch = false;
        }

        var unitMatch = unit.Contains(normalizedQuery, StringComparison.Ordinal);
        if (unitMatch) score += 20;
        var codeMatch = viewer.IsStaff && studentCode.Contains(normalizedQuery, StringComparison.Ordinal);
        if (codeMatch) score += 90;
        if (!allNameTokensMatch && !unitMatch && !codeMatch) return 0;

        if (viewer.AssignedMentorIds.Contains(contact.Id)) score += 40;
        if (!string.IsNullOrWhiteSpace(viewer.Faculty) &&
            Normalize(viewer.Faculty) == Normalize(contact.Faculty)) score += 10;
        if (viewer.RecentContactIds.Contains(contact.Id)) score += 20;
        return score;
    }

    private static bool EditDistanceAtMostOne(string first, string second)
    {
        if (Math.Abs(first.Length - second.Length) > 1) return false;
        var i = 0;
        var j = 0;
        var edits = 0;
        while (i < first.Length && j < second.Length)
        {
            if (first[i] == second[j])
            {
                i++;
                j++;
                continue;
            }
            if (++edits > 1) return false;
            if (first.Length > second.Length) i++;
            else if (second.Length > first.Length) j++;
            else
            {
                i++;
                j++;
            }
        }
        return edits + (i < first.Length || j < second.Length ? 1 : 0) <= 1;
    }
}
