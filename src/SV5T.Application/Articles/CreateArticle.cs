using FluentValidation;
using MediatR;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Domain.Articles;

namespace SV5T.Application.Articles;

public sealed record CreateArticleCommand(
    string Title,
    ArticleCategory Category,
    string? Excerpt,
    bool IsPinned,
    Guid? CoverImageId,
    IReadOnlyList<ArticleBlockDto> Blocks) : IRequest<AdminArticleDetailResponse>;

public sealed class CreateArticleCommandValidator : AbstractValidator<CreateArticleCommand>
{
    public CreateArticleCommandValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Category).IsInEnum();
        RuleFor(x => x.Excerpt).MaximumLength(300);
        RuleFor(x => x.Blocks).NotNull().SetValidator(new ArticleBlocksValidator());
    }
}

public sealed class CreateArticleHandler(
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser) : IRequestHandler<CreateArticleCommand, AdminArticleDetailResponse>
{
    public async Task<AdminArticleDetailResponse> Handle(
        CreateArticleCommand command,
        CancellationToken cancellationToken)
    {
        var userId = ArticleEditRules.RequireUserId(currentUser);
        var now = DateTime.UtcNow;
        var article = Article.Create(
            command.Title,
            ArticleEditRules.ResolveExcerpt(command.Excerpt, command.Blocks),
            ArticleContent.Serialize(command.Blocks),
            command.Category,
            command.IsPinned,
            command.CoverImageId,
            userId,
            now);

        var referencedIds = ArticleContent.ExtractImageIds(command.Blocks).ToHashSet();
        if (command.CoverImageId.HasValue)
            referencedIds.Add(command.CoverImageId.Value);

        var images = unitOfWork.QueryArticleImages(tracking: true)
            .Where(x => referencedIds.Contains(x.Id))
            .ToList();
        ArticleEditRules.EnsureImagesCanBeAttached(
            referencedIds,
            images,
            userId,
            article.Id,
            command.CoverImageId);

        foreach (var image in images)
            image.ArticleId = article.Id;

        unitOfWork.AddArticle(article);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return ArticleQueries.GetAdminDetail(unitOfWork, article.Id);
    }
}

internal static class ArticleEditRules
{
    internal static Guid RequireUserId(ICurrentUser currentUser) =>
        currentUser.UserId ?? throw new UseCaseException(
            ApplicationErrorKind.Unauthorized,
            "Không xác định được danh tính người dùng hiện tại.",
            "invalid_session");

    internal static string ResolveExcerpt(
        string? excerpt,
        IReadOnlyList<ArticleBlockDto> blocks) =>
        string.IsNullOrWhiteSpace(excerpt)
            ? ArticleContent.DeriveExcerpt(blocks)
            : excerpt.Trim();

    internal static void EnsureImagesCanBeAttached(
        IReadOnlySet<Guid> requestedIds,
        IReadOnlyCollection<ArticleImage> loadedImages,
        Guid userId,
        Guid articleId,
        Guid? coverImageId)
    {
        if (loadedImages.Count != requestedIds.Count ||
            loadedImages.Any(x =>
                x.UploadedByUserId != userId && x.ArticleId != articleId))
        {
            throw InvalidImages();
        }

        if (coverImageId.HasValue && !requestedIds.Contains(coverImageId.Value))
            throw InvalidImages();
    }

    internal static UseCaseException InvalidImages() => new(
        ApplicationErrorKind.Validation,
        "Một hoặc nhiều ảnh của bài viết không hợp lệ.",
        "invalid_article_images");

    internal static byte[] ParseRowVersion(string rowVersion)
    {
        try
        {
            var value = Convert.FromBase64String(rowVersion);
            if (value.Length == 0) throw new FormatException();
            return value;
        }
        catch (FormatException)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "RowVersion không đúng định dạng Base64.",
                "invalid_row_version");
        }
    }
}
