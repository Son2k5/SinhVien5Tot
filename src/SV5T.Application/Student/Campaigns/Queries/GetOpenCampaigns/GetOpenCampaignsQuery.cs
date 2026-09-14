using MediatR;
using SV5T.Application.Common.Models;
using SV5T.Application.Student.Abstractions;
using SV5T.Application.Student.Dtos;
using SV5T.Domain.Awards.Enums;
using SV5T.Domain.Campaigns.Enums;

namespace SV5T.Application.Student.Campaigns.Queries.GetOpenCampaigns;

public sealed record GetOpenCampaignsQuery(
    AwardLevel? Level,
    string? SchoolYear,
    int PageIndex = 1,
    int PageSize = 20) : IRequest<PagedResult<StudentCampaignListItemResponse>>;

public sealed class GetOpenCampaignsHandler(IStudentCampaignRepository repository)
    : IRequestHandler<GetOpenCampaignsQuery, PagedResult<StudentCampaignListItemResponse>>
{
    private const int DefaultPageSize = 20;
    private const int MaxPageSize = 100;

    public async Task<PagedResult<StudentCampaignListItemResponse>> Handle(
        GetOpenCampaignsQuery request,
        CancellationToken cancellationToken)
    {
        var pageIndex = request.PageIndex < 1 ? 1 : request.PageIndex;
        var pageSize = request.PageSize is < 1 or > MaxPageSize ? DefaultPageSize : request.PageSize;

        // Repo chi tra ve campaign Open + trong window dang ky.
        // Loc them theo Level/SchoolYear tai handler de giu repo don gian.
        var paged = await repository.GetOpenPagedAsync(pageIndex, pageSize, cancellationToken);

        var items = paged.Items
            .Where(c =>
                (!request.Level.HasValue || c.Level == request.Level.Value) &&
                (string.IsNullOrWhiteSpace(request.SchoolYear) ||
                 string.Equals(c.SchoolYear, request.SchoolYear.Trim(), StringComparison.OrdinalIgnoreCase)))
            .Select(c => new StudentCampaignListItemResponse(
                c.Id,
                c.Name,
                c.SchoolYear,
                c.Level,
                c.AwardType,
                c.Status,
                c.Description,
                c.RegOpenAt,
                c.RegCloseAt,
                c.SubmitDeadline,
                c.ReviewDeadline,
                c.IsRegistrationOpen(),
                c.StandardSetId,
                c.StandardSet?.Name ?? c.StandardSet?.AcademicYear))
            .ToList();

        return new PagedResult<StudentCampaignListItemResponse>(
            items,
            paged.TotalCount,
            paged.PageIndex,
            paged.PageSize);
    }
}
