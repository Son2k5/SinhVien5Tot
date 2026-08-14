using SV5T.Application.Models.Auth;
using Xunit;

namespace SV5T.UnitTests.Application;

public sealed class TokenIdlePolicyTests
{
    private static readonly TimeSpan IdleTimeout = TimeSpan.FromHours(2);
    [Fact]
    public void ExactlyTwoHoursIdle_IsStillValid_ButAnyLongerExpires()
    {
        var lastActivity = new DateTime(2026, 8, 12, 1, 0, 0, DateTimeKind.Utc);

        Assert.False(TokenIdlePolicy.IsIdleExpired(
            lastActivity,
            lastActivity.AddHours(2),
            IdleTimeout));
        Assert.True(TokenIdlePolicy.IsIdleExpired(
            lastActivity,
            lastActivity.AddHours(2).AddTicks(1),
            IdleTimeout));
    }

    [Fact]
    public void SuccessfulRefreshEveryThirtyMinutes_KeepsTokenFamilyValid()
    {
        var startedAt = new DateTime(2026, 8, 12, 1, 0, 0, DateTimeKind.Utc);
        var lastActivity = startedAt;

        for (var now = startedAt.AddMinutes(30);
             now <= startedAt.AddHours(5);
             now = now.AddMinutes(30))
        {
            Assert.False(TokenIdlePolicy.IsIdleExpired(
                lastActivity,
                now,
                IdleTimeout));
            lastActivity = now;
        }

        Assert.Equal(startedAt.AddHours(5), lastActivity);
    }
}
