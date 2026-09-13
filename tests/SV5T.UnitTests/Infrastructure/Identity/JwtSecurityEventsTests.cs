using System.Globalization;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Users.Abstractions;
using SV5T.Domain.Users;
using SV5T.Infrastructure.Identity;
using SV5T.Infrastructure.Options;
using Xunit;
using System.IdentityModel.Tokens.Jwt;

namespace SV5T.UnitTests.Infrastructure.Identity;

public sealed class JwtSecurityEventsTests
{
    private sealed class StubRedisStore : IAuthRedisStore
    {
        public int? CurrentSv { get; set; }
        public int BackfillCount { get; private set; }
        public int? BackfilledSv { get; private set; }

        public Task<OtpIssueResult> ReserveOtpRequestAsync(string email) => Task.FromResult(OtpIssueResult.Allowed);
        public Task<bool> IsLoginBlockedAsync(string email, string ipAddress) => Task.FromResult(false);
        public Task RecordLoginFailureAsync(string email, string ipAddress) => Task.CompletedTask;
        public Task ClearAccountLoginFailuresAsync(string email) => Task.CompletedTask;

        public Task SetUserSecurityVersionAsync(Guid userId, int securityVersion, TimeSpan? expiry = null)
        {
            BackfillCount++;
            BackfilledSv = securityVersion;
            return Task.CompletedTask;
        }

        public Task<int?> GetUserSecurityVersionAsync(Guid userId)
        {
            return Task.FromResult(CurrentSv);
        }
    }

    private sealed class StubUserRepository : IUserRepository
    {
        public User? UserToReturn { get; set; }

        public Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) => Task.FromResult(UserToReturn);
        public Task<SV5T.Application.Users.Dtos.UserSummaryResponse?> GetSummaryByIdAsync(Guid id, CancellationToken cancellationToken = default) => Task.FromResult<SV5T.Application.Users.Dtos.UserSummaryResponse?>(null);
        public Task<User?> GetByNormalizedEmailAsync(string normalizedEmail, bool tracking = false, CancellationToken cancellationToken = default) => Task.FromResult<User?>(null);
        public Task<User?> GetByIdWithProfileAsync(Guid id, bool tracking = false, CancellationToken cancellationToken = default) => Task.FromResult<User?>(null);
        public Task<bool> ExistsStudentCodeAsync(string studentCode, Guid excludeUserId, CancellationToken cancellationToken = default) => Task.FromResult(false);
        public Task AddProfileAsync(UserProfile profile, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task AddAddressAsync(UserAddress address, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task AddAsync(User user, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task<int> DeleteUnverifiedBeforeAsync(DateTime cutoffUtc, CancellationToken cancellationToken = default) => Task.FromResult(0);
    }

    private static (JwtSecurityEvents Events, TokenValidatedContext Context, StubRedisStore Redis, StubUserRepository UserRepo) SetupJwtBearerTest(
        Guid userId,
        string? svClaim,
        User? userInDb = null)
    {
        var services = new ServiceCollection();

        var redis = new StubRedisStore();
        var userRepo = new StubUserRepository { UserToReturn = userInDb };

        services.AddSingleton<IAuthRedisStore>(redis);
        services.AddSingleton<IUserRepository>(userRepo);
        services.AddSingleton(Options.Create(new JwtOptions { AccessTokenMinutes = 15 }));

        var serviceProvider = services.BuildServiceProvider();
        var httpContext = new DefaultHttpContext { RequestServices = serviceProvider };

        var context = new TokenValidatedContext(
            httpContext,
            new AuthenticationScheme("Bearer", null, typeof(JwtBearerHandler)),
            new JwtBearerOptions());

        var claims = new List<Claim>();
        if (userId != Guid.Empty)
        {
            claims.Add(new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()));
        }
        
        if (svClaim != null)
        {
            claims.Add(new Claim("sv", svClaim));
        }

        context.Principal = new ClaimsPrincipal(new ClaimsIdentity(claims));

        var events = new JwtSecurityEvents();

        return (events, context, redis, userRepo);
    }

    [Fact]
    public async Task JwtBearer_RejectsToken_WhenSvClaimIsMissing()
    {
        var (events, context, _, _) = SetupJwtBearerTest(userId: Guid.NewGuid(), svClaim: null);
        
        await events.TokenValidated(context);
        
        Assert.NotNull(context.Result);
        Assert.NotNull(context.Result.Failure);
        Assert.Equal("Missing or invalid security version claim.", context.Result.Failure.Message);
    }

    [Fact]
    public async Task JwtBearer_RejectsToken_WhenSvIsOlderThanDb_WithRedisMiss()
    {
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, SecurityVersion = 3 };
        
        var (events, context, redis, userRepo) = SetupJwtBearerTest(userId: userId, svClaim: "2", userInDb: user);

        // Redis cache miss (default null)
        
        await events.TokenValidated(context);
        
        Assert.NotNull(context.Result);
        Assert.NotNull(context.Result.Failure);
        Assert.Equal("Token has been invalidated.", context.Result.Failure.Message);
        
        // Verify cache backfill occurred!
        Assert.Equal(1, redis.BackfillCount);
        Assert.Equal(3, redis.BackfilledSv);
    }

    [Fact]
    public async Task JwtBearer_AcceptsToken_WhenSvMatchesRedis()
    {
        var userId = Guid.NewGuid();
        var (events, context, redis, _) = SetupJwtBearerTest(userId: userId, svClaim: "3");

        // Redis hit!
        redis.CurrentSv = 3;

        await events.TokenValidated(context);
        
        // Success
        Assert.Null(context.Result);
    }

    [Fact]
    public async Task JwtBearer_AcceptsToken_WhenSubIsMappedToNameIdentifier()
    {
        var userId = Guid.NewGuid();
        var (events, context, redis, _) = SetupJwtBearerTest(userId: Guid.Empty, svClaim: "3");

        // Simulate .NET mapping 'sub' to ClaimTypes.NameIdentifier
        var identity = (ClaimsIdentity)context.Principal!.Identity!;
        identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, userId.ToString()));

        redis.CurrentSv = 3;

        await events.TokenValidated(context);

        // Success
        Assert.Null(context.Result);
    }
}
