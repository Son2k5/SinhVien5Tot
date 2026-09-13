using MediatR;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Admin.Students.Abstractions;
using SV5T.Domain.Standards.Enums;
using SV5T.Domain.Submissions.Enums;

namespace SV5T.Application.Admin.Students.Queries.GetStudentById;

public sealed class GetStudentByIdHandler(IAdminStudentRepository repository)
    : IRequestHandler<GetStudentByIdQuery, AdminStudentDetailResponse?>
{
    public async Task<AdminStudentDetailResponse?> Handle(
        GetStudentByIdQuery request,
        CancellationToken cancellationToken
    )
    {
        var user = await repository.GetByIdAsync(request.Id, tracking: false, includeDeleted: true, cancellationToken);
        if (user is null || user.Role != SV5T.Domain.Users.Enums.Role.User)
        {
            return null;
        }

        var applications = await repository.GetApplicationsAsync(user.Id, cancellationToken);
        var evidences = await repository.GetEvidencesAsync(user.Id, cancellationToken);
        var reviewLogs = await repository.GetReviewLogsAsync(user.Id, cancellationToken);

        AdminStudentProfileResponse? profile = null;
        if (user.Profile is not null)
        {
            var p = user.Profile;
            var addresses = user.Addresses
                .OrderBy(a => a.AddressType)
                .Select(a => new AdminStudentAddressResponse(
                    a.AddressType,
                    a.ProvinceOrCity,
                    a.District,
                    a.StreetAddress
                ))
                .ToList();
            profile = new AdminStudentProfileResponse(
                p.FullName,
                p.BirthDate,
                p.Gender,
                p.IdentityCardNumber,
                p.Ethnicity,
                p.School,
                p.Major,
                p.AcademicYear,
                p.StudentCode,
                p.AdministrativeClass,
                p.Faculty,
                p.CurrentPosition,
                p.ContactEmail,
                p.PhoneNumber,
                p.UnionPosition,
                p.PoliticalStatus,
                addresses
            );
        }

        var applicationSummaries = applications
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new AdminStudentApplicationSummaryResponse(
                a.Id,
                a.ApplicationCode,
                a.CampaignId,
                a.Campaign?.Name ?? string.Empty,
                a.Campaign?.SchoolYear ?? string.Empty,
                a.Status,
                a.SubmittedAt,
                a.Evidences.Count,
                a.CreatedAt
            ))
            .ToList();

        var evidenceItems = evidences
            .Select(e => new AdminStudentEvidenceItemResponse(
                e.Id,
                e.ApplicationId,
                e.Application?.ApplicationCode ?? string.Empty,
                e.CriterionId,
                e.Criterion?.Code ?? string.Empty,
                e.Criterion?.Title ?? string.Empty,
                e.Criterion?.Standard?.GroupCode,
                ResolveGroupName(e.Criterion?.Standard?.GroupCode),
                e.Application?.CampaignId ?? Guid.Empty,
                e.Application?.Campaign?.Name ?? string.Empty,
                e.Status,
                e.ReviewerNote,
                e.ReviewedBy,
                e.ReviewedAt,
                Convert.ToBase64String(e.RowVersion),
                e.CreatedAt
            ))
            .ToList();

        var groups = new List<AdminStudentEvidenceGroupResponse>();
        foreach (StandardGroupCode code in Enum.GetValues<StandardGroupCode>())
        {
            var itemsInGroup = evidenceItems
                .Where(x => x.GroupCode == code)
                .OrderByDescending(x => x.CreatedAt)
                .ToList();
            if (itemsInGroup.Count == 0)
            {
                continue;
            }

            groups.Add(
                new AdminStudentEvidenceGroupResponse(
                    code,
                    ResolveGroupName(code),
                    itemsInGroup.Count,
                    itemsInGroup.Count(x => x.Status == EvidenceStatus.Approved),
                    itemsInGroup
                )
            );
        }

        var ungrouped = evidenceItems.Where(x => x.GroupCode is null).OrderByDescending(x => x.CreatedAt).ToList();
        if (ungrouped.Count > 0)
        {
            groups.Add(
                new AdminStudentEvidenceGroupResponse(
                    null,
                    "Chưa phân nhóm",
                    ungrouped.Count,
                    ungrouped.Count(x => x.Status == EvidenceStatus.Approved),
                    ungrouped
                )
            );
        }

        var logs = reviewLogs
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new AdminStudentReviewLogResponse(
                x.Id,
                x.ApplicationId,
                x.EvidenceId,
                x.Action,
                x.Note,
                x.ActorId,
                x.CreatedAt
            ))
            .ToList();

        return new AdminStudentDetailResponse(
            user.Id,
            user.Email,
            user.DisplayName,
            user.Role,
            user.AvatarUrl,
            user.IsVerified,
            user.IsActive,
            user.IsDeleted,
            user.DeletedAt,
            user.DeleteReason,
            user.CreatedAt,
            profile,
            applicationSummaries,
            groups,
            logs
        );
    }

    private static string ResolveGroupName(StandardGroupCode? code) =>
        code switch
        {
            StandardGroupCode.Ethics => "Đạo đức tốt",
            StandardGroupCode.Study => "Học tập tốt",
            StandardGroupCode.Fitness => "Thể lực tốt",
            StandardGroupCode.Volunteer => "Tình nguyện tốt",
            StandardGroupCode.Integration => "Hội nhập tốt",
            _ => "Chưa phân nhóm",
        };
}
