using System.Data;
using Dapper;
using Microsoft.EntityFrameworkCore;
using SV5T.Application.Admin.Abstractions;
using SV5T.Application.Admin.Dtos;
using SV5T.Domain.Awards.Enums;
using SV5T.Domain.Standards.Enums;
using SV5T.Domain.Submissions.Enums;
using SV5T.Infrastructure.Persistence.Context;

namespace SV5T.Infrastructure.Persistence.Repositories.Admin;

public sealed class AdminDashboardRepository(ApplicationDbContext dbContext) : IAdminDashboardRepository
{
    private IDbConnection GetConnection() => dbContext.Database.GetDbConnection();

    private static (Guid? campaignGuid, int? levelInt, string? departmentName, string? schoolYear) ParseFilters(
        AdminDashboardFilterRequest request)
    {
        Guid? campaignGuid = Guid.TryParse(request.CampaignId, out var g) ? g : null;
        int? levelInt = null;
        if (!string.IsNullOrWhiteSpace(request.Level))
        {
            levelInt = request.Level.Trim().ToLowerInvariant() switch
            {
                "school" or "0" => (int)AwardLevel.School,
                "city" or "1" => (int)AwardLevel.City,
                "central" or "2" => (int)AwardLevel.Central,
                _ => null
            };
        }

        var departmentName = !string.IsNullOrWhiteSpace(request.DepartmentId) &&
            !request.DepartmentId.Equals("all", StringComparison.OrdinalIgnoreCase)
            ? request.DepartmentId.Trim()
            : null;

        var schoolYear = !string.IsNullOrWhiteSpace(request.SchoolYear) &&
            !request.SchoolYear.Equals("all", StringComparison.OrdinalIgnoreCase)
            ? request.SchoolYear.Trim()
            : null;

        return (campaignGuid, levelInt, departmentName, schoolYear);
    }

    public async Task<DashboardSummaryResponse> GetSummaryAsync(
        AdminDashboardFilterRequest request,
        CancellationToken cancellationToken = default)
    {
        var (campaignGuid, levelInt, departmentName, schoolYear) = ParseFilters(request);

        const string sql = """
            SELECT 
                COUNT(a.Id) AS TotalRegistered,
                COUNT(CASE WHEN a.Status != 0 THEN 1 END) AS TotalSubmitted,
                COUNT(CASE WHEN a.Status IN (1, 2, 3) THEN 1 END) AS TotalPendingReview,
                COUNT(CASE WHEN a.Status = 4 THEN 1 END) AS TotalAwarded
            FROM applications a
            LEFT JOIN campaigns c ON a.CampaignId = c.Id
            LEFT JOIN user_profiles p ON a.ApplicantUserId = p.UserId
            WHERE (@CampaignId IS NULL OR a.CampaignId = @CampaignId)
              AND (@SchoolYear IS NULL OR c.SchoolYear = @SchoolYear)
              AND (@DepartmentId IS NULL OR p.Faculty = @DepartmentId)
              AND (@LevelInt IS NULL OR c.Level = @LevelInt);
            """;

        var connection = GetConnection();
        var row = await connection.QuerySingleOrDefaultAsync<SummaryQueryResult>(
            new CommandDefinition(
                sql,
                new { CampaignId = campaignGuid, SchoolYear = schoolYear, DepartmentId = departmentName, LevelInt = levelInt },
                cancellationToken: cancellationToken));

        var reg = row?.TotalRegistered ?? 0;
        var sub = row?.TotalSubmitted ?? 0;
        var pen = row?.TotalPendingReview ?? 0;
        var awd = row?.TotalAwarded ?? 0;
        var rate = sub == 0 ? 0m : Math.Round(awd * 100m / sub, 1);

        return new DashboardSummaryResponse(reg, sub, pen, awd, rate);
    }

    public async Task<IReadOnlyList<StatusBreakdownItemResponse>> GetStatusBreakdownAsync(
        AdminDashboardFilterRequest request,
        CancellationToken cancellationToken = default)
    {
        var (campaignGuid, levelInt, departmentName, schoolYear) = ParseFilters(request);

        const string sql = """
            SELECT 
                a.Status AS StatusCode,
                COUNT(a.Id) AS Count
            FROM applications a
            LEFT JOIN campaigns c ON a.CampaignId = c.Id
            LEFT JOIN user_profiles p ON a.ApplicantUserId = p.UserId
            WHERE (@CampaignId IS NULL OR a.CampaignId = @CampaignId)
              AND (@SchoolYear IS NULL OR c.SchoolYear = @SchoolYear)
              AND (@DepartmentId IS NULL OR p.Faculty = @DepartmentId)
              AND (@LevelInt IS NULL OR c.Level = @LevelInt)
            GROUP BY a.Status;
            """;

        var connection = GetConnection();
        var rows = (await connection.QueryAsync<StatusCountQueryResult>(
            new CommandDefinition(
                sql,
                new { CampaignId = campaignGuid, SchoolYear = schoolYear, DepartmentId = departmentName, LevelInt = levelInt },
                cancellationToken: cancellationToken))).ToDictionary(r => r.StatusCode, r => r.Count);

        return
        [
            new("draft", "Nháp", rows.GetValueOrDefault((int)SubmissionStatus.Draft, 0), "#94a3b8"),
            new("submitted", "Đã nộp", rows.GetValueOrDefault((int)SubmissionStatus.Submitted, 0), "#38bdf8"),
            new("reviewing", "Đang xét duyệt", rows.GetValueOrDefault((int)SubmissionStatus.UnderReview, 0), "#6366f1"),
            new("supplement", "Yêu cầu bổ sung", rows.GetValueOrDefault((int)SubmissionStatus.NeedsRevision, 0) + rows.GetValueOrDefault((int)SubmissionStatus.Resubmitted, 0), "#f59e0b"),
            new("approved", "Đã duyệt", rows.GetValueOrDefault((int)SubmissionStatus.Approved, 0), "#10b981"),
            new("rejected", "Từ chối", rows.GetValueOrDefault((int)SubmissionStatus.Rejected, 0), "#f43f5e")
        ];
    }

    public async Task<IReadOnlyList<StandardGroupRateItemResponse>> GetStandardGroupRatesAsync(
        AdminDashboardFilterRequest request,
        CancellationToken cancellationToken = default)
    {
        var (campaignGuid, levelInt, departmentName, schoolYear) = ParseFilters(request);

        const string sql = """
            SELECT 
                s.GroupCode AS GroupCodeInt,
                COUNT(e.Id) AS TotalCount,
                COUNT(CASE WHEN e.Status = 2 THEN 1 END) AS ApprovedCount
            FROM evidences e
            INNER JOIN criteria c ON e.CriterionId = c.Id
            INNER JOIN standards s ON c.StandardId = s.Id
            INNER JOIN applications a ON e.ApplicationId = a.Id
            LEFT JOIN campaigns camp ON a.CampaignId = camp.Id
            LEFT JOIN user_profiles p ON a.ApplicantUserId = p.UserId
            WHERE s.GroupCode IS NOT NULL
              AND (@CampaignId IS NULL OR a.CampaignId = @CampaignId)
              AND (@SchoolYear IS NULL OR camp.SchoolYear = @SchoolYear)
              AND (@DepartmentId IS NULL OR p.Faculty = @DepartmentId)
              AND (@LevelInt IS NULL OR camp.Level = @LevelInt)
            GROUP BY s.GroupCode;
            """;

        var connection = GetConnection();
        var rows = (await connection.QueryAsync<GroupRateQueryResult>(
            new CommandDefinition(
                sql,
                new { CampaignId = campaignGuid, SchoolYear = schoolYear, DepartmentId = departmentName, LevelInt = levelInt },
                cancellationToken: cancellationToken))).ToDictionary(r => r.GroupCodeInt, r => r);

        decimal CalculateRate(int groupCode)
        {
            if (!rows.TryGetValue(groupCode, out var row) || row.TotalCount == 0)
                return 0m;
            return Math.Round(row.ApprovedCount * 100m / row.TotalCount, 1);
        }

        return
        [
            new("ETHICS", "Đạo đức tốt", CalculateRate((int)StandardGroupCode.Ethics), "emerald"),
            new("STUDY", "Học tập tốt", CalculateRate((int)StandardGroupCode.Study), "blue"),
            new("FITNESS", "Thể lực tốt", CalculateRate((int)StandardGroupCode.Fitness), "violet"),
            new("VOLUNTEER", "Tình nguyện tốt", CalculateRate((int)StandardGroupCode.Volunteer), "amber"),
            new("INTEGRATION", "Hội nhập tốt", CalculateRate((int)StandardGroupCode.Integration), "rose")
        ];
    }

    public async Task<IReadOnlyList<LevelFunnelItemResponse>> GetLevelFunnelAsync(
        AdminDashboardFilterRequest request,
        CancellationToken cancellationToken = default)
    {
        var (campaignGuid, _, departmentName, schoolYear) = ParseFilters(request);

        const string sql = """
            SELECT 
                camp.Level AS LevelInt,
                COUNT(CASE WHEN a.Status != 0 THEN 1 END) AS Submitted,
                COUNT(CASE WHEN a.Status = 4 THEN 1 END) AS Approved
            FROM campaigns camp
            LEFT JOIN applications a ON a.CampaignId = camp.Id
            LEFT JOIN user_profiles p ON a.ApplicantUserId = p.UserId
            WHERE (@CampaignId IS NULL OR camp.Id = @CampaignId)
              AND (@SchoolYear IS NULL OR camp.SchoolYear = @SchoolYear)
              AND (@DepartmentId IS NULL OR p.Faculty = @DepartmentId)
            GROUP BY camp.Level;
            """;

        var connection = GetConnection();
        var rows = (await connection.QueryAsync<LevelFunnelQueryResult>(
            new CommandDefinition(
                sql,
                new { CampaignId = campaignGuid, SchoolYear = schoolYear, DepartmentId = departmentName },
                cancellationToken: cancellationToken))).ToDictionary(r => r.LevelInt, r => r);

        return
        [
            new("school", "Cấp Trường", rows.GetValueOrDefault((int)AwardLevel.School)?.Submitted ?? 0, rows.GetValueOrDefault((int)AwardLevel.School)?.Approved ?? 0),
            new("city", "Cấp Thành phố", rows.GetValueOrDefault((int)AwardLevel.City)?.Submitted ?? 0, rows.GetValueOrDefault((int)AwardLevel.City)?.Approved ?? 0),
            new("central", "Cấp Trung ương", rows.GetValueOrDefault((int)AwardLevel.Central)?.Submitted ?? 0, rows.GetValueOrDefault((int)AwardLevel.Central)?.Approved ?? 0)
        ];
    }

    public async Task<IReadOnlyList<DepartmentRankingItemResponse>> GetDepartmentRankingAsync(
        AdminDashboardFilterRequest request,
        CancellationToken cancellationToken = default)
    {
        var (campaignGuid, levelInt, departmentName, schoolYear) = ParseFilters(request);
        var limit = request.Limit is > 0 and <= 50 ? request.Limit.Value : 10;

        const string sql = """
            SELECT 
                COALESCE(p.Faculty, 'Khác') AS DepartmentName,
                COUNT(a.Id) AS Registered,
                COUNT(CASE WHEN a.Status = 4 THEN 1 END) AS Awarded
            FROM applications a
            INNER JOIN user_profiles p ON a.ApplicantUserId = p.UserId
            LEFT JOIN campaigns camp ON a.CampaignId = camp.Id
            WHERE a.Status != 0
              AND (@CampaignId IS NULL OR a.CampaignId = @CampaignId)
              AND (@SchoolYear IS NULL OR camp.SchoolYear = @SchoolYear)
              AND (@DepartmentId IS NULL OR p.Faculty = @DepartmentId)
              AND (@LevelInt IS NULL OR camp.Level = @LevelInt)
            GROUP BY p.Faculty
            ORDER BY Awarded DESC, Registered DESC
            LIMIT @Limit;
            """;

        var connection = GetConnection();
        var rows = await connection.QueryAsync<DepartmentRankingQueryResult>(
            new CommandDefinition(
                sql,
                new { CampaignId = campaignGuid, SchoolYear = schoolYear, DepartmentId = departmentName, LevelInt = levelInt, Limit = limit },
                cancellationToken: cancellationToken));

        return rows.Select(r =>
        {
            var rate = r.Registered == 0 ? 0m : Math.Round(r.Awarded * 100m / r.Registered, 1);
            return new DepartmentRankingItemResponse(
                r.DepartmentName.ToLowerInvariant().Replace(" ", "-"),
                r.DepartmentName,
                r.Registered,
                r.Awarded,
                rate,
                r.Awarded >= 50);
        }).ToList();
    }

    public async Task<IReadOnlyList<UrgentDashboardItemResponse>> GetUrgentItemsAsync(
        AdminDashboardFilterRequest request,
        CancellationToken cancellationToken = default)
    {
        var (campaignGuid, levelInt, departmentName, schoolYear) = ParseFilters(request);
        var limit = request.Limit is > 0 and <= 50 ? request.Limit.Value : 20;

        const string sql = """
            SELECT 
                a.ApplicationCode AS ApplicationId,
                COALESCE(p.FullName, 'Sinh viên') AS StudentName,
                GREATEST(0, TIMESTAMPDIFF(DAY, COALESCE(a.SubmittedAt, a.CreatedAt), UTC_TIMESTAMP())) AS DaysPending,
                COALESCE(camp.ReviewDeadline, a.ReviewDueAt, UTC_TIMESTAMP()) AS DeadlineAtUtc
            FROM applications a
            INNER JOIN user_profiles p ON a.ApplicantUserId = p.UserId
            LEFT JOIN campaigns camp ON a.CampaignId = camp.Id
            WHERE a.Status IN (1, 2, 3)
              AND (@CampaignId IS NULL OR a.CampaignId = @CampaignId)
              AND (@SchoolYear IS NULL OR camp.SchoolYear = @SchoolYear)
              AND (@DepartmentId IS NULL OR p.Faculty = @DepartmentId)
              AND (@LevelInt IS NULL OR camp.Level = @LevelInt)
            ORDER BY DaysPending DESC
            LIMIT @Limit;
            """;

        var connection = GetConnection();
        var rows = await connection.QueryAsync<UrgentItemQueryResult>(
            new CommandDefinition(
                sql,
                new { CampaignId = campaignGuid, SchoolYear = schoolYear, DepartmentId = departmentName, LevelInt = levelInt, Limit = limit },
                cancellationToken: cancellationToken));

        return rows.Select(r => new UrgentDashboardItemResponse(
            r.ApplicationId,
            r.StudentName,
            r.DaysPending,
            r.DeadlineAtUtc,
            r.DaysPending > 3 ? $"Quá hạn {r.DaysPending} ngày" : $"Chờ duyệt {r.DaysPending} ngày"
        )).ToList();
    }

    public async Task<IReadOnlyList<RecentActivityItemResponse>> GetRecentActivityAsync(
        AdminDashboardFilterRequest request,
        CancellationToken cancellationToken = default)
    {
        var (campaignGuid, _, _, schoolYear) = ParseFilters(request);
        var limit = request.Limit is > 0 and <= 50 ? request.Limit.Value : 20;

        const string sql = """
            SELECT 
                COALESCE(u.DisplayName, 'Ban xét duyệt') AS ReviewerName,
                rl.Action AS ActionCode,
                COALESCE(a.ApplicationCode, 'Hồ sơ') AS Target,
                rl.CreatedAt AS CreatedAtUtc
            FROM review_logs rl
            LEFT JOIN users u ON rl.ActorId = u.Id
            LEFT JOIN applications a ON rl.ApplicationId = a.Id
            LEFT JOIN campaigns camp ON a.CampaignId = camp.Id
            WHERE (@CampaignId IS NULL OR a.CampaignId = @CampaignId)
              AND (@SchoolYear IS NULL OR camp.SchoolYear = @SchoolYear)
            ORDER BY rl.CreatedAt DESC
            LIMIT @Limit;
            """;

        var connection = GetConnection();
        var rows = await connection.QueryAsync<RecentActivityQueryResult>(
            new CommandDefinition(
                sql,
                new { CampaignId = campaignGuid, SchoolYear = schoolYear, Limit = limit },
                cancellationToken: cancellationToken));

        return rows.Select(r =>
        {
            var initials = string.Join("", r.ReviewerName.Split(' ', StringSplitOptions.RemoveEmptyEntries).Select(w => w[0])).ToUpperInvariant();
            if (initials.Length > 2) initials = initials[..2];
            var actionText = (ReviewAction)r.ActionCode switch
            {
                ReviewAction.EvidenceApproved => "đã duyệt minh chứng",
                ReviewAction.EvidenceRejected => "đã từ chối minh chứng",
                ReviewAction.EvidenceRevisionRequested => "đã yêu cầu bổ sung minh chứng",
                ReviewAction.ApplicationApproved => "đã phê duyệt hồ sơ",
                ReviewAction.ApplicationRejected => "đã từ chối hồ sơ",
                ReviewAction.ApplicationRevisionRequested => "đã yêu cầu bổ sung hồ sơ",
                _ => "đã thao tác xét duyệt"
            };

            return new RecentActivityItemResponse(
                r.ReviewerName,
                string.IsNullOrWhiteSpace(initials) ? "AD" : initials,
                actionText,
                r.Target,
                r.CreatedAtUtc);
        }).ToList();
    }

    public async Task<CollectiveSummaryResponse> GetCollectiveSummaryAsync(
        AdminDashboardFilterRequest request,
        CancellationToken cancellationToken = default)
    {
        var (campaignGuid, _, _, schoolYear) = ParseFilters(request);

        const string sql = """
            SELECT 
                COUNT(a.Id) AS TotalUnits,
                COUNT(CASE WHEN a.Status = 4 THEN 1 END) AS QualifiedUnits
            FROM applications a
            LEFT JOIN campaigns camp ON a.CampaignId = camp.Id
            WHERE a.Kind = 1
              AND (@CampaignId IS NULL OR a.CampaignId = @CampaignId)
              AND (@SchoolYear IS NULL OR camp.SchoolYear = @SchoolYear);
            """;

        var connection = GetConnection();
        var row = await connection.QuerySingleOrDefaultAsync<CollectiveQueryResult>(
            new CommandDefinition(
                sql,
                new { CampaignId = campaignGuid, SchoolYear = schoolYear },
                cancellationToken: cancellationToken));

        return new CollectiveSummaryResponse(row?.TotalUnits ?? 0, row?.QualifiedUnits ?? 0);
    }

    private sealed record SummaryQueryResult(int TotalRegistered, int TotalSubmitted, int TotalPendingReview, int TotalAwarded);
    private sealed record StatusCountQueryResult(int StatusCode, int Count);
    private sealed record GroupRateQueryResult(int GroupCodeInt, int TotalCount, int ApprovedCount);
    private sealed record LevelFunnelQueryResult(int LevelInt, int Submitted, int Approved);
    private sealed record DepartmentRankingQueryResult(string DepartmentName, int Registered, int Awarded);
    private sealed record UrgentItemQueryResult(string ApplicationId, string StudentName, int DaysPending, DateTime DeadlineAtUtc);
    private sealed record RecentActivityQueryResult(string ReviewerName, int ActionCode, string Target, DateTime CreatedAtUtc);
    private sealed record CollectiveQueryResult(int TotalUnits, int QualifiedUnits);
}
