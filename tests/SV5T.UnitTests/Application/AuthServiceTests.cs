using FluentValidation;
using SV5T.Application.Auth.Commands.ForgotPassword;
using SV5T.Application.Auth.Commands.Login;
using SV5T.Application.Auth.Commands.Logout;
using SV5T.Application.Auth.Commands.RefreshToken;
using SV5T.Application.Auth.Commands.Register;
using SV5T.Application.Auth.Commands.ResendOtp;
using SV5T.Application.Auth.Commands.ResetPassword;
using SV5T.Application.Auth.Commands.VerifyOtp;
using SV5T.Application.Auth.Commands.VerifyResetOtp;
using SV5T.Application.Auth.Dtos;
using SV5T.Application.Auth.Services;
using SV5T.Application.Auth.Validators;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Models;
using SV5T.Application.Users.Abstractions;
using SV5T.Application.Users.Dtos;
using SV5T.Domain.Auth;
using SV5T.Domain.Auth.Enums;
using SV5T.Domain.Users;
using SV5T.Infrastructure.Security.Hashing;
using Xunit;

namespace SV5T.UnitTests.Application;

public sealed class AuthServiceTests
{
    [Fact]
    public async Task RegisterAsync_DelegatesToRegisterHandler()
    {
        var users = new FakeUserRepository();
        var challenges = new FakeChallengeRepository();
        var email = new FakeEmailQueue();
        var redis = new FakeRedisStore();
        var service = CreateAuthService(users, challenges, email, redis);

        var request = new RegisterRequest("Nguyễn Văn A", "student@ms.hanu.edu.vn", "Password123!");
        var id = await service.RegisterAsync(request);

        Assert.NotEqual(Guid.Empty, id);
        Assert.Single(challenges.Items);
        Assert.Single(email.Messages);
    }

    private static AuthService CreateAuthService(
        IUserRepository users,
        IAuthChallengeStore challenges,
        IEmailQueue email,
        FakeRedisStore redis)
    {
        var unitOfWork = new FakeUnitOfWork();
        var password = new FakePasswordHasher();
        var otp = new FakeOtpService();
        var sha = new FakeSha256Hasher();
        var refreshRepository = new FakeRefreshTokenRepository();

        var registerHandler = new RegisterHandler(
            users,
            challenges,
            password,
            otp,
            redis,
            email,
            new RegisterRequestValidator(new AllowSchoolEmailValidator()));

        var verifyOtpHandler = new VerifyOtpHandler(
            users,
            challenges,
            unitOfWork,
            otp,
            redis,
            new VerifyOtpRequestValidator());

        var resendOtpHandler = new ResendOtpHandler(
            challenges,
            otp,
            redis,
            email,
            new ResendOtpRequestValidator());

        var loginHandler = new LoginHandler(
            users,
            refreshRepository,
            unitOfWork,
            password,
            redis,
            new FakeJwtService(),
            new FakeRefreshTokenFactory(),
            new LoginRequestValidator());

        var refreshTokenHandler = new RefreshTokenHandler(
            users,
            refreshRepository,
            unitOfWork,
            sha,
            new FakeJwtService(),
            new FakeRefreshTokenFactory());

        var logoutHandler = new LogoutHandler(
            refreshRepository,
            unitOfWork,
            sha,
            new FakeRefreshTokenFactory());

        var forgotPasswordHandler = new ForgotPasswordHandler(
            users,
            challenges,
            otp,
            sha,
            redis,
            email,
            Microsoft.Extensions.Logging.Abstractions.NullLogger<ForgotPasswordHandler>.Instance,
            new ForgotPasswordRequestValidator());

        var verifyResetOtpHandler = new VerifyResetOtpHandler(
            challenges,
            otp,
            new VerifyResetOtpRequestValidator());

        var resetPasswordHandler = new ResetPasswordHandler(
            users,
            refreshRepository,
            challenges,
            unitOfWork,
            password,
            otp,
            redis,
            new ResetPasswordRequestValidator());

        return new AuthService(
            registerHandler,
            verifyOtpHandler,
            resendOtpHandler,
            loginHandler,
            refreshTokenHandler,
            logoutHandler,
            forgotPasswordHandler,
            verifyResetOtpHandler,
            resetPasswordHandler);
    }

    private sealed class AllowSchoolEmailValidator : ISchoolEmailValidator
    {
        public bool IsAllowed(string email) => true;
    }

    private sealed class FakeUserRepository : IUserRepository
    {
        public List<User> Items { get; } = [];

        public Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items.FirstOrDefault(x => x.Id == id));

        public Task<UserSummaryResponse?> GetSummaryByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult<UserSummaryResponse?>(null);

        public Task<User?> GetByNormalizedEmailAsync(string normalizedEmail, bool tracking = false, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items.FirstOrDefault(x => x.NormalizedEmail == normalizedEmail));

        public Task<User?> GetByIdWithProfileAsync(Guid id, bool tracking = false, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items.FirstOrDefault(x => x.Id == id));

        public Task<bool> ExistsStudentCodeAsync(string studentCode, Guid excludeUserId, CancellationToken cancellationToken = default) =>
            Task.FromResult(false);

        public Task AddProfileAsync(UserProfile profile, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task AddAddressAsync(UserAddress address, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task AddAsync(User user, CancellationToken cancellationToken = default)
        {
            Items.Add(user);
            return Task.CompletedTask;
        }
        public Task<int> DeleteUnverifiedBeforeAsync(DateTime cutoffUtc, CancellationToken cancellationToken = default) => Task.FromResult(0);
    }

    private sealed class FakeChallengeRepository : IAuthChallengeStore
    {
        public List<AuthChallengeData> Items { get; } = [];

        public Task<AuthChallengeData?> GetAsync(Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items.FirstOrDefault(challenge => challenge.Id == id));

        public Task StoreAsync(AuthChallengeData challenge, CancellationToken cancellationToken = default)
        {
            Items.Add(challenge);
            return Task.CompletedTask;
        }

        public Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
        {
            Items.RemoveAll(challenge => challenge.Id == id);
            return Task.CompletedTask;
        }

        public Task<int> IncrementFailureAsync(Guid id, AuthChallengePurpose purpose, DateTime nowUtc, CancellationToken cancellationToken = default) =>
            Task.FromResult(1);

        public Task<bool> TryConsumeAsync(Guid id, AuthChallengePurpose purpose, string expectedOtpHash, DateTime consumedAtUtc, CancellationToken cancellationToken = default)
        {
            var index = Items.FindIndex(item => item.Id == id);
            if (index < 0 || Items[index].OtpHash != expectedOtpHash)
            {
                return Task.FromResult(false);
            }
            Items.RemoveAt(index);
            return Task.FromResult(true);
        }

        public Task<bool> TryReplaceOtpAsync(Guid id, AuthChallengePurpose purpose, string otpHash, DateTime expiresAtUtc, DateTime updatedAtUtc, CancellationToken cancellationToken = default) =>
            Task.FromResult(true);
    }

    private sealed class FakeEmailQueue : IEmailQueue
    {
        public List<EmailMessage> Messages { get; } = [];

        public Task<Guid> EnqueueAsync(EmailMessage message, CancellationToken cancellationToken = default)
        {
            Messages.Add(message);
            return Task.FromResult(Guid.NewGuid());
        }
    }

    private sealed class FakeRedisStore : IAuthRedisStore
    {
        public Task<OtpIssueResult> ReserveOtpRequestAsync(string email) => Task.FromResult(OtpIssueResult.Allowed);
        public Task<bool> IsLoginBlockedAsync(string email, string ipAddress) => Task.FromResult(false);
        public Task RecordLoginFailureAsync(string email, string ipAddress) => Task.CompletedTask;
        public Task ClearAccountLoginFailuresAsync(string email) => Task.CompletedTask;
        public Task SetUserSecurityVersionAsync(Guid userId, int securityVersion, TimeSpan? expiry = null) => Task.CompletedTask;
        public Task<int?> GetUserSecurityVersionAsync(Guid userId) => Task.FromResult<int?>(null);
    }

    private sealed class FakePasswordHasher : IPasswordHasher
    {
        public string Hash(string password) => $"hash:{password}";
        public bool Verify(string password, string? passwordHash) => passwordHash == $"hash:{password}";
    }

    private sealed class FakeOtpService : IOtpService
    {
        public TimeSpan Expiry => TimeSpan.FromMinutes(5);
        public int MaxAttempts => 5;
        public string Generate() => "123456";
        public string Hash(string otp) => $"hash:{otp}";
        public bool FixedTimeEquals(string left, string right) => string.Equals(left, right, StringComparison.Ordinal);
    }

    private sealed class FakeSha256Hasher : ISha256Hasher
    {
        public string Hash(string input) => $"sha:{input}";
        public string HashIdentifier(string input) => $"id:{input.Trim().ToLowerInvariant()}";
        public string HashToken(string token) => $"token:{token}";
        public bool VerifyToken(string rawToken, string tokenHash) => tokenHash == HashToken(rawToken);
    }

    private sealed class FakeJwtService : IJwtService
    {
        public GeneratedAccessToken Generate(User user) => new("access", "jti", DateTime.UtcNow.AddMinutes(15));
    }

    private sealed class FakeRefreshTokenFactory : IRefreshTokenFactory
    {
        public TimeSpan IdleTimeout => TimeSpan.FromHours(2);
        public GeneratedRefreshToken Generate(bool isPersistent, DateTime? absoluteExpiresAtUtc = null) =>
            new(Guid.NewGuid(), "refresh", "hash", DateTime.UtcNow.AddDays(7), DateTime.UtcNow.AddDays(7), isPersistent);
        public bool TryGetTokenId(string rawToken, out Guid tokenId)
        {
            tokenId = Guid.NewGuid();
            return true;
        }
    }

    private sealed class FakeRefreshTokenRepository : IRefreshTokenRepository
    {
        public Task AddAsync(SV5T.Domain.Auth.RefreshToken token, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task<SV5T.Domain.Auth.RefreshToken?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) => Task.FromResult<SV5T.Domain.Auth.RefreshToken?>(null);
        public Task<int> TryRevokeActiveAsync(Guid id, Guid userId, string currentTokenHash, DateTime revokedAtUtc, Guid? replacedByTokenId = null, CancellationToken cancellationToken = default) => Task.FromResult(1);
        public Task<int> RevokeFamilyAsync(Guid familyId, Guid userId, DateTime revokedAtUtc, CancellationToken cancellationToken = default) => Task.FromResult(1);
        public Task<int> RevokeAllActiveAsync(Guid userId, DateTime revokedAtUtc, CancellationToken cancellationToken = default) => Task.FromResult(1);
        public Task<int> RevokeExcessActiveAsync(Guid userId, DateTime nowUtc, CancellationToken cancellationToken = default) => Task.FromResult(0);
        public Task<int> DeleteStaleAsync(DateTime cutoffUtc, CancellationToken cancellationToken = default) => Task.FromResult(0);
    }

    private sealed class FakeUnitOfWork : IUnitOfWork
    {
        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => Task.FromResult(1);
        public Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken cancellationToken = default) => operation(cancellationToken);
    }
}
