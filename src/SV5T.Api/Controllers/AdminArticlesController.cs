using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SV5T.Application.Articles;
using SV5T.Application.Common.Exceptions;
using SV5T.Domain.Articles;

namespace SV5T.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/articles")]
public sealed class AdminArticlesController(ISender sender) : ControllerBase
{
    private const long MaxImageBytes = 5 * 1024 * 1024;
    private const long MaxImageRequestBytes = 6 * 1024 * 1024;

    [HttpGet]
    [ProducesResponseType<PagedResponse<AdminArticleListItemResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResponse<AdminArticleListItemResponse>>> GetAll(
        [FromQuery] ArticleStatus? status,
        [FromQuery] ArticleCategory? category,
        [FromQuery] string? q,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await sender.Send(
            new GetAdminArticlesQuery(status, category, q, page, pageSize),
            cancellationToken));

    [HttpGet("{id:guid}")]
    [ProducesResponseType<AdminArticleDetailResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminArticleDetailResponse>> GetById(
        Guid id,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(new GetAdminArticleByIdQuery(id), cancellationToken));

    [HttpPost]
    [ProducesResponseType<AdminArticleDetailResponse>(StatusCodes.Status201Created)]
    public async Task<ActionResult<AdminArticleDetailResponse>> Create(
        CreateArticleRequest request,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new CreateArticleCommand(
            request.Title,
            request.Category,
            request.Excerpt,
            request.IsPinned,
            request.CoverImageId,
            request.Blocks), cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType<AdminArticleDetailResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<AdminArticleDetailResponse>> Update(
        Guid id,
        UpdateArticleRequest request,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(new UpdateArticleCommand(
            id,
            request.Title,
            request.Category,
            request.Excerpt,
            request.IsPinned,
            request.CoverImageId,
            request.Blocks,
            request.RowVersion), cancellationToken));

    [HttpPost("{id:guid}/publish")]
    public async Task<ActionResult<AdminArticleDetailResponse>> Publish(
        Guid id,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(new PublishArticleCommand(id), cancellationToken));

    [HttpPost("{id:guid}/unpublish")]
    public async Task<ActionResult<AdminArticleDetailResponse>> Unpublish(
        Guid id,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(new UnpublishArticleCommand(id), cancellationToken));

    [HttpPost("{id:guid}/archive")]
    public async Task<ActionResult<AdminArticleDetailResponse>> Archive(
        Guid id,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(new ArchiveArticleCommand(id), cancellationToken));

    [HttpPost("{id:guid}/restore")]
    public async Task<ActionResult<AdminArticleDetailResponse>> Restore(
        Guid id,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(new RestoreArticleCommand(id), cancellationToken));

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(
        Guid id,
        CancellationToken cancellationToken)
    {
        await sender.Send(new DeleteArticleCommand(id), cancellationToken);
        return NoContent();
    }

    [HttpPost("images")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MaxImageRequestBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxImageRequestBytes)]
    [EnableRateLimiting("article-image-upload")]
    [ProducesResponseType<ArticleImageResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status413PayloadTooLarge)]
    public async Task<ActionResult<ArticleImageResponse>> UploadImage(
        [FromForm] UploadArticleImageForm form,
        CancellationToken cancellationToken)
    {
        var file = form.File;
        if (file is null || file.Length is <= 0 or > MaxImageBytes)
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "Ảnh bài viết phải có dung lượng từ 1 byte đến 5 MB.",
                "invalid_article_image_size");

        await using var stream = file.OpenReadStream();
        var result = await sender.Send(new UploadArticleImageCommand(
            stream,
            file.FileName,
            file.ContentType,
            file.Length), cancellationToken);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    public sealed record CreateArticleRequest(
        string Title,
        ArticleCategory Category,
        string? Excerpt,
        bool IsPinned,
        Guid? CoverImageId,
        IReadOnlyList<ArticleBlockDto> Blocks);

    public sealed record UpdateArticleRequest(
        string Title,
        ArticleCategory Category,
        string? Excerpt,
        bool IsPinned,
        Guid? CoverImageId,
        IReadOnlyList<ArticleBlockDto> Blocks,
        string RowVersion);

    public sealed class UploadArticleImageForm
    {
        [FromForm(Name = "file")]
        public IFormFile? File { get; set; }
    }
}
