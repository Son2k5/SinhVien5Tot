using MediatR;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Common.Models;
using SV5T.Application.Student.Abstractions;
using SV5T.Application.Student.Dtos;
using SV5T.Domain.Submissions.Enums;

namespace SV5T.Application.Student.Applications.Queries.GetMyApplications;

public sealed class GetMyApplicationsHandler(
    IStudentApplicationRepository repository,
    ICurrentUser currentUser)
    : IRequestHandler<GetMyApplicationsQuery, PagedResult<StudentApplicationSummaryResponse>>
{
    private const int DefaultPageSize = 20;
    private const int MaxPageSize = 100;

    public async Task<PagedResult<StudentApplicationSummaryResponse>> Handle(
        GetMyApplicationsQuery request,
        CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId
            ?? throw new UseCaseException(
                ApplicationErrorKind.Unauthorized,
                "Phien dang nhap khong hop le.",
                "invalid_session");

        var pageIndex = request.PageIndex < 1 ? 1 : request.PageIndex;
        var pageSize = request.PageSize is < 1 or > MaxPageSize ? DefaultPageSize : request.PageSize;

        var paged = await repository.GetPagedByUserAsync(userId, pageIndex, pageSize, cancellationToken);

        var items = paged.Items
            .Where(a => !request.Status.HasValue || a.Status == request.Status.Value)
            .Select(a => new StudentApplicationSummaryResponse(
                a.Id,
                a.ApplicationCode,
                a.CampaignId,
                a.Campaign?.Name ?? string.Empty,
                a.Campaign?.SchoolYear ?? string.Empty,
                a.Status,
                a.CreatedAt,
                a.SubmittedAt,
                a.UpdatedAt,
                a.Evidences.Count,
                a.Evidences.Count(e => e.Status == EvidenceStatus.Approved),
                a.Evidences.Count(e => e.Status is EvidenceStatus.Draft or EvidenceStatus.NeedsRevision or EvidenceStatus.Submitted)))
            .ToList();

        return new PagedResult<StudentApplicationSummaryResponse>(
            items, paged.TotalCount, paged.PageIndex, paged.PageSize);
    }
}
