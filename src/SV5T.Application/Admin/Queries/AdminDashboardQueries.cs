using FluentValidation;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Auth.Support;
using SV5T.Application.Common.Interfaces;

namespace SV5T.Application.Admin.Queries;

public sealed record GetDashboardSummaryQuery(AdminDashboardFilterRequest Request);
public sealed record GetStatusBreakdownQuery(AdminDashboardFilterRequest Request);
public sealed record GetStandardGroupRatesQuery(AdminDashboardFilterRequest Request);
public sealed record GetLevelFunnelQuery(AdminDashboardFilterRequest Request);
public sealed record GetDepartmentRankingQuery(AdminDashboardFilterRequest Request);
public sealed record GetUrgentItemsQuery(AdminDashboardFilterRequest Request);
public sealed record GetRecentActivityQuery(AdminDashboardFilterRequest Request);
public sealed record GetCollectiveSummaryQuery(AdminDashboardFilterRequest Request);

public interface IAdminDashboardService
{
    Task<DashboardSummaryResponse> GetSummaryAsync(
        AdminDashboardFilterRequest request,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<StatusBreakdownItemResponse>> GetStatusBreakdownAsync(
        AdminDashboardFilterRequest request,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<StandardGroupRateItemResponse>> GetStandardGroupRatesAsync(
        AdminDashboardFilterRequest request,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<LevelFunnelItemResponse>> GetLevelFunnelAsync(
        AdminDashboardFilterRequest request,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<DepartmentRankingItemResponse>> GetDepartmentRankingAsync(
        AdminDashboardFilterRequest request,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<UrgentDashboardItemResponse>> GetUrgentItemsAsync(
        AdminDashboardFilterRequest request,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<RecentActivityItemResponse>> GetRecentActivityAsync(
        AdminDashboardFilterRequest request,
        CancellationToken cancellationToken = default);

    Task<CollectiveSummaryResponse> GetCollectiveSummaryAsync(
        AdminDashboardFilterRequest request,
        CancellationToken cancellationToken = default);
}

public sealed class AdminDashboardService(
    IValidator<AdminDashboardFilterRequest> validator)
    : IAdminDashboardService,
      IQueryHandler<GetDashboardSummaryQuery, DashboardSummaryResponse>,
      IQueryHandler<GetStatusBreakdownQuery, IReadOnlyList<StatusBreakdownItemResponse>>,
      IQueryHandler<GetStandardGroupRatesQuery, IReadOnlyList<StandardGroupRateItemResponse>>,
      IQueryHandler<GetLevelFunnelQuery, IReadOnlyList<LevelFunnelItemResponse>>,
      IQueryHandler<GetDepartmentRankingQuery, IReadOnlyList<DepartmentRankingItemResponse>>,
      IQueryHandler<GetUrgentItemsQuery, IReadOnlyList<UrgentDashboardItemResponse>>,
      IQueryHandler<GetRecentActivityQuery, IReadOnlyList<RecentActivityItemResponse>>,
      IQueryHandler<GetCollectiveSummaryQuery, CollectiveSummaryResponse>
{
    public Task<DashboardSummaryResponse> HandleAsync(GetDashboardSummaryQuery query, CancellationToken cancellationToken = default) =>
        GetSummaryAsync(query.Request, cancellationToken);

    public Task<IReadOnlyList<StatusBreakdownItemResponse>> HandleAsync(GetStatusBreakdownQuery query, CancellationToken cancellationToken = default) =>
        GetStatusBreakdownAsync(query.Request, cancellationToken);

    public Task<IReadOnlyList<StandardGroupRateItemResponse>> HandleAsync(GetStandardGroupRatesQuery query, CancellationToken cancellationToken = default) =>
        GetStandardGroupRatesAsync(query.Request, cancellationToken);

    public Task<IReadOnlyList<LevelFunnelItemResponse>> HandleAsync(GetLevelFunnelQuery query, CancellationToken cancellationToken = default) =>
        GetLevelFunnelAsync(query.Request, cancellationToken);

    public Task<IReadOnlyList<DepartmentRankingItemResponse>> HandleAsync(GetDepartmentRankingQuery query, CancellationToken cancellationToken = default) =>
        GetDepartmentRankingAsync(query.Request, cancellationToken);

    public Task<IReadOnlyList<UrgentDashboardItemResponse>> HandleAsync(GetUrgentItemsQuery query, CancellationToken cancellationToken = default) =>
        GetUrgentItemsAsync(query.Request, cancellationToken);

    public Task<IReadOnlyList<RecentActivityItemResponse>> HandleAsync(GetRecentActivityQuery query, CancellationToken cancellationToken = default) =>
        GetRecentActivityAsync(query.Request, cancellationToken);

    public Task<CollectiveSummaryResponse> HandleAsync(GetCollectiveSummaryQuery query, CancellationToken cancellationToken = default) =>
        GetCollectiveSummaryAsync(query.Request, cancellationToken);

    public async Task<DashboardSummaryResponse> GetSummaryAsync(
        AdminDashboardFilterRequest request,
        CancellationToken cancellationToken = default)
    {
        await ValidateAsync(request, cancellationToken);
        var submitted = Scale(1011, request);
        var awarded = Scale(462, request);
        return new DashboardSummaryResponse(
            Scale(1248, request),
            submitted,
            Scale(156, request),
            awarded,
            submitted == 0 ? 0 : Math.Round(awarded * 100m / submitted, 1));
    }

    public async Task<IReadOnlyList<StatusBreakdownItemResponse>> GetStatusBreakdownAsync(
        AdminDashboardFilterRequest request,
        CancellationToken cancellationToken = default)
    {
        await ValidateAsync(request, cancellationToken);
        return
        [
            new("draft", "Nháp", Scale(126, request), "#94a3b8"),
            new("submitted", "Đã nộp", Scale(284, request), "#38bdf8"),
            new("reviewing", "Đang xét duyệt", Scale(156, request), "#6366f1"),
            new("supplement", "Yêu cầu bổ sung", Scale(58, request), "#f59e0b"),
            new("approved", "Đã duyệt", Scale(472, request), "#10b981"),
            new("rejected", "Từ chối", Scale(41, request), "#f43f5e")
        ];
    }

    public async Task<IReadOnlyList<StandardGroupRateItemResponse>> GetStandardGroupRatesAsync(
        AdminDashboardFilterRequest request,
        CancellationToken cancellationToken = default)
    {
        await ValidateAsync(request, cancellationToken);
        var adjustment = request.Level?.ToLowerInvariant() switch
        {
            "city" => -3m,
            "central" => -7m,
            _ => 0m
        };
        return
        [
            new("ETHICS", "Đạo đức tốt", 93m + adjustment, "emerald"),
            new("STUDY", "Học tập tốt", 81m + adjustment, "blue"),
            new("FITNESS", "Thể lực tốt", 76m + adjustment, "violet"),
            new("VOLUNTEER", "Tình nguyện tốt", 69m + adjustment, "amber"),
            new("INTEGRATION", "Hội nhập tốt", 54m + adjustment, "rose")
        ];
    }

    public async Task<IReadOnlyList<LevelFunnelItemResponse>> GetLevelFunnelAsync(
        AdminDashboardFilterRequest request,
        CancellationToken cancellationToken = default)
    {
        await ValidateAsync(request, cancellationToken);
        return
        [
            new("school", "Cấp Trường", Scale(1248, request, false), Scale(702, request, false)),
            new("city", "Cấp Thành phố", Scale(486, request, false), Scale(263, request, false)),
            new("central", "Cấp Trung ương", Scale(118, request, false), Scale(61, request, false))
        ];
    }

    public async Task<IReadOnlyList<DepartmentRankingItemResponse>> GetDepartmentRankingAsync(
        AdminDashboardFilterRequest request,
        CancellationToken cancellationToken = default)
    {
        await ValidateAsync(request, cancellationToken);
        var rows = new List<DepartmentRankingItemResponse>
        {
            new("it", "Khoa Công nghệ thông tin", 238, 132, 55.5m, true),
            new("economics", "Khoa Kinh tế", 206, 106, 51.5m, true),
            new("languages", "Khoa Ngoại ngữ", 174, 84, 48.3m, true),
            new("mechanical", "Khoa Cơ khí", 191, 78, 40.8m, true),
            new("electrical", "Khoa Điện – Điện tử", 183, 62, 33.9m, false)
        };
        if (!string.IsNullOrWhiteSpace(request.DepartmentId) &&
            !request.DepartmentId.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            rows = rows
                .Where(row => row.DepartmentId.Equals(
                    request.DepartmentId,
                    StringComparison.OrdinalIgnoreCase))
                .ToList();
        }
        return rows.Take(request.Limit ?? 10).ToArray();
    }

    public async Task<IReadOnlyList<UrgentDashboardItemResponse>> GetUrgentItemsAsync(
        AdminDashboardFilterRequest request,
        CancellationToken cancellationToken = default)
    {
        await ValidateAsync(request, cancellationToken);
        var now = DateTime.UtcNow;
        var rows = new UrgentDashboardItemResponse[]
        {
            new("HS-2026-0182", "Nguyễn Minh Anh", 5, now.AddDays(-5), "Quá hạn 5 ngày"),
            new("HS-2026-0204", "Trần Hoàng Nam", 2, now.AddDays(1), "Còn 1 ngày"),
            new("MC-2026-0918", "Lê Ngọc Hân", 3, now.AddDays(-3), "Quá hạn 3 ngày")
        };
        return rows
            .Where(item => item.DaysPending >= (request.OverdueDays ?? 1))
            .Take(request.Limit ?? 20)
            .ToArray();
    }

    public async Task<IReadOnlyList<RecentActivityItemResponse>> GetRecentActivityAsync(
        AdminDashboardFilterRequest request,
        CancellationToken cancellationToken = default)
    {
        await ValidateAsync(request, cancellationToken);
        var now = DateTime.UtcNow;
        return new RecentActivityItemResponse[]
        {
            new("Trần Anh", "TA", "đã duyệt minh chứng Ngoại ngữ", "Nguyễn Mai", now.AddMinutes(-5)),
            new("Lê Hằng", "LH", "đã yêu cầu bổ sung hồ sơ", "HS-2026-0168", now.AddMinutes(-18)),
            new("Minh Tú", "MT", "đã phê duyệt 8 hồ sơ", "Cấp Khoa", now.AddMinutes(-42))
        }.Take(request.Limit ?? 20).ToArray();
    }

    public async Task<CollectiveSummaryResponse> GetCollectiveSummaryAsync(
        AdminDashboardFilterRequest request,
        CancellationToken cancellationToken = default)
    {
        await ValidateAsync(request, cancellationToken);
        return new CollectiveSummaryResponse(
            Scale(24, request, false),
            Scale(18, request, false));
    }

    private async Task ValidateAsync(
        AdminDashboardFilterRequest request,
        CancellationToken cancellationToken) =>
        await AuthServiceSupport.ValidateAsync(validator, request, cancellationToken);

    private static int Scale(
        int value,
        AdminDashboardFilterRequest request,
        bool applyLevel = true)
    {
        var departmentFactor = string.IsNullOrWhiteSpace(request.DepartmentId) ||
            request.DepartmentId.Equals("all", StringComparison.OrdinalIgnoreCase)
            ? 1m
            : .31m;
        var levelFactor = !applyLevel
            ? 1m
            : request.Level?.ToLowerInvariant() switch
            {
                "city" => .58m,
                "central" => .24m,
                _ => 1m
            };
        return Math.Max(0, (int)Math.Round(value * departmentFactor * levelFactor));
    }
}
