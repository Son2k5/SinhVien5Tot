using FluentValidation;
using MediatR;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Domain.Articles;

namespace SV5T.Application.Articles;

public sealed record GetPublishedArticlesQuery(
    ArticleCategory? Category,
    string? Q,
    int Page = 1,
    int PageSize = 12) : IRequest<PagedResponse<ArticleListItemResponse>>;

public sealed record GetPublishedArticleByIdQuery(Guid Id) : IRequest<ArticleDetailResponse>;

public sealed class GetPublishedArticlesQueryValidator
    : AbstractValidator<GetPublishedArticlesQuery>
{
    public GetPublishedArticlesQueryValidator()
    {
        RuleFor(x => x.Category).IsInEnum().When(x => x.Category.HasValue);
        RuleFor(x => x.Q).MaximumLength(200);
        RuleFor(x => x.Page).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 24);
    }
}

public sealed class GetPublishedArticleByIdQueryValidator
    : AbstractValidator<GetPublishedArticleByIdQuery>
{
    public GetPublishedArticleByIdQueryValidator() => RuleFor(x => x.Id).NotEmpty();
}

public sealed class GetPublishedArticlesHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<GetPublishedArticlesQuery, PagedResponse<ArticleListItemResponse>>
{
    public Task<PagedResponse<ArticleListItemResponse>> Handle(
        GetPublishedArticlesQuery request,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var query = unitOfWork.QueryArticles()
            .Where(x => x.Status == ArticleStatus.Published);
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
            .OrderByDescending(x => x.Article.IsPinned)
            .ThenByDescending(x => x.Article.PublishedAt)
            .ThenByDescending(x => x.Article.Id)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(x => new
            {
                x.Article.Id,
                x.Article.Title,
                x.Article.Excerpt,
                x.Article.Category,
                x.Article.IsPinned,
                x.Article.PublishedAt,
                AuthorName = x.Article.Author.DisplayName,
                CoverId = x.Cover == null ? (Guid?)null : x.Cover.Id,
                CoverUrl = x.Cover == null ? null : x.Cover.Url,
                CoverWidth = x.Cover == null ? (int?)null : x.Cover.Width,
                CoverHeight = x.Cover == null ? (int?)null : x.Cover.Height
            })
            .ToList();
        var items = rows.Select(x => new ArticleListItemResponse(
            x.Id,
            x.Title,
            x.Excerpt,
            x.Category,
            x.IsPinned,
            x.PublishedAt,
            x.AuthorName ?? "Người dùng",
            x.CoverId.HasValue
                ? new ArticleImageResponse(
                    x.CoverId.Value,
                    x.CoverUrl!,
                    x.CoverWidth!.Value,
                    x.CoverHeight!.Value)
                : null)).ToList();

        return Task.FromResult(new PagedResponse<ArticleListItemResponse>(
            items,
            request.Page,
            request.PageSize,
            total));
    }
}

public sealed class GetPublishedArticleByIdHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<GetPublishedArticleByIdQuery, ArticleDetailResponse>
{
    public Task<ArticleDetailResponse> Handle(
        GetPublishedArticleByIdQuery request,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var article = (
            from source in unitOfWork.QueryArticles()
            where source.Id == request.Id && source.Status == ArticleStatus.Published
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
                source.IsPinned,
                source.PublishedAt,
                AuthorName = source.Author.DisplayName,
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

        return Task.FromResult(new ArticleDetailResponse(
            article.Id,
            article.Title,
            article.Excerpt,
            article.Category,
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
            ArticleDtoMapping.ResolveBlocks(blocks, images)));
    }
}
