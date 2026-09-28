using SV5T.Application.Student.Abstractions;
using SV5T.Application.Student.Support;
using SV5T.Domain.Criteria;
using SV5T.Domain.Standards.Enums;
using SV5T.Domain.Submissions.Enums;
using SubmissionApplication = SV5T.Domain.Submissions.Application;

namespace SV5T.Application.Admin.Applications;

internal static class ApplicationReviewSupport
{
    public static async Task<IReadOnlyList<StandardProgress>> ProgressAsync(
        SubmissionApplication app, IStudentCriterionRepository criteria, CancellationToken ct)
    {
        var all = await criteria.GetRequirementsByStandardSetIdAsync(app.StandardSetId, ct);
        return Progress(app, all);
    }

    public static IReadOnlyList<StandardProgress> Progress(
        SubmissionApplication app, IReadOnlyList<Criterion> all)
    {
        var byId = all.ToDictionary(c => c.Id);
        var required = all.Where(c => c.Type == CriterionType.Requirement &&
            CriterionRequirementHelper.IsRequired(c, byId)).ToList();
        var approved = app.Evidences.Where(e => e.Status == EvidenceStatus.Approved)
            .Select(e => e.CriterionId).ToHashSet();
        return Enum.GetValues<StandardGroupCode>().Select(group =>
        {
            var groupCriteria = all.Where(c => c.Type == CriterionType.Requirement &&
                c.Standard?.GroupCode == group).ToList();
            var mandatory = required.Where(c => c.Standard?.GroupCode == group).ToList();
            var target = mandatory.Count > 0 ? mandatory : groupCriteria;
            var approvedCount = target.Count(c => approved.Contains(c.Id));
            var complete = mandatory.Count > 0
                ? approvedCount == mandatory.Count
                : approvedCount > 0;
            return new StandardProgress(group.ToString(), mandatory.Count > 0 ? mandatory.Count : 1,
                approvedCount, groupCriteria.Count > 0 && complete);
        }).ToList();
    }

    public static ReviewApplicationResponse Map(SubmissionApplication app,
        IReadOnlyList<StandardProgress> progress) => new(app.Id, app.ApplicationCode,
        app.CampaignId, app.Campaign?.Name ?? "", app.ApplicantSnapshotJson, app.Status,
        app.SubmittedAt, app.AssignedReviewerId, app.ReviewerGeneralNote,
        app.RejectionReason, Convert.ToBase64String(app.RowVersion), progress);
}
