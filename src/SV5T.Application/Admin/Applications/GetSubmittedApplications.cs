using MediatR;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Student.Abstractions;
using SV5T.Domain.Submissions.Enums;

namespace SV5T.Application.Admin.Applications;

public sealed record GetSubmittedApplicationsQuery(Guid? CampaignId, SubmissionStatus? Status,
    int PageIndex, int PageSize) : IRequest<PagedResponse<ReviewApplicationResponse>>;

public sealed class GetSubmittedApplicationsHandler(IReviewApplicationRepository applications,
    IStudentCriterionRepository criteria) : IRequestHandler<GetSubmittedApplicationsQuery, PagedResponse<ReviewApplicationResponse>>
{
    public async Task<PagedResponse<ReviewApplicationResponse>> Handle(GetSubmittedApplicationsQuery request, CancellationToken ct)
    {
        var page = Math.Max(1, request.PageIndex);
        var size = request.PageSize is > 0 and <= 100 ? request.PageSize : 20;
        var data = await applications.GetSubmittedPagedAsync(request.CampaignId, request.Status, page, size, ct);
        var items = new List<ReviewApplicationResponse>();
        var criterionCache = new Dictionary<Guid, IReadOnlyList<SV5T.Domain.Criteria.Criterion>>();
        foreach (var app in data.Items)
        {
            if (!criterionCache.TryGetValue(app.StandardSetId, out var all))
            {
                all = await criteria.GetRequirementsByStandardSetIdAsync(app.StandardSetId, ct);
                criterionCache[app.StandardSetId] = all;
            }
            items.Add(ApplicationReviewSupport.Map(app, ApplicationReviewSupport.Progress(app, all)));
        }
        return new PagedResponse<ReviewApplicationResponse>(items, data.TotalCount,
            data.PageIndex, data.PageSize, data.TotalPages);
    }
}
