using FluentValidation;
using SV5T.Application.Admin.Abstractions;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Auth.Support;

namespace SV5T.Application.Admin.Services;

public interface IAdminDashboardService
{
    Task<DashboardSummaryResponse> GetSummaryAsync(
        AdminDashboardFilterRequest request,
        CancellationToken cancellationToken = default
    );

    Task<IReadOnlyList<StatusBreakdownItemResponse>> GetStatusBreakdownAsync(
        AdminDashboardFilterRequest request,
        CancellationToken cancellationToken = default
    );

    Task<IReadOnlyList<StandardGroupRateItemResponse>> GetStandardGroupRatesAsync(
        AdminDashboardFilterRequest request,
        CancellationToken cancellationToken = default
    );

    Task<IReadOnlyList<LevelFunnelItemResponse>> GetLevelFunnelAsync(
        AdminDashboardFilterRequest request,
        CancellationToken cancellationToken = default
    );

    Task<IReadOnlyList<DepartmentRankingItemResponse>> GetDepartmentRankingAsync(
        AdminDashboardFilterRequest request,
        CancellationToken cancellationToken = default
    );

    Task<IReadOnlyList<UrgentDashboardItemResponse>> GetUrgentItemsAsync(
        AdminDashboardFilterRequest request,
        CancellationToken cancellationToken = default
    );

    Task<IReadOnlyList<RecentActivityItemResponse>> GetRecentActivityAsync(
        AdminDashboardFilterRequest request,
        CancellationToken cancellationToken = default
    );

    Task<CollectiveSummaryResponse> GetCollectiveSummaryAsync(
        AdminDashboardFilterRequest request,
        CancellationToken cancellationToken = default
    );
}

public sealed class AdminDashboardService(
    IAdminDashboardRepository dashboardRepository,
    IValidator<AdminDashboardFilterRequest> validator
) : IAdminDashboardService
{
    public async Task<DashboardSummaryResponse> GetSummaryAsync(
        AdminDashboardFilterRequest request,
        CancellationToken cancellationToken = default
    )
    {
        await ValidateAsync(request, cancellationToken);
        return await dashboardRepository.GetSummaryAsync(request, cancellationToken);
    }

    public async Task<IReadOnlyList<StatusBreakdownItemResponse>> GetStatusBreakdownAsync(
        AdminDashboardFilterRequest request,
        CancellationToken cancellationToken = default
    )
    {
        await ValidateAsync(request, cancellationToken);
        return await dashboardRepository.GetStatusBreakdownAsync(request, cancellationToken);
    }

    public async Task<IReadOnlyList<StandardGroupRateItemResponse>> GetStandardGroupRatesAsync(
        AdminDashboardFilterRequest request,
        CancellationToken cancellationToken = default
    )
    {
        await ValidateAsync(request, cancellationToken);
        return await dashboardRepository.GetStandardGroupRatesAsync(request, cancellationToken);
    }

    public async Task<IReadOnlyList<LevelFunnelItemResponse>> GetLevelFunnelAsync(
        AdminDashboardFilterRequest request,
        CancellationToken cancellationToken = default
    )
    {
        await ValidateAsync(request, cancellationToken);
        return await dashboardRepository.GetLevelFunnelAsync(request, cancellationToken);
    }

    public async Task<IReadOnlyList<DepartmentRankingItemResponse>> GetDepartmentRankingAsync(
        AdminDashboardFilterRequest request,
        CancellationToken cancellationToken = default
    )
    {
        await ValidateAsync(request, cancellationToken);
        return await dashboardRepository.GetDepartmentRankingAsync(request, cancellationToken);
    }

    public async Task<IReadOnlyList<UrgentDashboardItemResponse>> GetUrgentItemsAsync(
        AdminDashboardFilterRequest request,
        CancellationToken cancellationToken = default
    )
    {
        await ValidateAsync(request, cancellationToken);
        return await dashboardRepository.GetUrgentItemsAsync(request, cancellationToken);
    }

    public async Task<IReadOnlyList<RecentActivityItemResponse>> GetRecentActivityAsync(
        AdminDashboardFilterRequest request,
        CancellationToken cancellationToken = default
    )
    {
        await ValidateAsync(request, cancellationToken);
        return await dashboardRepository.GetRecentActivityAsync(request, cancellationToken);
    }

    public async Task<CollectiveSummaryResponse> GetCollectiveSummaryAsync(
        AdminDashboardFilterRequest request,
        CancellationToken cancellationToken = default
    )
    {
        await ValidateAsync(request, cancellationToken);
        return await dashboardRepository.GetCollectiveSummaryAsync(request, cancellationToken);
    }

    private async Task ValidateAsync(AdminDashboardFilterRequest request, CancellationToken cancellationToken) =>
        await AuthServiceSupport.ValidateAsync(validator, request, cancellationToken);
}
