using SV5T.Domain.Standards.Enums;

namespace SV5T.Application.Criteria.Support;

/// <summary>
/// Pure static helper tách từ CriterionService.GenerateAutoCriterionCodeAsync.
/// Không inject repository — nhận vào danh sách code đã tồn tại.
/// </summary>
public static class CriterionCodeGenerator
{
    public static string GenerateAutoCode(
        string standardCode,
        CreateCodeRequest request,
        IReadOnlyCollection<string> allCodes,
        Func<Guid, string?> resolveParentCode)
    {
        var existingCodes = allCodes.Select(c => c.ToUpperInvariant()).ToHashSet();
        var basePrefix = string.IsNullOrWhiteSpace(standardCode) ? "TC" : standardCode;

        if (!request.ParentCriterionId.HasValue)
        {
            if (request.Type == CriterionType.Group)
            {
                var optCandidate = $"{basePrefix}_GRP";
                var optIndex = 1;
                while (existingCodes.Contains(optCandidate.ToUpperInvariant()))
                {
                    optIndex++;
                    optCandidate = $"{basePrefix}_GRP{optIndex}";
                }
                return optCandidate;
            }

            var rootIndex = 1;
            while (rootIndex < 500)
            {
                var candidate = $"{basePrefix}.{rootIndex}";
                if (!existingCodes.Contains(candidate.ToUpperInvariant()))
                    return candidate;
                rootIndex++;
            }

            return $"{basePrefix}.{Guid.NewGuid().ToString("N")[..4]}";
        }

        var parentCode = resolveParentCode(request.ParentCriterionId.Value) ?? basePrefix;

        if (request.Type == CriterionType.Group)
        {
            var optCandidate = $"{parentCode}_OPT";
            var optIndex = 1;
            while (existingCodes.Contains(optCandidate.ToUpperInvariant()))
            {
                optIndex++;
                optCandidate = $"{parentCode}_OPT{optIndex}";
            }
            return optCandidate;
        }

        var index = 1;
        while (index < 500)
        {
            var candidate = parentCode.Contains("_OPT", StringComparison.OrdinalIgnoreCase)
                ? $"{parentCode.Replace("_OPT", "")}.TC.{index}"
                : $"{parentCode}.{index}";

            if (!existingCodes.Contains(candidate.ToUpperInvariant()))
                return candidate;
            index++;
        }

        return $"{parentCode}.{Guid.NewGuid().ToString("N")[..4]}";
    }

    public sealed record CreateCodeRequest(Guid? ParentCriterionId, CriterionType Type);
}
