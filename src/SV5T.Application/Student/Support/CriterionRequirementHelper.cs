using SV5T.Domain.Criteria;
using SV5T.Domain.Standards.Enums;

namespace SV5T.Application.Student.Support;

public static class CriterionRequirementHelper
{
    public static bool IsRequired(Criterion criterion, IReadOnlyDictionary<Guid, Criterion>? allCriteriaById = null)
    {
        // 1. Nếu có ParentCriterionId: thuộc về một nhóm con
        if (criterion.ParentCriterionId.HasValue)
        {
            if (allCriteriaById != null && allCriteriaById.TryGetValue(criterion.ParentCriterionId.Value, out var parent))
            {
                // Nếu parent có Operator là Any hoặc AtLeast -> Các con trong nhóm này là TỰ CHỌN
                if (parent.Operator is CriterionOperator.Any or CriterionOperator.AtLeast)
                {
                    return false;
                }

                // Nếu title hoặc description của parent có chứa "tự chọn" -> TỰ CHỌN
                if (parent.Title.Contains("tự chọn", StringComparison.OrdinalIgnoreCase) ||
                    (parent.Description != null && parent.Description.Contains("tự chọn", StringComparison.OrdinalIgnoreCase)))
                {
                    return false;
                }
            }

            // Trong mô hình SV5T, các Requirement nằm trong nhóm con là tiêu chí tự chọn
            return false;
        }

        // 2. Kiểm tra DefinitionJson
        if (!string.IsNullOrWhiteSpace(criterion.DefinitionJson))
        {
            try
            {
                using var doc = System.Text.Json.JsonDocument.Parse(criterion.DefinitionJson);
                var root = doc.RootElement;

                // isRequired: false
                if (root.TryGetProperty("isRequired", out var isReqEl) &&
                    (isReqEl.ValueKind is System.Text.Json.JsonValueKind.False ||
                     (isReqEl.ValueKind is System.Text.Json.JsonValueKind.String && bool.TryParse(isReqEl.GetString(), out var b1) && !b1)))
                {
                    return false;
                }

                // isOptional: true
                if (root.TryGetProperty("isOptional", out var isOptEl) &&
                    (isOptEl.ValueKind is System.Text.Json.JsonValueKind.True ||
                     (isOptEl.ValueKind is System.Text.Json.JsonValueKind.String && bool.TryParse(isOptEl.GetString(), out var b2) && b2)))
                {
                    return false;
                }

                // kind: "optional"
                if (root.TryGetProperty("kind", out var kindEl) &&
                    kindEl.GetString()?.Equals("optional", StringComparison.OrdinalIgnoreCase) == true)
                {
                    return false;
                }
            }
            catch
            {
                // Bỏ qua lỗi parse JSON nếu chuỗi không đúng định dạng
            }
        }

        // 3. Kiểm tra title hoặc code nếu có đánh dấu tự chọn rõ ràng
        if (criterion.Title.Contains("(tự chọn)", StringComparison.OrdinalIgnoreCase) ||
            criterion.Title.Contains("tự chọn", StringComparison.OrdinalIgnoreCase) ||
            criterion.Code.Contains("TU_CHON", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        return true;
    }
}
