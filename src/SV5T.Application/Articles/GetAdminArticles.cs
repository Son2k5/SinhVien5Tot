using FluentValidation;
using MediatR;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Domain.Articles;

namespace SV5T.Application.Articles;

public sealed record GetAdminArticlesQuery(
    ArticleStatus? Status,
    ArticleCategory? Category,
    string? Q,
    int Page = 1,
    int PageSize = 20) : IRequest<PagedResponse<AdminArticleListItemResponse>>;

public sealed record GetAdminArticleByIdQuery(Guid Id) : IRequest<AdminArticleDetailResponse>;

public sealed class GetAdminArticlesQueryValidator : AbstractValidator<GetAdminArticlesQuery>
{
    public GetAdminArticlesQueryValidator()
    {
        RuleFor(x => x.Status).IsInEnum().When(x => x.Status.HasValue);
        RuleFor(x => x.Category).IsInEnum().When(x => x.Category.HasValue);
        RuleFor(x => x.Q).MaximumLength(200);
        RuleFor(x => x.Page).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 50);
    }
}

public sealed class GetAdminArticleByIdQueryValidator : AbstractValidator<GetAdminArticleByIdQuery>
{
    public GetAdminArticleByIdQueryValidator() => RuleFor(x => x.Id).NotEmpty();
}

public sealed class GetAdminArticlesHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<GetAdminArticlesQuery, PagedResponse<AdminArticleListItemResponse>>
{
    public Task<PagedResponse<AdminArticleListItemResponse>> Handle(
        GetAdminArticlesQuery request,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var query = unitOfWork.QueryArticles();
        if (request.Status.HasValue)
            query = query.Where(x => x.Status == request.Status.Value);
        if (request.Category.HasValue)
            query = query.Where(x => x.Category == request.Category.Value);
        if (!string.IsNullOrWhiteSpace(request.Q))
            query = unitOfWork.FilterArticleTitle(query, request.Q.Trim());

        var total = query.Count();
        var projected =
            from article in query
            join cover in unitOfWork.QueryArticleImages()
                on new { ImageId = article.CoverImageId, ArticleId = (Guid?)article.Id }
                equals new { ImageId = (Guid?)cover.Id, cover.ArticleId } into covers
            from cover in covers.DefaultIfEmpty()
            select new
            {
                Article = article,
                Cover = cover
            };
        var rows = projected
            .OrderByDescending(x => x.Article.UpdatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(x => new
            {
                x.Article.Id,
                x.Article.Title,
                x.Article.Excerpt,
                x.Article.Category,
                x.Article.Status,
                x.Article.IsPinned,
                x.Article.PublishedAt,
                AuthorName = x.Article.Author.DisplayName,
                x.Article.CreatedAt,
                x.Article.UpdatedAt,
                x.Article.RowVersion,
                x.Article.CoverImageId,
                CoverId = x.Cover == null ? (Guid?)null : x.Cover.Id,
                CoverUrl = x.Cover == null ? null : x.Cover.Url,
                CoverWidth = x.Cover == null ? (int?)null : x.Cover.Width,
                CoverHeight = x.Cover == null ? (int?)null : x.Cover.Height
            })
            .ToList();
        var items = rows.Select(x => new AdminArticleListItemResponse(
            x.Id,
            x.Title,
            x.Excerpt,
            x.Category,
            x.Status,
            x.IsPinned,
            x.PublishedAt,
            x.AuthorName ?? "Người dùng",
            x.CoverId.HasValue
                ? new ArticleImageResponse(
                    x.CoverId.Value,
                    x.CoverUrl!,
                    x.CoverWidth!.Value,
                    x.CoverHeight!.Value)
                : null,
            x.CreatedAt,
            x.UpdatedAt,
            Convert.ToBase64String(x.RowVersion),
            x.CoverImageId)).ToList();

        return Task.FromResult(new PagedResponse<AdminArticleListItemResponse>(
            items,
            request.Page,
            request.PageSize,
            total));
    }
}

public sealed class GetAdminArticleByIdHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<GetAdminArticleByIdQuery, AdminArticleDetailResponse>
{
    public Task<AdminArticleDetailResponse> Handle(
        GetAdminArticleByIdQuery request,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return Task.FromResult(ArticleQueries.GetAdminDetail(unitOfWork, request.Id));
    }
}

internal static class ArticleQueries
{
    internal static AdminArticleDetailResponse GetAdminDetail(IUnitOfWork unitOfWork, Guid id)
    {
        var article = (
            from source in unitOfWork.QueryArticles()
            where source.Id == id
            join cover in unitOfWork.QueryArticleImages()
                on new { ImageId = source.CoverImageId, ArticleId = (Guid?)source.Id }
                equals new { ImageId = (Guid?)cover.Id, cover.ArticleId } into covers
            from cover in covers.DefaultIfEmpty()
            select new
            {
                source.Id,
                source.Title,
                source.Excerpt,
                source.ContentJson,
                source.Category,
                source.Status,
                source.IsPinned,
                source.PublishedAt,
                AuthorName = source.Author.DisplayName,
                source.CreatedAt,
                source.UpdatedAt,
                source.RowVersion,
                source.CoverImageId,
                CoverId = cover == null ? (Guid?)null : cover.Id,
                CoverUrl = cover == null ? null : cover.Url,
                CoverWidth = cover == null ? (int?)null : cover.Width,
                CoverHeight = cover == null ? (int?)null : cover.Height
            })
            .SingleOrDefault()
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy bài viết.",
                "article_not_found");

        var blocks = ArticleContent.Deserialize(article.ContentJson);
        var imageIds = ArticleContent.ExtractImageIds(blocks);
        var images = unitOfWork.QueryArticleImages()
            .Where(x => imageIds.Contains(x.Id) && x.ArticleId == article.Id)
            .Select(x => new ArticleImageResponse(x.Id, x.Url, x.Width, x.Height))
            .ToDictionary(x => x.Id);

        return new AdminArticleDetailResponse(
            article.Id,
            article.Title,
            article.Excerpt,
            article.Category,
            article.Status,
            article.IsPinned,
            article.PublishedAt,
            article.AuthorName ?? "Người dùng",
            article.CoverId.HasValue
                ? new ArticleImageResponse(
                    article.CoverId.Value,
                    article.CoverUrl!,
                    article.CoverWidth!.Value,
                    article.CoverHeight!.Value)
                : null,
            ArticleDtoMapping.ResolveBlocks(blocks, images),
            article.CreatedAt,
            article.UpdatedAt,
            Convert.ToBase64String(article.RowVersion),
            article.CoverImageId);
    }
}
