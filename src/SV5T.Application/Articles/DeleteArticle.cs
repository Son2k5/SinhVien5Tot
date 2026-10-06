using FluentValidation;
using MediatR;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Domain.Articles;

namespace SV5T.Application.Articles;

public sealed record DeleteArticleCommand(Guid Id) : IRequest;

public sealed class DeleteArticleCommandValidator : AbstractValidator<DeleteArticleCommand>
{
    public DeleteArticleCommandValidator() => RuleFor(x => x.Id).NotEmpty();
}

public sealed class DeleteArticleHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<DeleteArticleCommand>
{
    public async Task Handle(DeleteArticleCommand command, CancellationToken cancellationToken)
    {
        var article = unitOfWork.QueryArticles(tracking: true)
            .SingleOrDefault(x => x.Id == command.Id)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy bài viết.",
                "article_not_found");

        if (article.Status != ArticleStatus.Draft || article.PublishedAt.HasValue)
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "Chỉ có thể xóa bài nháp chưa từng đăng. Hãy lưu trữ bài viết thay vì xóa.",
                "article_must_be_archived");

        var images = unitOfWork.QueryArticleImages(tracking: true)
            .Where(x => x.ArticleId == article.Id)
            .ToList();
        foreach (var image in images)
            image.ArticleId = null;

        article.ApplyEdit(
            article.Title,
            article.Excerpt,
            article.ContentJson,
            article.Category,
            article.IsPinned,
            null,
            DateTime.UtcNow);
        unitOfWork.RemoveArticle(article);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
