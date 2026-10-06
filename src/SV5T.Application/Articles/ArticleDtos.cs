using SV5T.Domain.Articles;

namespace SV5T.Application.Articles;

public sealed record ArticleImageResponse(Guid Id, string Url, int Width, int Height);

public sealed record ArticleBlockResponse(
    string Type,
    int? Level,
    string? Text,
    IReadOnlyList<string>? Items,
    Guid? ImageId,
    string? Url,
    int? Width,
    int? Height,
    string? Alt,
    string? Caption);

public record ArticleListItemResponse(
    Guid Id,
    string Title,
    string Excerpt,
    ArticleCategory Category,
    bool IsPinned,
    DateTime? PublishedAt,
    string AuthorName,
    ArticleImageResponse? CoverImage);

public record ArticleDetailResponse(
    Guid Id,
    string Title,
    string Excerpt,
    ArticleCategory Category,
    bool IsPinned,
    DateTime? PublishedAt,
    string AuthorName,
    ArticleImageResponse? CoverImage,
    IReadOnlyList<ArticleBlockResponse> Blocks);

public sealed record AdminArticleListItemResponse(
    Guid Id,
    string Title,
    string Excerpt,
    ArticleCategory Category,
    ArticleStatus Status,
    bool IsPinned,
    DateTime? PublishedAt,
    string AuthorName,
    ArticleImageResponse? CoverImage,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    string RowVersion,
    Guid? CoverImageId);

public sealed record AdminArticleDetailResponse(
    Guid Id,
    string Title,
    string Excerpt,
    ArticleCategory Category,
    ArticleStatus Status,
    bool IsPinned,
    DateTime? PublishedAt,
    string AuthorName,
    ArticleImageResponse? CoverImage,
    IReadOnlyList<ArticleBlockResponse> Blocks,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    string RowVersion,
    Guid? CoverImageId);

public sealed record PagedResponse<T>(IReadOnlyList<T> Items, int Page, int PageSize, int Total);

internal static class ArticleDtoMapping
{
    internal static IReadOnlyList<ArticleBlockResponse> ResolveBlocks(
        IReadOnlyList<ArticleBlockDto> blocks,
        IReadOnlyDictionary<Guid, ArticleImageResponse> images) =>
        blocks.Select(block =>
        {
            images.TryGetValue(block.ImageId ?? Guid.Empty, out var image);
            return new ArticleBlockResponse(
                block.Type,
                block.Level,
                block.Text,
                block.Items,
                block.ImageId,
                image?.Url,
                image?.Width,
                image?.Height,
                block.Alt,
                block.Caption);
        }).ToList();
}
