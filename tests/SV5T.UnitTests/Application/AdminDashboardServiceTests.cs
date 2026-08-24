using Microsoft.AspNetCore.Authorization;
using SV5T.Application.Common.Exceptions;
using Xunit;

namespace SV5T.UnitTests.Application;

public sealed class AdminDashboardServiceTests
{
    private readonly AdminDashboardService service =
        new(new AdminDashboardFilterRequestValidator());

    [Fact]
    public async Task Summary_AppliesLevelAndDepartmentScope()
    {
        var allSchool = await service.GetSummaryAsync(new AdminDashboardFilterRequest
        {
            Level = "school",
            DepartmentId = "all"
        });
        var scopedCentral = await service.GetSummaryAsync(new AdminDashboardFilterRequest
        {
            Level = "central",
            DepartmentId = "it"
        });

        Assert.True(allSchool.TotalRegistered > scopedCentral.TotalRegistered);
        Assert.InRange(allSchool.AwardRate, 0, 100);
    }

    [Fact]
    public async Task DepartmentRanking_OnlyReturnsRequestedDepartment()
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
}


