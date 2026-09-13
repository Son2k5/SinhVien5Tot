using SV5T.Application.Common.Exceptions;
using SV5T.Application.Common.Security;
using Xunit;

namespace SV5T.UnitTests.Security;

public sealed class FileSignatureValidatorTests
{
    [Fact]
    public void IsValidImageSignature_ValidJpeg_ReturnsTrue()
    {
        byte[] header = [0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10];
        var isValid = FileSignatureValidator.IsValidImageSignature(header, header.Length);
        Assert.True(isValid);
        FileSignatureValidator.EnsureValidImageSignature(header, header.Length);
    }

    [Fact]
    public void IsValidImageSignature_ValidPng_ReturnsTrue()
    {
        byte[] header = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
        var isValid = FileSignatureValidator.IsValidImageSignature(header, header.Length);
        Assert.True(isValid);
        FileSignatureValidator.EnsureValidImageSignature(header, header.Length);
    }

    [Fact]
    public void IsValidImageSignature_ValidWebP_ReturnsTrue()
    {
        byte[] header = "RIFF\0\0\0\0WEBP"u8.ToArray();
        var isValid = FileSignatureValidator.IsValidImageSignature(header, header.Length);
        Assert.True(isValid);
        FileSignatureValidator.EnsureValidImageSignature(header, header.Length);
    }

    [Fact]
    public void IsValidImageSignature_InvalidExecutable_ReturnsFalseAndThrows()
    {
        byte[] header = "MZ\x90\0\x03\0\0\0"u8.ToArray(); // DOS/PE EXE
        var isValid = FileSignatureValidator.IsValidImageSignature(header, header.Length);
        Assert.False(isValid);

        var ex = Assert.Throws<UseCaseException>(() =>
            FileSignatureValidator.EnsureValidImageSignature(header, header.Length));
        Assert.Equal("unsupported_avatar_format", ex.ErrorCode);
    }

    [Fact]
    public void IsValidImageSignature_TooFewBytes_ReturnsFalse()
    {
        byte[] header = [0xFF, 0xD8];
        var isValid = FileSignatureValidator.IsValidImageSignature(header, 2);
        Assert.False(isValid);
    }
}
