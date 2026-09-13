using SV5T.Application.Admin.Dtos;

namespace SV5T.Application.Admin.Abstractions;

public interface IAdminDashboardRepository
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
