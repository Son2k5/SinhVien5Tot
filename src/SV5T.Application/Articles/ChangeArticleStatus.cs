using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Notifications;
using SV5T.Domain.Articles;
using SV5T.Domain.Notifications;

namespace SV5T.Application.Articles;

public sealed record PublishArticleCommand(Guid Id) : IRequest<AdminArticleDetailResponse>;
public sealed record UnpublishArticleCommand(Guid Id) : IRequest<AdminArticleDetailResponse>;
public sealed record ArchiveArticleCommand(Guid Id) : IRequest<AdminArticleDetailResponse>;
public sealed record RestoreArticleCommand(Guid Id) : IRequest<AdminArticleDetailResponse>;

public sealed class PublishArticleCommandValidator : AbstractValidator<PublishArticleCommand>
{
    public PublishArticleCommandValidator() => RuleFor(x => x.Id).NotEmpty();
}
public sealed class UnpublishArticleCommandValidator : AbstractValidator<UnpublishArticleCommand>
{
    public UnpublishArticleCommandValidator() => RuleFor(x => x.Id).NotEmpty();
}
public sealed class ArchiveArticleCommandValidator : AbstractValidator<ArchiveArticleCommand>
{
    public ArchiveArticleCommandValidator() => RuleFor(x => x.Id).NotEmpty();
}
public sealed class RestoreArticleCommandValidator : AbstractValidator<RestoreArticleCommand>
{
    public RestoreArticleCommandValidator() => RuleFor(x => x.Id).NotEmpty();
}

public sealed class ChangeArticleStatusHandler(
    IUnitOfWork unitOfWork,
    INotificationQueue notificationQueue,
    ILogger<ChangeArticleStatusHandler> logger)
    : IRequestHandler<PublishArticleCommand, AdminArticleDetailResponse>,
      IRequestHandler<UnpublishArticleCommand, AdminArticleDetailResponse>,
      IRequestHandler<ArchiveArticleCommand, AdminArticleDetailResponse>,
      IRequestHandler<RestoreArticleCommand, AdminArticleDetailResponse>
{
    public async Task<AdminArticleDetailResponse> Handle(
        PublishArticleCommand command,
        CancellationToken cancellationToken)
    {
        var article = GetArticle(command.Id);
        if (article.Status == ArticleStatus.Archived)
            throw InvalidTransition("Bài viết đã lưu trữ phải được khôi phục trước khi đăng.");

        if (article.Status != ArticleStatus.Published)
        {
            if (string.IsNullOrWhiteSpace(article.Title))
                throw InvalidTransition("Bài viết phải có tiêu đề trước khi đăng.");
            ArticleContent.EnsurePublishable(ArticleContent.Deserialize(article.ContentJson));
        }

        var firstPublication = article.Publish(DateTime.UtcNow);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        if (firstPublication)
        {
            try
            {
                var body = article.Title.Length <= 100
                    ? article.Title
                    : article.Title[..100];
                if (!notificationQueue.TryEnqueue(new NotificationJob(
                    NotificationType.ArticlePublished,
                    NotificationTargetType.Article,
                    article.Id,
                    null,
                    NotificationAudience.AllStudents,
                    null,
                    "Bài viết mới",
                    body,
                    $"ArticlePublished:{article.Id}")))
                {
                    logger.LogWarning(
                        "Could not enqueue publication notification for article {ArticleId}.",
                        article.Id);
                }
            }
            catch (Exception exception)
            {
                logger.LogError(
                    exception,
                    "Failed to enqueue publication notification for article {ArticleId}.",
                    article.Id);
            }
        }

        return ArticleQueries.GetAdminDetail(unitOfWork, article.Id);
    }

    public async Task<AdminArticleDetailResponse> Handle(
        UnpublishArticleCommand command,
        CancellationToken cancellationToken)
    {
        var article = GetArticle(command.Id);
        if (article.Status != ArticleStatus.Published)
            throw InvalidTransition("Chỉ bài đang đăng mới có thể chuyển về bản nháp.");
        article.Unpublish(DateTime.UtcNow);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return ArticleQueries.GetAdminDetail(unitOfWork, article.Id);
    }

    public async Task<AdminArticleDetailResponse> Handle(
        ArchiveArticleCommand command,
        CancellationToken cancellationToken)
    {
        var article = GetArticle(command.Id);
        if (article.Status == ArticleStatus.Archived)
            throw InvalidTransition("Bài viết đã ở trạng thái lưu trữ.");
        article.Archive(DateTime.UtcNow);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return ArticleQueries.GetAdminDetail(unitOfWork, article.Id);
    }

    public async Task<AdminArticleDetailResponse> Handle(
        RestoreArticleCommand command,
        CancellationToken cancellationToken)
    {
        var article = GetArticle(command.Id);
        if (article.Status != ArticleStatus.Archived)
            throw InvalidTransition("Chỉ bài đã lưu trữ mới có thể khôi phục.");
        article.Restore(DateTime.UtcNow);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return ArticleQueries.GetAdminDetail(unitOfWork, article.Id);
    }

    private Article GetArticle(Guid id) =>
        unitOfWork.QueryArticles(tracking: true).SingleOrDefault(x => x.Id == id)
        ?? throw new UseCaseException(
            ApplicationErrorKind.NotFound,
            "Không tìm thấy bài viết.",
            "article_not_found");

    private static UseCaseException InvalidTransition(string message) => new(
        ApplicationErrorKind.Validation,
        message,
        "invalid_article_status_transition");
}
