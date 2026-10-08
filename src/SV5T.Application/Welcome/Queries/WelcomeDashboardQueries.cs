using MediatR;
using SV5T.Application.Admin.StandardSets.Common;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Standards.Abstractions;
using SV5T.Application.Student.Abstractions;
using SV5T.Application.Users.Abstractions;
using SV5T.Application.Users.Dtos;
using SV5T.Application.Welcome.Dtos;
using SV5T.Domain.Standards.Enums;
using SV5T.Domain.Submissions.Enums;
using SV5T.Domain.Users;
using SV5T.Domain.Welcome;

namespace SV5T.Application.Welcome.Queries;

public sealed record GetWelcomeDashboardQuery : IRequest<WelcomeDashboardResponse>;

public sealed class GetWelcomeDashboardHandler(
    ICurrentUser currentUser,
    IUserRepository userRepository,
    IPortalContentRepository contentRepository,
    IStudentApplicationRepository studentApplications,
    IStudentEvidenceRepository studentEvidences,
    IStandardSetRepository standardSetRepository,
    IStudentCampaignRepository studentCampaigns)
    : IRequestHandler<GetWelcomeDashboardQuery, WelcomeDashboardResponse>
{
    private const int ContentQueryLimit = 20;

    public async Task<WelcomeDashboardResponse> Handle(
        GetWelcomeDashboardQuery query,
        CancellationToken cancellationToken)
    {
        if (!currentUser.UserId.HasValue)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Unauthorized,
                "Phiên đăng nhập không hợp lệ.",
                "invalid_session");
        }

        var user = await userRepository.GetSummaryByIdAsync(
            currentUser.UserId.Value,
            cancellationToken);
        if (user is null || !user.IsActive || !user.IsVerified)
        {
            throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy người dùng.",
                "user_not_found");
        }

        var nowUtc = DateTime.UtcNow;
        var contents = await contentRepository.GetPublishedAsync(
            nowUtc,
            ContentQueryLimit,
            cancellationToken);
        var mappedContents = contents.Select(MapContent).ToArray();

        var profileFullName = user.ProfileFullName?.Trim();
        var displayName = !string.IsNullOrWhiteSpace(profileFullName)
            ? profileFullName
            : string.IsNullOrWhiteSpace(user.DisplayName)
                ? user.Email.Split('@', 2)[0]
                : user.DisplayName.Trim();

        var (criteriaProgress, standards) = await GetJourneyDataAsync(user.Id, cancellationToken);

        return new WelcomeDashboardResponse(
            new WelcomeUserDto(
                user.Id,
                displayName,
                user.Email,
                user.AvatarUrl,
                user.ProfileFaculty),
            GetFeatures(),
            mappedContents
                .Where(item => item.Type == PortalContentType.Notification)
                .Take(5)
                .ToArray(),
            mappedContents
                .Where(item => item.Type == PortalContentType.News)
                .Take(6)
                .ToArray(),
            contents.Count == 0
                ? nowUtc
                : contents.Max(item => item.PublishedAtUtc),
            criteriaProgress,
            standards);
    }

    private async Task<(IReadOnlyList<CriterionProgressDto> Progress, IReadOnlyList<StandardJourneyDto> Standards)> GetJourneyDataAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var userApps = await studentApplications.GetByUserAsync(userId, cancellationToken);
        var latestApp = userApps.OrderByDescending(a => a.CreatedAt).FirstOrDefault();

        Guid? targetSetId = latestApp?.StandardSetId;
        IReadOnlyList<Domain.Evidences.Evidence>? evidences = null;

        if (latestApp != null)
        {
            evidences = await studentEvidences.GetByApplicationAsync(latestApp.Id, cancellationToken);
        }
        else
        {
            var openCampaigns = await studentCampaigns.GetOpenAsync(cancellationToken);
            targetSetId = openCampaigns.FirstOrDefault()?.StandardSetId;

            if (!targetSetId.HasValue)
            {
                var sets = await standardSetRepository.GetAllAsync(cancellationToken);
                targetSetId = sets.FirstOrDefault(s => s.Status == StandardSetStatus.Published)?.Id
                    ?? sets.FirstOrDefault()?.Id;
            }
        }

        Domain.Standards.StandardSet? standardSet = null;
        if (targetSetId.HasValue)
        {
            standardSet = await standardSetRepository.GetByIdAsync(
                targetSetId.Value,
                includeStandards: true,
                includeCriteria: true,
                tracking: false,
                cancellationToken: cancellationToken);
        }

        var evidencesByCriterion = evidences?
            .GroupBy(e => e.CriterionId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(e => e.CreatedAt).First())
            ?? new Dictionary<Guid, Domain.Evidences.Evidence>();

        var progressList = new List<CriterionProgressDto>();
        var standardsList = new List<StandardJourneyDto>();

        var groups = new[]
        {
            (GroupCode: StandardGroupCode.Ethics, Key: "ethics", DefaultTitle: "Đạo đức tốt", DisplayOrder: 1),
            (GroupCode: StandardGroupCode.Study, Key: "study", DefaultTitle: "Học tập tốt", DisplayOrder: 2),
            (GroupCode: StandardGroupCode.Fitness, Key: "fitness", DefaultTitle: "Thể lực tốt", DisplayOrder: 3),
            (GroupCode: StandardGroupCode.Volunteer, Key: "volunteer", DefaultTitle: "Tình nguyện tốt", DisplayOrder: 4),
            (GroupCode: StandardGroupCode.Integration, Key: "integration", DefaultTitle: "Hội nhập tốt", DisplayOrder: 5),
        };

        foreach (var group in groups)
        {
            var std = standardSet?.Standards.FirstOrDefault(s => s.GroupCode == group.GroupCode)
                ?? standardSet?.Standards.FirstOrDefault(s => s.DisplayOrder == group.DisplayOrder);

            var code = std?.Code ?? $"TC_{group.Key.ToUpperInvariant()}";
            var rawTitle = std?.Title;
            var title = !string.IsNullOrWhiteSpace(rawTitle)
                ? AdminStandardMappings.NormalizeStandardTitle(rawTitle)
                : group.DefaultTitle;
            var description = !string.IsNullOrWhiteSpace(std?.Description)
                ? AdminStandardMappings.NormalizeStandardDescription(std?.Description)
                : string.Empty;

            var criteriaItems = new List<CriterionJourneyItemDto>();
            if (std?.Criteria != null && std.Criteria.Count > 0)
            {
                foreach (var c in std.Criteria
                    .Where(c => c.Type == Domain.Standards.Enums.CriterionType.Requirement)
                    .OrderBy(c => c.DisplayOrder))
                {
                    evidencesByCriterion.TryGetValue(c.Id, out var ev);
                    var isCompleted = ev != null && (ev.Status == EvidenceStatus.Approved || ev.Status == EvidenceStatus.Submitted);
                    criteriaItems.Add(new CriterionJourneyItemDto(
                        c.Id,
                        c.Code,
                        c.Title,
                        c.Description,
                        c.Type == Domain.Standards.Enums.CriterionType.Requirement,
                        c.DisplayOrder,
                        isCompleted,
                        ev?.Status.ToString()));
                }
            }

            int totalReqs = criteriaItems.Count;
            int completedReqs = criteriaItems.Count(c => c.IsCompleted);
            int pct = totalReqs > 0 ? (int)Math.Round((double)completedReqs / totalReqs * 100) : 0;
            string status = totalReqs == 0
                ? string.Empty
                : completedReqs >= totalReqs
                    ? "Đã hoàn thành"
                    : completedReqs > 0
                        ? "Đang hoàn thiện"
                        : "Chưa hoàn thành";

            progressList.Add(new CriterionProgressDto(
                group.Key,
                pct,
                status,
                completedReqs,
                totalReqs,
                DateTime.UtcNow));

            standardsList.Add(new StandardJourneyDto(
                group.Key,
                code,
                title,
                description,
                group.DisplayOrder,
                pct,
                completedReqs,
                totalReqs,
                criteriaItems));
        }

        return (progressList, standardsList);
    }

    private static PortalContentDto MapContent(PortalContent content) => new(
        content.Id,
        content.Type,
        content.Source,
        content.Title,
        content.Summary,
        content.Route,
        content.Icon,
        content.IsFeatured,
        content.PublishedAtUtc);

    private static IReadOnlyList<SystemFeatureDto> GetFeatures() =>
    [
        new("overview", "Trang chào mừng", "Tổng quan thông tin và cập nhật mới", "/dashboard", "home", "Tổng quan", true),
        new("profile", "Hồ sơ cá nhân", "Cập nhật thông tin và ảnh đại diện", "/dashboard/profile", "user-round", "Cá nhân", true),
        new("campaigns", "Chiến dịch", "Chọn cấp xét & nộp hồ sơ danh hiệu", "/dashboard/campaigns", "flag", "Hoạt động", true),
        new("evidence", "Hồ sơ đã nộp", "Quản lý hồ sơ đã nộp & xem feedback của Mentor", "/dashboard/applications", "file-check", "Hồ sơ 5 tốt", true),
        new("notifications", "Thông báo", "Cập nhật thông báo và kết quả xét duyệt", "/dashboard/notifications", "newspaper", "Tổng quan", true),
        new("chat", "Tin nhắn", "Trao đổi với cán bộ và ban tổ chức", "/chat", "users", "Cộng đồng", true),
        new("news", "Tin tức", "Tin tức và sự kiện phong trào", "/news", "sparkles", "Hoạt động", true)
    ];
}
