using FluentValidation;
using MediatR;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Domain.Articles;

namespace SV5T.Application.Articles;

public sealed record UpdateArticleCommand(
    Guid Id,
    string Title,
    ArticleCategory Category,
    string? Excerpt,
    bool IsPinned,
    Guid? CoverImageId,
    IReadOnlyList<ArticleBlockDto> Blocks,
    string RowVersion) : IRequest<AdminArticleDetailResponse>;

public sealed class UpdateArticleCommandValidator : AbstractValidator<UpdateArticleCommand>
{
    public UpdateArticleCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Category).IsInEnum();
        RuleFor(x => x.Excerpt).MaximumLength(300);
        RuleFor(x => x.RowVersion).NotEmpty();
        RuleFor(x => x.Blocks).NotNull().SetValidator(new ArticleBlocksValidator());
    }
}

public sealed class UpdateArticleHandler(
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser) : IRequestHandler<UpdateArticleCommand, AdminArticleDetailResponse>
{
    public async Task<AdminArticleDetailResponse> Handle(
        UpdateArticleCommand command,
        CancellationToken cancellationToken)
    {
        var userId = ArticleEditRules.RequireUserId(currentUser);
        var article = unitOfWork.QueryArticles(tracking: true)
            .SingleOrDefault(x => x.Id == command.Id)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy bài viết.",
                "article_not_found");

        var clientRowVersion = ArticleEditRules.ParseRowVersion(command.RowVersion);
        if (article.RowVersion.Length > 0 && !article.RowVersion.SequenceEqual(clientRowVersion))
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Bài viết đã được cập nhật bởi người khác. Vui lòng tải lại và thử lại.",
                "concurrency_conflict");
        unitOfWork.SetArticleOriginalRowVersion(article, clientRowVersion);

        var referencedIds = ArticleContent.ExtractImageIds(command.Blocks).ToHashSet();
        if (command.CoverImageId.HasValue)
            referencedIds.Add(command.CoverImageId.Value);

        var images = unitOfWork.QueryArticleImages(tracking: true)
            .Where(x => x.ArticleId == article.Id || referencedIds.Contains(x.Id))
            .ToList();
        var referencedImages = images.Where(x => referencedIds.Contains(x.Id)).ToList();
        ArticleEditRules.EnsureImagesCanBeAttached(
            referencedIds,
            referencedImages,
            userId,
            article.Id,
            command.CoverImageId);

        foreach (var image in images)
            image.ArticleId = referencedIds.Contains(image.Id) ? article.Id : null;

        article.ApplyEdit(
            command.Title,
            ArticleEditRules.ResolveExcerpt(command.Excerpt, command.Blocks),
            ArticleContent.Serialize(command.Blocks),
            command.Category,
            command.IsPinned,
            command.CoverImageId,
            DateTime.UtcNow);

        await unitOfWork.SaveChangesAsync(cancellationToken);
        return ArticleQueries.GetAdminDetail(unitOfWork, article.Id);
    }
}
