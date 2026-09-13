using FluentValidation;
using MediatR;
using SV5T.Application.Admin.Abstractions;
using SV5T.Application.Admin.Dtos;

namespace SV5T.Application.Admin.Dashboard.Queries;

// 1. Summary
public sealed record GetDashboardSummaryQuery(AdminDashboardFilterRequest Request)
    : IRequest<DashboardSummaryResponse>;

public sealed class GetDashboardSummaryQueryValidator : AbstractValidator<GetDashboardSummaryQuery>
{
    public GetDashboardSummaryQueryValidator(IValidator<AdminDashboardFilterRequest> filterValidator)
    {
        RuleFor(x => x.Request).NotNull().WithMessage("Thiếu thông tin bộ lọc.");
        RuleFor(x => x.Request).SetValidator(filterValidator!);
    }
}

public sealed class GetDashboardSummaryQueryHandler(IAdminDashboardRepository repository)
    : IRequestHandler<GetDashboardSummaryQuery, DashboardSummaryResponse>
{
    public Task<DashboardSummaryResponse> Handle(GetDashboardSummaryQuery query, CancellationToken cancellationToken) =>
        repository.GetSummaryAsync(query.Request, cancellationToken);
}

// 2. Status Breakdown
public sealed record GetStatusBreakdownQuery(AdminDashboardFilterRequest Request)
    : IRequest<IReadOnlyList<StatusBreakdownItemResponse>>;

public sealed class GetStatusBreakdownQueryValidator : AbstractValidator<GetStatusBreakdownQuery>
{
    public GetStatusBreakdownQueryValidator(IValidator<AdminDashboardFilterRequest> filterValidator)
    {
        RuleFor(x => x.Request).NotNull().WithMessage("Thiếu thông tin bộ lọc.");
        RuleFor(x => x.Request).SetValidator(filterValidator!);
    }
}

public sealed class GetStatusBreakdownQueryHandler(IAdminDashboardRepository repository)
    : IRequestHandler<GetStatusBreakdownQuery, IReadOnlyList<StatusBreakdownItemResponse>>
{
    public Task<IReadOnlyList<StatusBreakdownItemResponse>> Handle(GetStatusBreakdownQuery query, CancellationToken cancellationToken) =>
        repository.GetStatusBreakdownAsync(query.Request, cancellationToken);
}

// 3. Standard Group Rates
public sealed record GetStandardGroupRatesQuery(AdminDashboardFilterRequest Request)
    : IRequest<IReadOnlyList<StandardGroupRateItemResponse>>;

public sealed class GetStandardGroupRatesQueryValidator : AbstractValidator<GetStandardGroupRatesQuery>
{
    public GetStandardGroupRatesQueryValidator(IValidator<AdminDashboardFilterRequest> filterValidator)
    {
        RuleFor(x => x.Request).NotNull().WithMessage("Thiếu thông tin bộ lọc.");
        RuleFor(x => x.Request).SetValidator(filterValidator!);
    }
}

public sealed class GetStandardGroupRatesQueryHandler(IAdminDashboardRepository repository)
    : IRequestHandler<GetStandardGroupRatesQuery, IReadOnlyList<StandardGroupRateItemResponse>>
{
    public Task<IReadOnlyList<StandardGroupRateItemResponse>> Handle(GetStandardGroupRatesQuery query, CancellationToken cancellationToken) =>
        repository.GetStandardGroupRatesAsync(query.Request, cancellationToken);
}

// 4. Level Funnel
public sealed record GetLevelFunnelQuery(AdminDashboardFilterRequest Request)
    : IRequest<IReadOnlyList<LevelFunnelItemResponse>>;

public sealed class GetLevelFunnelQueryValidator : AbstractValidator<GetLevelFunnelQuery>
{
    public GetLevelFunnelQueryValidator(IValidator<AdminDashboardFilterRequest> filterValidator)
    {
        RuleFor(x => x.Request).NotNull().WithMessage("Thiếu thông tin bộ lọc.");
        RuleFor(x => x.Request).SetValidator(filterValidator!);
    }
}

public sealed class GetLevelFunnelQueryHandler(IAdminDashboardRepository repository)
    : IRequestHandler<GetLevelFunnelQuery, IReadOnlyList<LevelFunnelItemResponse>>
{
    public Task<IReadOnlyList<LevelFunnelItemResponse>> Handle(GetLevelFunnelQuery query, CancellationToken cancellationToken) =>
        repository.GetLevelFunnelAsync(query.Request, cancellationToken);
}

// 5. Department Ranking
public sealed record GetDepartmentRankingQuery(AdminDashboardFilterRequest Request)
    : IRequest<IReadOnlyList<DepartmentRankingItemResponse>>;

public sealed class GetDepartmentRankingQueryValidator : AbstractValidator<GetDepartmentRankingQuery>
{
    public GetDepartmentRankingQueryValidator(IValidator<AdminDashboardFilterRequest> filterValidator)
    {
        RuleFor(x => x.Request).NotNull().WithMessage("Thiếu thông tin bộ lọc.");
        RuleFor(x => x.Request).SetValidator(filterValidator!);
    }
}

public sealed class GetDepartmentRankingQueryHandler(IAdminDashboardRepository repository)
    : IRequestHandler<GetDepartmentRankingQuery, IReadOnlyList<DepartmentRankingItemResponse>>
{
    public Task<IReadOnlyList<DepartmentRankingItemResponse>> Handle(GetDepartmentRankingQuery query, CancellationToken cancellationToken) =>
        repository.GetDepartmentRankingAsync(query.Request, cancellationToken);
}

// 6. Urgent Items
public sealed record GetUrgentItemsQuery(AdminDashboardFilterRequest Request)
    : IRequest<IReadOnlyList<UrgentDashboardItemResponse>>;

public sealed class GetUrgentItemsQueryValidator : AbstractValidator<GetUrgentItemsQuery>
{
    public GetUrgentItemsQueryValidator(IValidator<AdminDashboardFilterRequest> filterValidator)
    {
        RuleFor(x => x.Request).NotNull().WithMessage("Thiếu thông tin bộ lọc.");
        RuleFor(x => x.Request).SetValidator(filterValidator!);
    }
}

public sealed class GetUrgentItemsQueryHandler(IAdminDashboardRepository repository)
    : IRequestHandler<GetUrgentItemsQuery, IReadOnlyList<UrgentDashboardItemResponse>>
{
    public Task<IReadOnlyList<UrgentDashboardItemResponse>> Handle(GetUrgentItemsQuery query, CancellationToken cancellationToken) =>
        repository.GetUrgentItemsAsync(query.Request, cancellationToken);
}

// 7. Recent Activity
public sealed record GetRecentActivityQuery(AdminDashboardFilterRequest Request)
    : IRequest<IReadOnlyList<RecentActivityItemResponse>>;

public sealed class GetRecentActivityQueryValidator : AbstractValidator<GetRecentActivityQuery>
{
    public GetRecentActivityQueryValidator(IValidator<AdminDashboardFilterRequest> filterValidator)
    {
        RuleFor(x => x.Request).NotNull().WithMessage("Thiếu thông tin bộ lọc.");
        RuleFor(x => x.Request).SetValidator(filterValidator!);
    }
}

public sealed class GetRecentActivityQueryHandler(IAdminDashboardRepository repository)
    : IRequestHandler<GetRecentActivityQuery, IReadOnlyList<RecentActivityItemResponse>>
{
    public Task<IReadOnlyList<RecentActivityItemResponse>> Handle(GetRecentActivityQuery query, CancellationToken cancellationToken) =>
        repository.GetRecentActivityAsync(query.Request, cancellationToken);
}

// 8. Collective Summary
public sealed record GetCollectiveSummaryQuery(AdminDashboardFilterRequest Request)
    : IRequest<CollectiveSummaryResponse>;

public sealed class GetCollectiveSummaryQueryValidator : AbstractValidator<GetCollectiveSummaryQuery>
{
    public GetCollectiveSummaryQueryValidator(IValidator<AdminDashboardFilterRequest> filterValidator)
    {
        RuleFor(x => x.Request).NotNull().WithMessage("Thiếu thông tin bộ lọc.");
        RuleFor(x => x.Request).SetValidator(filterValidator!);
    }
}

public sealed class GetCollectiveSummaryQueryHandler(IAdminDashboardRepository repository)
    : IRequestHandler<GetCollectiveSummaryQuery, CollectiveSummaryResponse>
{
    public Task<CollectiveSummaryResponse> Handle(GetCollectiveSummaryQuery query, CancellationToken cancellationToken) =>
        repository.GetCollectiveSummaryAsync(query.Request, cancellationToken);
}
