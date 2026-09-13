using Microsoft.AspNetCore.Authorization;
using SV5T.Application.Admin.Abstractions;
using SV5T.Application.Common.Exceptions;
using Xunit;

namespace SV5T.UnitTests.Application;

public sealed class AdminDashboardServiceTests
{
    private readonly FakeAdminDashboardRepository fakeRepo = new();
    private readonly AdminDashboardService service;

    public AdminDashboardServiceTests()
    {
        service = new AdminDashboardService(fakeRepo, new AdminDashboardFilterRequestValidator());
    }

    [Fact]
    public async Task Summary_DelegatesToRepositoryAfterValidation()
    {
        var request = new AdminDashboardFilterRequest
        {
            Level = "school",
            DepartmentId = "all"
        };

        var result = await service.GetSummaryAsync(request);

        Assert.Equal(1248, result.TotalRegistered);
        Assert.Equal(1011, result.TotalSubmitted);
        Assert.Equal(45.7m, result.AwardRate);
    }

    [Fact]
    public async Task DepartmentRanking_DelegatesToRepository()
    {
        var rows = await service.GetDepartmentRankingAsync(
            new AdminDashboardFilterRequest { DepartmentId = "it" });

        var row = Assert.Single(rows);
        Assert.Equal("it", row.DepartmentId);
    }

    [Fact]
    public async Task InvalidLevel_IsRejectedByValidator()
    {
        await Assert.ThrowsAsync<UseCaseException>(() =>
            service.GetSummaryAsync(
                new AdminDashboardFilterRequest { Level = "invalid" }));
    }

    [Fact]
    public async Task StatusBreakdown_DelegatesToRepository()
    {
        var result = await service.GetStatusBreakdownAsync(new AdminDashboardFilterRequest());
        Assert.Equal(2, result.Count);
        Assert.Equal("draft", result[0].Status);
    }

    [Fact]
    public async Task StandardGroupRates_DelegatesToRepository()
    {
        var result = await service.GetStandardGroupRatesAsync(new AdminDashboardFilterRequest());
        var ethics = Assert.Single(result);
        Assert.Equal("ETHICS", ethics.GroupCode);
        Assert.Equal(93m, ethics.PassRate);
    }

    [Fact]
    public async Task LevelFunnel_DelegatesToRepository()
    {
        var result = await service.GetLevelFunnelAsync(new AdminDashboardFilterRequest());
        var school = Assert.Single(result);
        Assert.Equal("school", school.Level);
        Assert.Equal(1248, school.Submitted);
    }

    [Fact]
    public async Task UrgentItems_DelegatesToRepository()
    {
        var result = await service.GetUrgentItemsAsync(new AdminDashboardFilterRequest());
        var item = Assert.Single(result);
        Assert.Equal("HS-2026-0182", item.ApplicationId);
    }

    [Fact]
    public async Task RecentActivity_DelegatesToRepository()
    {
        var result = await service.GetRecentActivityAsync(new AdminDashboardFilterRequest());
        var item = Assert.Single(result);
        Assert.Equal("Trần Anh", item.ReviewerName);
    }

    [Fact]
    public async Task CollectiveSummary_DelegatesToRepository()
    {
        var result = await service.GetCollectiveSummaryAsync(new AdminDashboardFilterRequest());
        Assert.Equal(24, result.TotalUnits);
        Assert.Equal(18, result.QualifiedUnits);
    }

    [Fact]
    public void DashboardController_RequiresAdminOrMentor()
    {
        var attribute = Assert.Single(
            typeof(AdminDashboardController)
                .GetCustomAttributes(typeof(AuthorizeAttribute), true)
                .Cast<AuthorizeAttribute>());

        Assert.Equal("Admin,Mentor", attribute.Roles);
    }

    [Theory]
    [InlineData(nameof(AdminCapabilitiesController.GetRoleManagementAccess))]
    [InlineData(nameof(AdminCapabilitiesController.GetStandardConfigurationAccess))]
    public void SensitiveCapabilityEndpoints_RequireAdmin(string actionName)
    {
        var method = typeof(AdminCapabilitiesController).GetMethod(actionName);
        Assert.NotNull(method);
        var attribute = Assert.Single(
            method!.GetCustomAttributes(typeof(AuthorizeAttribute), true)
                .Cast<AuthorizeAttribute>());

        Assert.Equal("Admin", attribute.Roles);
    }

    private sealed class FakeAdminDashboardRepository : IAdminDashboardRepository
    {
        public Task<DashboardSummaryResponse> GetSummaryAsync(
            AdminDashboardFilterRequest request,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(new DashboardSummaryResponse(1248, 1011, 156, 462, 45.7m));

        public Task<IReadOnlyList<StatusBreakdownItemResponse>> GetStatusBreakdownAsync(
            AdminDashboardFilterRequest request,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<StatusBreakdownItemResponse>>(
            [
                new("draft", "Nháp", 126, "#94a3b8"),
                new("submitted", "Đã nộp", 284, "#38bdf8")
            ]);

        public Task<IReadOnlyList<StandardGroupRateItemResponse>> GetStandardGroupRatesAsync(
            AdminDashboardFilterRequest request,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<StandardGroupRateItemResponse>>(
            [
                new("ETHICS", "Đạo đức tốt", 93m, "emerald")
            ]);

        public Task<IReadOnlyList<LevelFunnelItemResponse>> GetLevelFunnelAsync(
            AdminDashboardFilterRequest request,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<LevelFunnelItemResponse>>(
            [
                new("school", "Cấp Trường", 1248, 702)
            ]);

        public Task<IReadOnlyList<DepartmentRankingItemResponse>> GetDepartmentRankingAsync(
            AdminDashboardFilterRequest request,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<DepartmentRankingItemResponse>>(
            [
                new("it", "Khoa Công nghệ thông tin", 238, 132, 55.5m, true)
            ]);

        public Task<IReadOnlyList<UrgentDashboardItemResponse>> GetUrgentItemsAsync(
            AdminDashboardFilterRequest request,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<UrgentDashboardItemResponse>>(
            [
                new("HS-2026-0182", "Nguyễn Minh Anh", 5, DateTime.UtcNow.AddDays(-5), "Quá hạn 5 ngày")
            ]);

        public Task<IReadOnlyList<RecentActivityItemResponse>> GetRecentActivityAsync(
            AdminDashboardFilterRequest request,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<RecentActivityItemResponse>>(
            [
                new("Trần Anh", "TA", "đã duyệt minh chứng Ngoại ngữ", "Nguyễn Mai", DateTime.UtcNow.AddMinutes(-5))
            ]);

        public Task<CollectiveSummaryResponse> GetCollectiveSummaryAsync(
            AdminDashboardFilterRequest request,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(new CollectiveSummaryResponse(24, 18));
    }
}


