using System.Text.Json;
using SV5T.Application.Common.Exceptions;
using SV5T.Domain.Evidences;
using SV5T.Domain.Submissions.Enums;

namespace SV5T.Application.Student.Support;

public static class StudentEvidenceGuard
{
    public const long MaxFileBytes = 10 * 1024 * 1024;

    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf", ".doc", ".docx", ".xls", ".xlsx",
        ".ppt", ".pptx", ".jpg", ".jpeg", ".png",
        ".webp", ".zip"
    };

    public static void EnsureEvidenceEditable(Evidence evidence)
    {
        if (evidence.Status is EvidenceStatus.Approved or EvidenceStatus.Submitted)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Minh chứng không ở trạng thái cho phép chỉnh sửa.",
                "evidence_not_editable");
        }
    }

    public static void EnsureExtensionAllowed(string fileName)
    {
        var ext = Path.GetExtension(fileName);
        if (string.IsNullOrWhiteSpace(ext) || !AllowedExtensions.Contains(ext))
        {
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "Định dạng tập tin không được hỗ trợ.",
                "unsupported_evidence_format");
        }
    }

    public static void EnsureSizeAllowed(long length)
    {
        if (length <= 0 || length > MaxFileBytes)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "Dung lượng tập tin phải từ 1 byte đến 10 MB.",
                "invalid_evidence_size");
        }
    }
}
