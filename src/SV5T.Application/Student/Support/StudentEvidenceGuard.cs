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
                "Minh chung khong o trang thai cho phep chinh sua.",
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
                "Dinh dang file khong duoc ho tro.",
                "unsupported_evidence_format");
        }
    }

    public static void EnsureSizeAllowed(long length)
    {
        if (length <= 0 || length > MaxFileBytes)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "Dung luong file phai tu 1 byte den 10 MB.",
                "invalid_evidence_size");
        }
    }

    public static void EnsureAttachmentPolicyCompliant(
        EvidenceTypeTemplate template,
        int newFileCount,
        long newFileBytes,
        string newExtension)
    {
        try
        {
            using var doc = JsonDocument.Parse(
                string.IsNullOrWhiteSpace(template.AttachmentPolicyJson)
                    ? "{}"
                    : template.AttachmentPolicyJson);
            var root = doc.RootElement;

            var maxFiles = root.TryGetProperty("maxFiles", out var mf) && mf.TryGetInt32(out var mfi)
                ? mfi : 5;
            var maxBytes = root.TryGetProperty("maxFileSizeBytes", out var ms) && ms.TryGetInt64(out var msi)
                ? msi : MaxFileBytes;

            if (newFileCount > maxFiles)
            {
                throw new UseCaseException(
                    ApplicationErrorKind.Validation,
                    $"So luong file vuot qua gioi han ({maxFiles}).",
                    "evidence_too_many_files");
            }

            if (newFileBytes > maxBytes)
            {
                throw new UseCaseException(
                    ApplicationErrorKind.Validation,
                    "Dung luong file vuot qua gioi han cua loai minh chung.",
                    "evidence_file_too_large");
            }

            if (root.TryGetProperty("extensions", out var extEl) && extEl.ValueKind == JsonValueKind.Array)
            {
                var allowed = extEl.EnumerateArray()
                    .Select(e => e.GetString() ?? string.Empty)
                    .Where(s => !string.IsNullOrWhiteSpace(s))
                    .ToHashSet(StringComparer.OrdinalIgnoreCase);
                if (allowed.Count > 0 && !allowed.Contains(newExtension))
                {
                    throw new UseCaseException(
                        ApplicationErrorKind.Validation,
                        "Dinh dang file khong phu hop voi loai minh chung.",
                        "evidence_extension_not_allowed");
                }
            }
        }
        catch (UseCaseException)
        {
            throw;
        }
        catch (JsonException)
        {
            // Policy loi: fallback ve guard mac dinh.
            EnsureExtensionAllowed("file" + newExtension);
            EnsureSizeAllowed(newFileBytes);
        }
    }
}
