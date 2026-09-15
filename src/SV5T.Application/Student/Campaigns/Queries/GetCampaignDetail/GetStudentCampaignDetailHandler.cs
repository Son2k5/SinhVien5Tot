using MediatR;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Student.Abstractions;
using SV5T.Application.Student.Dtos;
using SV5T.Application.Student.Support;
using SV5T.Domain.Standards.Enums;

namespace SV5T.Application.Student.Campaigns.Queries.GetCampaignDetail;

public sealed class GetStudentCampaignDetailHandler(
    IStudentCampaignRepository campaigns,
    IStudentCriterionRepository criteria,
    IStudentEvidenceRepository evidences,
    IStudentApplicationRepository applications,
    ICurrentUser currentUser)
    : IRequestHandler<GetStudentCampaignDetailQuery, StudentCampaignDetailResponse?>
{
    public async Task<StudentCampaignDetailResponse?> Handle(
        GetStudentCampaignDetailQuery request,
        CancellationToken cancellationToken)
    {
        var campaign = await campaigns.GetByIdAsync(
            request.CampaignId, includeDetails: true, cancellationToken: cancellationToken);

        if (campaign is null)
        {
            return null;
        }

        var userId = currentUser.UserId
            ?? throw new UseCaseException(
                ApplicationErrorKind.Unauthorized,
                "Phiên đăng nhập không hợp lệ.",
                "invalid_session");

        var requirements = await criteria.GetRequirementsByStandardSetIdAsync(
            campaign.StandardSetId, cancellationToken);
        var allCriteriaById = requirements.ToDictionary(r => r.Id);

        var existingApp = await applications.GetByCampaignAndUserAsync(
            campaign.Id, userId, cancellationToken: cancellationToken);

        IReadOnlyList<Domain.Evidences.Evidence> existingEvidences =
            existingApp is null
                ? []
                : await evidences.GetByApplicationAsync(existingApp.Id, cancellationToken);

        var byCriterion = existingEvidences
            .GroupBy(e => e.CriterionId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var items = requirements
            .Where(c => c.Type == CriterionType.Requirement)
            .OrderBy(c => c.DisplayOrder)
            .Select(c =>
            {
                byCriterion.TryGetValue(c.Id, out var list);
                var first = list?.FirstOrDefault();
                return new StudentCriterionItemResponse(
                    c.Id,
                    c.StandardId,
                    c.Code,
                    c.Title,
                    c.Description,
                    c.Standard?.GroupCode.ToString() ?? string.Empty,
                    CriterionRequirementHelper.IsRequired(c, allCriteriaById),
                    c.DisplayOrder,
                    list?.Count ?? 0,
                    first?.Status.ToString());
            })
            .ToList();

        return new StudentCampaignDetailResponse(
            campaign.Id,
            campaign.Name,
            campaign.SchoolYear,
            campaign.Level,
            campaign.AwardType,
            campaign.Status,
            campaign.Description,
            campaign.RegOpenAt,
            campaign.RegCloseAt,
            campaign.SubmitDeadline,
            campaign.ReviewDeadline,
            campaign.IsRegistrationOpen(),
            campaign.StandardSetId,
            campaign.StandardSet is null
                ? null
                : new StudentStandardSetBriefResponse(
                    campaign.StandardSet.Id,
                    campaign.StandardSet.Name,
                    campaign.StandardSet.AcademicYear,
                    campaign.StandardSet.Level,
                    campaign.StandardSet.AwardType,
                    campaign.StandardSet.Version),
            items);
    }
}
