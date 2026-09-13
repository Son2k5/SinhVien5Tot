using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Admin.Services;

namespace SV5T.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin,Mentor")]
[Route("api/admin/dashboard")]
public sealed class AdminDashboardController(IAdminDashboardService dashboardService) : ControllerBase
{
    [HttpGet("summary")]
    [ProducesResponseType<DashboardSummaryResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<DashboardSummaryResponse>> GetSummary(
        [FromQuery] AdminDashboardFilterRequest request,
        CancellationToken cancellationToken
    ) => Ok(await dashboardService.GetSummaryAsync(request, cancellationToken));

    [HttpGet("status-breakdown")]
    [ProducesResponseType<IReadOnlyList<StatusBreakdownItemResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<StatusBreakdownItemResponse>>> GetStatusBreakdown(
        [FromQuery] AdminDashboardFilterRequest request,
        CancellationToken cancellationToken
    ) => Ok(await dashboardService.GetStatusBreakdownAsync(request, cancellationToken));

    [HttpGet("standard-group-rate")]
    [ProducesResponseType<IReadOnlyList<StandardGroupRateItemResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<StandardGroupRateItemResponse>>> GetStandardGroupRates(
        [FromQuery] AdminDashboardFilterRequest request,
        CancellationToken cancellationToken
    ) => Ok(await dashboardService.GetStandardGroupRatesAsync(request, cancellationToken));

    [HttpGet("level-funnel")]
    [ProducesResponseType<IReadOnlyList<LevelFunnelItemResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<LevelFunnelItemResponse>>> GetLevelFunnel(
        [FromQuery] AdminDashboardFilterRequest request,
        CancellationToken cancellationToken
    ) => Ok(await dashboardService.GetLevelFunnelAsync(request, cancellationToken));

    [HttpGet("department-ranking")]
    [ProducesResponseType<IReadOnlyList<DepartmentRankingItemResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<DepartmentRankingItemResponse>>> GetDepartmentRanking(
        [FromQuery] AdminDashboardFilterRequest request,
        CancellationToken cancellationToken
    ) => Ok(await dashboardService.GetDepartmentRankingAsync(request, cancellationToken));

    [HttpGet("urgent-items")]
    [ProducesResponseType<IReadOnlyList<UrgentDashboardItemResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<UrgentDashboardItemResponse>>> GetUrgentItems(
        [FromQuery] AdminDashboardFilterRequest request,
        CancellationToken cancellationToken
    ) => Ok(await dashboardService.GetUrgentItemsAsync(request, cancellationToken));

    [HttpGet("recent-activity")]
    [ProducesResponseType<IReadOnlyList<RecentActivityItemResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<RecentActivityItemResponse>>> GetRecentActivity(
        [FromQuery] AdminDashboardFilterRequest request,
        CancellationToken cancellationToken
    ) => Ok(await dashboardService.GetRecentActivityAsync(request, cancellationToken));

    [HttpGet("collective-summary")]
    [ProducesResponseType<CollectiveSummaryResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<CollectiveSummaryResponse>> GetCollectiveSummary(
        [FromQuery] AdminDashboardFilterRequest request,
        CancellationToken cancellationToken
    ) => Ok(await dashboardService.GetCollectiveSummaryAsync(request, cancellationToken));
}
