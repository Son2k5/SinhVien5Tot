using SV5T.Application.Common.Exceptions;

namespace SV5T.Application.Common.Security;

public static class FileSignatureValidator
{
    private static readonly byte[] PngHeader = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];

    public static bool IsValidImageSignature(byte[] header, int bytesRead)
    {
        if (bytesRead < 3) return false;

        // JPEG: FF D8 FF
        var isJpeg = bytesRead >= 3 && header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF;
        if (isJpeg) return true;

        // PNG: 89 50 4E 47 0D 0A 1A 0A
        var isPng = bytesRead >= 8 && header.AsSpan(0, 8).SequenceEqual(PngHeader);
        if (isPng) return true;

        // WebP: RIFF .... WEBP
        var isWebp = bytesRead >= 12 &&
                     header.AsSpan(0, 4).SequenceEqual("RIFF"u8) &&
                     header.AsSpan(8, 4).SequenceEqual("WEBP"u8);
        if (isWebp) return true;

        return false;
    }

    public static void EnsureValidImageSignature(byte[] header, int bytesRead)
    {
        if (!IsValidImageSignature(header, bytesRead))
        {
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP.",
                "unsupported_avatar_format");
        }
    }
}
