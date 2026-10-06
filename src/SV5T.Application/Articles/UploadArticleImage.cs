using FluentValidation;
using MediatR;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Common.Security;
using SV5T.Domain.Articles;

namespace SV5T.Application.Articles;

public sealed record UploadArticleImageCommand(
    Stream Content,
    string FileName,
    string ContentType,
    long Length) : IRequest<ArticleImageResponse>;

public sealed class UploadArticleImageCommandValidator
    : AbstractValidator<UploadArticleImageCommand>
{
    public UploadArticleImageCommandValidator()
    {
        RuleFor(x => x.Content).NotNull();
        RuleFor(x => x.FileName).NotEmpty().MaximumLength(255);
        RuleFor(x => x.Length).InclusiveBetween(1, 5 * 1024 * 1024)
            .WithMessage("Ảnh bài viết phải có dung lượng từ 1 byte đến 5 MB.");
    }
}

public sealed class UploadArticleImageHandler(
    IUnitOfWork unitOfWork,
    IArticleImageStorage storage,
    ICurrentUser currentUser)
    : IRequestHandler<UploadArticleImageCommand, ArticleImageResponse>
{
    private const long MaxImageBytes = 5 * 1024 * 1024;

    public async Task<ArticleImageResponse> Handle(
        UploadArticleImageCommand command,
        CancellationToken cancellationToken)
    {
        var userId = ArticleEditRules.RequireUserId(currentUser);
        if (command.Length is <= 0 or > MaxImageBytes)
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "Ảnh bài viết phải có dung lượng từ 1 byte đến 5 MB.",
                "invalid_article_image_size");

        var header = new byte[12];
        var bytesRead = 0;
        while (bytesRead < header.Length)
        {
            var read = await command.Content.ReadAsync(
                header.AsMemory(bytesRead, header.Length - bytesRead),
                cancellationToken);
            if (read == 0) break;
            bytesRead += read;
        }
        FileSignatureValidator.EnsureValidImageSignature(header, bytesRead);
        var actualContentType = DetectContentType(header, bytesRead);
        if (!command.Content.CanSeek)
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "Luồng ảnh tải lên không hỗ trợ kiểm tra an toàn.",
                "invalid_article_image_stream");
        command.Content.Position = 0;

        var orphanCount = unitOfWork.QueryArticleImages()
            .Count(x => x.UploadedByUserId == userId && x.ArticleId == null);
        if (orphanCount > 50)
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "Bạn có quá nhiều ảnh chưa sử dụng",
                "too_many_unused_article_images");

        var stored = await storage.UploadAsync(
            command.Content,
            command.FileName,
            actualContentType,
            cancellationToken);
        var image = new ArticleImage
        {
            UploadedByUserId = userId,
            StorageKey = stored.StorageKey,
            Url = stored.Url,
            Width = stored.Width,
            Height = stored.Height,
            SizeBytes = stored.SizeBytes,
            ContentType = actualContentType,
            CreatedAt = DateTime.UtcNow
        };

        try
        {
            unitOfWork.AddArticleImage(image);
            await unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            try
            {
                await storage.DeleteAsync(stored.StorageKey, CancellationToken.None);
            }
            catch
            {
                // Best effort: the cleanup worker cannot see a row that was not inserted.
            }
            throw;
        }

        return new ArticleImageResponse(image.Id, image.Url, image.Width, image.Height);
    }

    private static string DetectContentType(byte[] header, int bytesRead)
    {
        if (bytesRead >= 3 && header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF)
            return "image/jpeg";
        if (bytesRead >= 8 && header.AsSpan(0, 8)
                .SequenceEqual(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }))
            return "image/png";
        return "image/webp";
    }
}
