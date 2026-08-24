namespace SV5T.Application.Admin.Dtos;

public sealed class AdminDashboardFilterRequest
{
    public string? CampaignId { get; init; }
    public string? SchoolYear { get; init; }
    public string? Level { get; init; }
    public string? DepartmentId { get; init; }
    public DateOnly? From { get; init; }
    public DateOnly? To { get; init; }
    public int? Limit { get; init; }
    public int? OverdueDays { get; init; }
}

public sealed record DashboardSummaryResponse(
    int TotalRegistered,
    int TotalSubmitted,
    int TotalPendingReview,
    int TotalAwarded,
    decimal AwardRate);

public sealed record StatusBreakdownItemResponse(
    string Status,
    string Label,
    int Count,
    string Color);

public sealed record StandardGroupRateItemResponse(
    string GroupCode,
    string GroupName,
    decimal PassRate,
    string Tone);

public sealed record LevelFunnelItemResponse(
    string Level,
    string Label,
    int Submitted,
    int Approved);

public sealed record DepartmentRankingItemResponse(
    string DepartmentId,
    string DepartmentName,
    int Registered,
    int Awarded,
    decimal Rate,
    bool CollectiveQualified);

public sealed record UrgentDashboardItemResponse(
    string ApplicationId,
    string StudentName,
    int DaysPending,
    DateTime DeadlineAtUtc,
    string UrgencyLabel);

public sealed record RecentActivityItemResponse(
    string ReviewerName,
    string ReviewerInitials,
    string Action,
    string Target,
    DateTime CreatedAtUtc);

public sealed record CollectiveSummaryResponse(
    int TotalUnits,
    int QualifiedUnits);

public sealed record AdminCapabilitiesResponse(
    bool CanAccessDashboard,
    bool CanManageRoles,
    bool CanConfigureStandards);

public sealed record AdminModuleAccessResponse(
    string Module,
    bool Allowed);
