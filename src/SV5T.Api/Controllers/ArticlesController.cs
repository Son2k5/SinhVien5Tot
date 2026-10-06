using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SV5T.Application.Articles;
using SV5T.Domain.Articles;

namespace SV5T.Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/articles")]
public sealed class ArticlesController(ISender sender) : ControllerBase
{
    [HttpGet]
    [ResponseCache(Duration = 60, Location = ResponseCacheLocation.Any)]
    [ProducesResponseType<PagedResponse<ArticleListItemResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResponse<ArticleListItemResponse>>> GetPublished(
        [FromQuery] ArticleCategory? category,
        [FromQuery] string? q,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12,
        CancellationToken cancellationToken = default) =>
        Ok(await sender.Send(
            new GetPublishedArticlesQuery(category, q, page, pageSize),
            cancellationToken));

    [HttpGet("{id:guid}")]
    [ResponseCache(Duration = 60, Location = ResponseCacheLocation.Any)]
    [ProducesResponseType<ArticleDetailResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ArticleDetailResponse>> GetById(
        Guid id,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(new GetPublishedArticleByIdQuery(id), cancellationToken));
}
