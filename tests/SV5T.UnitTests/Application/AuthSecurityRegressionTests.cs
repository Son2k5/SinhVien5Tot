using FluentValidation;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
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
using SV5T.Application.Auth.Validators;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Common.Models;
using SV5T.Infrastructure.Security.Hashing;
using Xunit;

namespace SV5T.UnitTests.Application;

public sealed class AuthSecurityRegressionTests
{
    [Fact]
    public async Task Register_DoesNotOverwriteUnverifiedUsersPassword()
    {
        var existing = new User
        {
            Email = "student@ms.hanu.edu.vn",
            NormalizedEmail = "STUDENT@MS.HANU.EDU.VN",
            PasswordHash = "original-hash",
            IsVerified = false
        };
        var users = new FakeUserRepository(existing);
        var challenges = new FakeChallengeRepository();
        var email = new FakeEmailQueue();
        var service = CreateService(users, challenges, email, new FakeRedisStore());

        var registrationId = await service.RegisterAsync(
            new RegisterRequest("Nguyễn Minh Anh", existing.Email, "AttackerPassword123"));

        Assert.NotEqual(Guid.Empty, registrationId);
        Assert.Equal("original-hash", existing.PasswordHash);
        var challenge = Assert.Single(challenges.Items);
        Assert.Equal(registrationId, challenge.Id);
        Assert.Equal("Nguyễn Minh Anh", challenge.DisplayName);
        Assert.Equal("hash:AttackerPassword123", challenge.PasswordHash);
        Assert.Single(email.Messages);
    }

    [Fact]
    public async Task Register_RemovesChallengeWhenEmailQueueFails()
    {
        var challenges = new FakeChallengeRepository();
        var service = CreateService(
            new FakeUserRepository(),
            challenges,
            new FakeEmailQueue(failEnqueue: true),
            new FakeRedisStore());

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.RegisterAsync(new RegisterRequest(
                "Nguyễn Minh Anh",
                "student@ms.hanu.edu.vn",
                "ValidPassword123")));

        Assert.Empty(challenges.Items);
    }

    [Fact]
    public async Task ResetPassword_RevokesRefreshSessions()
    {
        var user = new User
        {
            Email = "student@ms.hanu.edu.vn",
            NormalizedEmail = "STUDENT@MS.HANU.EDU.VN",
            PasswordHash = "old-hash",
            IsVerified = true,
            IsActive = true
        };
        var challenge = PasswordResetChallenge(user);
        var challenges = new FakeChallengeRepository(challenge);
        var redis = new FakeRedisStore();
        var refreshTokens = new FakeRefreshTokenRepository();
        var service = CreateService(
            new FakeUserRepository(user),
            challenges,
            new FakeEmailQueue(),
            redis,
            refreshTokens: refreshTokens);

        await service.ResetPasswordAsync(
            new ResetPasswordRequest(challenge.Id, "123456", "NewPassword123"));

        Assert.Equal("hash:NewPassword123", user.PasswordHash);
        Assert.Equal(2, user.SecurityVersion);
        Assert.Equal(user.Id, refreshTokens.RevokedUserId);
        Assert.DoesNotContain(challenge, challenges.Items);
    }

    [Fact]
    public async Task VerifyResetOtp_DoesNotChangePasswordOrConsumeChallenge()
    {
        var user = new User
        {
            Email = "student@ms.hanu.edu.vn",
            NormalizedEmail = "STUDENT@MS.HANU.EDU.VN",
            PasswordHash = "old-hash",
            IsVerified = true,
            IsActive = true
        };
        var challenge = PasswordResetChallenge(user);
        var challenges = new FakeChallengeRepository(challenge);
        var service = CreateService(
            new FakeUserRepository(user),
            challenges,
            new FakeEmailQueue(),
            new FakeRedisStore());

        await service.VerifyResetOtpAsync(
            new VerifyResetOtpRequest(challenge.Id, "123456"));

        Assert.Equal("old-hash", user.PasswordHash);
        Assert.Contains(challenge, challenges.Items);
    }

    [Fact]
    public void Jwt_IsStatelessAndUsesConfiguredFifteenMinuteLifetime()
    {
        var service = new JwtService(
            Options.Create(new JwtOptions
            {
                Issuer = "tests",
                Audience = "tests",
                Key = "a-test-key-that-is-at-least-thirty-two-bytes-long",
                AccessTokenMinutes = 15
            }));

        var before = DateTime.UtcNow;
        var generated = service.Generate(new User
        {
            Email = "student@ms.hanu.edu.vn",
            SecurityVersion = 3
        });
        var token = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler()
            .ReadJwtToken(generated.Token);

        Assert.Contains(token.Claims, claim => claim.Type == "sv" && claim.Value == "3");
        Assert.DoesNotContain(token.Claims, claim => claim.Type == "fid");
        Assert.InRange(
            generated.ExpiresAtUtc,
            before.AddMinutes(15).AddSeconds(-1),
            before.AddMinutes(15).AddSeconds(1));
    }

    [Fact]
    public async Task Refresh_ReuseRevokesEntireTokenFamily()
    {
        var user = new User
        {
            Email = "student@ms.hanu.edu.vn",
            NormalizedEmail = "STUDENT@MS.HANU.EDU.VN",
            IsVerified = true,
            IsActive = true
        };
        var redis = new FakeRedisStore();
        var familyId = Guid.NewGuid();
        var reusedToken = new RefreshToken
        {
            Id = FakeRefreshTokenFactory.TokenId,
            UserId = user.Id,
            FamilyId = familyId,
            Token = "refresh",
            IsRevoked = true,
            RevokedAtUtc = DateTime.UtcNow,
            ExpiresAtUtc = DateTime.UtcNow.AddDays(1)
        };
        var activeToken = new RefreshToken
        {
            UserId = user.Id,
            FamilyId = familyId,
            Token = "next-refresh",
            ExpiresAtUtc = DateTime.UtcNow.AddDays(1)
        };
        var refreshTokens = new FakeRefreshTokenRepository(
            reusedToken,
            activeToken);
        var service = CreateService(
            new FakeUserRepository(user),
            new FakeChallengeRepository(),
            new FakeEmailQueue(),
            redis,
            refreshTokens: refreshTokens);

        await Assert.ThrowsAsync<UseCaseException>(() =>
            service.RefreshAsync("refresh"));

        Assert.True(activeToken.IsRevoked);
    }

    [Fact]
    public async Task Refresh_RejectsExpiredToken()
    {
        var user = new User
        {
            Email = "student@ms.hanu.edu.vn",
            NormalizedEmail = "STUDENT@MS.HANU.EDU.VN",
            IsVerified = true,
            IsActive = true
        };
        var refreshTokens = new FakeRefreshTokenRepository(new RefreshToken
        {
            Id = FakeRefreshTokenFactory.TokenId,
            UserId = user.Id,
            Token = "refresh",
            ExpiresAtUtc = DateTime.UtcNow.AddMinutes(-1),
            AbsoluteExpiresAtUtc = DateTime.UtcNow.AddDays(1)
        });
        var service = CreateService(
            new FakeUserRepository(user),
            new FakeChallengeRepository(),
            new FakeEmailQueue(),
            new FakeRedisStore(),
            refreshTokens: refreshTokens);

        var exception = await Assert.ThrowsAsync<UseCaseException>(() =>
            service.RefreshAsync("refresh"));

        Assert.Equal(ApplicationErrorKind.Unauthorized, exception.Kind);
        Assert.Equal("invalid_session", exception.ErrorCode);
    }

    [Fact]
    public async Task Login_PerformsPasswordWorkForUnknownAccount()
    {
        var passwordHasher = new TrackingPasswordHasher();
        var service = CreateService(
            new FakeUserRepository(),
            new FakeChallengeRepository(),
            new FakeEmailQueue(),
            new FakeRedisStore(),
            passwordHasher);

        await Assert.ThrowsAsync<UseCaseException>(() => service.LoginAsync(
            new LoginRequest("missing@ms.hanu.edu.vn", "Password123"),
            "127.0.0.1"));

        Assert.Equal(1, passwordHasher.VerifyCalls);
        Assert.Null(passwordHasher.LastHash);
    }

    [Fact]
    public async Task Login_CreatesTokenFamilyWithCurrentActivity()
    {
        var user = new User
        {
            Email = "student@ms.hanu.edu.vn",
            NormalizedEmail = "STUDENT@MS.HANU.EDU.VN",
            PasswordHash = "hash:Password123",
            IsVerified = true,
            IsActive = true
        };
        var refreshTokens = new FakeRefreshTokenRepository();
        var service = CreateService(
            new FakeUserRepository(user),
            new FakeChallengeRepository(),
            new FakeEmailQueue(),
            new FakeRedisStore(),
            refreshTokens: refreshTokens);
        var before = DateTime.UtcNow;

        await service.LoginAsync(
            new LoginRequest(user.Email, "Password123"),
            "127.0.0.1");

        var refreshToken = Assert.Single(refreshTokens.Items);
        Assert.InRange(
            refreshToken.LastUsedAtUtc,
            before,
            DateTime.UtcNow);
        Assert.NotEqual(Guid.Empty, refreshToken.FamilyId);
        Assert.Equal(refreshToken.ExpiresAtUtc, refreshToken.AbsoluteExpiresAtUtc);
    }

    [Fact]
    public async Task Refresh_SucceedsBeforeIdleTimeoutAndUpdatesLastUsedTime()
    {
        var user = ActiveUser();
        var lastActivity = DateTime.UtcNow.AddMinutes(-119);
        var oldToken = ActiveRefreshToken(user, lastActivity);
        var refreshTokens = new FakeRefreshTokenRepository(oldToken);
        var service = CreateService(
            new FakeUserRepository(user),
            new FakeChallengeRepository(),
            new FakeEmailQueue(),
            new FakeRedisStore(),
            refreshTokens: refreshTokens);

        var beforeRefresh = DateTime.UtcNow;
        var tokens = await service.RefreshAsync("refresh");

        Assert.NotEmpty(tokens.AccessToken);
        Assert.Equal(lastActivity, oldToken.LastUsedAtUtc);
        Assert.True(oldToken.IsRevoked);
        Assert.NotNull(oldToken.ReplacedByTokenId);
        Assert.Contains(
            refreshTokens.Items,
            token => token.Id == oldToken.ReplacedByTokenId &&
                     token.FamilyId == oldToken.FamilyId &&
                     token.LastUsedAtUtc >= beforeRefresh &&
                     token.LastUsedAtUtc <= DateTime.UtcNow &&
                     !token.IsRevoked);
    }

    [Fact]
    public async Task Refresh_RejectsAndRevokesFamilyAfterTwoHoursIdle()
    {
        var user = ActiveUser();
        var refreshToken = ActiveRefreshToken(
            user,
            DateTime.UtcNow.AddHours(-2).AddSeconds(-1));
        var service = CreateService(
            new FakeUserRepository(user),
            new FakeChallengeRepository(),
            new FakeEmailQueue(),
            new FakeRedisStore(),
            refreshTokens: new FakeRefreshTokenRepository(refreshToken));

        var exception = await Assert.ThrowsAsync<UseCaseException>(
            () => service.RefreshAsync("refresh"));

        Assert.Equal("idle_timeout", exception.ErrorCode);
        Assert.True(refreshToken.IsRevoked);
    }

    [Fact]
    public async Task Logout_RevokesWholeTokenFamily()
    {
        var user = ActiveUser();
        var refreshToken = ActiveRefreshToken(user, DateTime.UtcNow);
        var refreshTokens = new FakeRefreshTokenRepository(refreshToken);
        var service = CreateService(
            new FakeUserRepository(user),
            new FakeChallengeRepository(),
            new FakeEmailQueue(),
            new FakeRedisStore(),
            refreshTokens: refreshTokens);

        await service.LogoutAsync(user.Id, "refresh");

        Assert.True(refreshToken.IsRevoked);
    }

    [Fact]
    public async Task Validators_RejectNullAndOversizedSecurityInputs()
    {
        var school = new AllowSchoolEmailValidator();
        var register = new RegisterRequestValidator(school);
        var verify = new VerifyOtpRequestValidator();
        var verifyReset = new VerifyResetOtpRequestValidator();
        var reset = new ResetPasswordRequestValidator();

        Assert.False((await register.ValidateAsync(
            new RegisterRequest("Nguyễn Minh Anh", "student@ms.hanu.edu.vn", null!))).IsValid);
        Assert.False((await register.ValidateAsync(
            new RegisterRequest(
                "Nguyễn Minh Anh",
                "student@ms.hanu.edu.vn",
                new string('A', 129) + "1"))).IsValid);
        Assert.False((await verify.ValidateAsync(
            new VerifyOtpRequest(Guid.NewGuid(), null!))).IsValid);
        Assert.False((await verifyReset.ValidateAsync(
            new VerifyResetOtpRequest(Guid.NewGuid(), null!))).IsValid);
        Assert.False((await reset.ValidateAsync(
            new ResetPasswordRequest(Guid.NewGuid(), "123456", null!))).IsValid);
    }

    [Fact]
    public void IdentifierHash_IsKeyedAndDeterministic()
    {
        var first = new Sha256Hasher(Options.Create(new IdentifierHashOptions
        {
            Key = new string('A', 32)
        }));
        var second = new Sha256Hasher(Options.Create(new IdentifierHashOptions
        {
            Key = new string('B', 32)
        }));

        var firstHash = first.HashIdentifier("student@ms.hanu.edu.vn");

        Assert.Equal(
            firstHash,
            first.HashIdentifier("STUDENT@ms.hanu.edu.vn"));
        Assert.NotEqual(
            firstHash,
            second.HashIdentifier("student@ms.hanu.edu.vn"));
    }

    private sealed class TestAuthDispatcher(
        RegisterHandler registerHandler,
        VerifyOtpHandler verifyOtpHandler,
        ResendOtpHandler resendOtpHandler,
        LoginHandler loginHandler,
        RefreshTokenHandler refreshTokenHandler,
        LogoutHandler logoutHandler,
        ForgotPasswordHandler forgotPasswordHandler,
        VerifyResetOtpHandler verifyResetOtpHandler,
        ResetPasswordHandler resetPasswordHandler)
    {
        public Task<Guid> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default) =>
            registerHandler.Handle(new RegisterCommand(request.Name, request.Email, request.Password), cancellationToken);

        public Task VerifyOtpAsync(VerifyOtpRequest request, CancellationToken cancellationToken = default) =>
            verifyOtpHandler.Handle(new VerifyOtpCommand(request.RegistrationId, request.Otp), cancellationToken);

        public Task ResendOtpAsync(ResendOtpRequest request, CancellationToken cancellationToken = default) =>
            resendOtpHandler.Handle(new ResendOtpCommand(request.RegistrationId), cancellationToken);

        public Task<AuthTokens> LoginAsync(LoginRequest request, string ipAddress, CancellationToken cancellationToken = default) =>
            loginHandler.Handle(new LoginCommand(request, ipAddress), cancellationToken);

        public Task<AuthTokens> RefreshAsync(string refreshToken, CancellationToken cancellationToken = default) =>
            refreshTokenHandler.Handle(new RefreshTokenCommand(refreshToken), cancellationToken);

        public Task<Guid> ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken cancellationToken = default) =>
            forgotPasswordHandler.Handle(new ForgotPasswordCommand(request.Email), cancellationToken);

        public Task VerifyResetOtpAsync(VerifyResetOtpRequest request, CancellationToken cancellationToken = default) =>
            verifyResetOtpHandler.Handle(new VerifyResetOtpCommand(request.ResetId, request.Otp), cancellationToken);

        public Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default) =>
            resetPasswordHandler.Handle(new ResetPasswordCommand(request.ResetId, request.Otp, request.NewPassword), cancellationToken);

        public Task LogoutAsync(Guid userId, string? refreshToken, CancellationToken cancellationToken = default) =>
            logoutHandler.Handle(new LogoutCommand(userId, refreshToken), cancellationToken);
    }

    private static TestAuthDispatcher CreateService(
        IUserRepository users,
        IAuthChallengeStore challenges,
        IEmailQueue email,
        FakeRedisStore redis,
        IPasswordHasher? passwordHasher = null,
        FakeRefreshTokenRepository? refreshTokens = null)
    {
        var refreshRepository = refreshTokens ?? new FakeRefreshTokenRepository();
        var unitOfWork = new FakeUnitOfWork();
        var password = passwordHasher ?? new FakePasswordHasher();
        var otp = new FakeOtpService();
        var sha = new FakeSha256Hasher();
        var registerHandler = new RegisterHandler(
            users,
            challenges,
            password,
            otp,
            redis,
            email);

        var verifyOtpHandler = new VerifyOtpHandler(
            users,
            challenges,
            unitOfWork,
            otp,
            redis);

        var resendOtpHandler = new ResendOtpHandler(
            challenges,
            otp,
            redis,
            email);

        var loginHandler = new LoginHandler(
            users,
            refreshRepository,
            unitOfWork,
            password,
            redis,
            new FakeJwtService(),
            new FakeRefreshTokenFactory());

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
            NullLogger<ForgotPasswordHandler>.Instance);

        var verifyResetOtpHandler = new VerifyResetOtpHandler(
            challenges,
            otp);

        var resetPasswordHandler = new ResetPasswordHandler(
            users,
            refreshRepository,
            challenges,
            unitOfWork,
            password,
            otp,
            redis);

        return new TestAuthDispatcher(
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

    private static User ActiveUser() =>
        new()
        {
            Email = "student@ms.hanu.edu.vn",
            NormalizedEmail = "STUDENT@MS.HANU.EDU.VN",
            PasswordHash = "hash:Password123",
            IsVerified = true,
            IsActive = true
        };

    private static RefreshToken ActiveRefreshToken(
        User user,
        DateTime lastUsedAtUtc) =>
        new()
        {
            Id = FakeRefreshTokenFactory.TokenId,
            UserId = user.Id,
            FamilyId = Guid.NewGuid(),
            Token = "refresh",
            CreatedAtUtc = DateTime.UtcNow.AddMinutes(-10),
            LastUsedAtUtc = lastUsedAtUtc,
            ExpiresAtUtc = DateTime.UtcNow.AddDays(1),
            AbsoluteExpiresAtUtc = DateTime.UtcNow.AddDays(1)
        };

    private static AuthChallengeData PasswordResetChallenge(User user)
    {
        var now = DateTime.UtcNow;
        return new AuthChallengeData(
            Guid.NewGuid(),
            AuthChallengePurpose.PasswordReset,
            user.Email,
            user.NormalizedEmail,
            null,
            null,
            "otp:123456",
            0,
            5,
            now.AddMinutes(3),
            now);
    }

    private sealed class AllowSchoolEmailValidator : ISchoolEmailValidator
    {
        public bool IsAllowed(string email) =>
            email.EndsWith("@ms.hanu.edu.vn", StringComparison.OrdinalIgnoreCase);
    }

    private sealed class FakePasswordHasher : IPasswordHasher
    {
        public string Hash(string password) => $"hash:{password}";

        public bool Verify(string password, string? passwordHash) =>
            passwordHash == Hash(password);
    }

    private sealed class TrackingPasswordHasher : IPasswordHasher
    {
        public int VerifyCalls { get; private set; }
        public string? LastHash { get; private set; }

        public string Hash(string password) => $"hash:{password}";

        public bool Verify(string password, string? passwordHash)
        {
            VerifyCalls++;
            LastHash = passwordHash;
            return false;
        }
    }

    private sealed class FakeOtpService : IOtpService
    {
        public TimeSpan Expiry => TimeSpan.FromMinutes(3);
        public int MaxAttempts => 5;
        public string Generate() => "123456";
        public string Hash(string otp) => $"otp:{otp}";
        public bool FixedTimeEquals(string leftHash, string rightHash) =>
            string.Equals(leftHash, rightHash, StringComparison.Ordinal);
    }

    private sealed class FakeSha256Hasher : ISha256Hasher
    {
        public string HashToken(string token) => token;
        public string HashIdentifier(string value) => new string('A', 64);
        public bool VerifyToken(string token, string expectedHash) => token == expectedHash;
    }

    private sealed class FakeUserRepository(params User[] users) : IUserRepository
    {
        private readonly List<User> items = [.. users];

        public Task<User?> GetByIdAsync(
            Guid id,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(items.FirstOrDefault(user => user.Id == id));

        public Task<UserSummaryResponse?> GetSummaryByIdAsync(
            Guid id,
            CancellationToken cancellationToken = default)
        {
            var user = items.FirstOrDefault(u => u.Id == id);
            if (user == null) return Task.FromResult<UserSummaryResponse?>(null);
            return Task.FromResult<UserSummaryResponse?>(new UserSummaryResponse(
                user.Id,
                user.Email,
                user.DisplayName,
                user.Role,
                user.AvatarUrl,
                user.IsVerified,
                user.IsActive,
                user.SecurityVersion,
                user.CreatedAt,
                user.UpdatedAt,
                user.Profile?.FullName,
                user.Profile?.Faculty));
        }

        public Task<User?> GetByNormalizedEmailAsync(
            string normalizedEmail,
            bool tracking = false,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(items.FirstOrDefault(
                user => user.NormalizedEmail == normalizedEmail));

        public Task<User?> GetByIdWithProfileAsync(
            Guid id,
            bool tracking = false,
            CancellationToken cancellationToken = default) =>
            GetByIdAsync(id, cancellationToken);

        public Task<bool> ExistsStudentCodeAsync(
            string studentCode,
            Guid excludeUserId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(items.Any(user => user.Id != excludeUserId &&
                user.Profile?.StudentCode == studentCode));

        public Task AddProfileAsync(
            UserProfile profile,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task AddAddressAsync(
            UserAddress address,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task AddAsync(
            User user,
            CancellationToken cancellationToken = default)
        {
            items.Add(user);
            return Task.CompletedTask;
        }

        public Task<int> DeleteUnverifiedBeforeAsync(
            DateTime cutoffUtc,
            CancellationToken cancellationToken = default)
        {
            var deleted = items.RemoveAll(user =>
                !user.IsVerified && user.CreatedAt <= cutoffUtc);
            return Task.FromResult(deleted);
        }
    }

    private sealed class FakeChallengeRepository : IAuthChallengeStore
    {
        public FakeChallengeRepository(params AuthChallengeData[] challenges)
        {
            Items.AddRange(challenges);
        }

        public List<AuthChallengeData> Items { get; } = [];

        public Task<AuthChallengeData?> GetAsync(
            Guid id,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(Items.FirstOrDefault(challenge => challenge.Id == id));

        public Task StoreAsync(
            AuthChallengeData challenge,
            CancellationToken cancellationToken = default)
        {
            Items.Add(challenge);
            return Task.CompletedTask;
        }

        public Task DeleteAsync(
            Guid id,
            CancellationToken cancellationToken = default)
        {
            Items.RemoveAll(challenge => challenge.Id == id);
            return Task.CompletedTask;
        }

        public Task<int> IncrementFailureAsync(
            Guid id,
            AuthChallengePurpose purpose,
            DateTime nowUtc,
            CancellationToken cancellationToken = default)
        {
            var index = Items.FindIndex(item => item.Id == id);
            var attempts = Items[index].FailedAttempts + 1;
            Items[index] = Items[index] with { FailedAttempts = attempts };
            return Task.FromResult(attempts);
        }

        public Task<bool> TryConsumeAsync(
            Guid id,
            AuthChallengePurpose purpose,
            string expectedOtpHash,
            DateTime consumedAtUtc,
            CancellationToken cancellationToken = default)
        {
            var index = Items.FindIndex(item => item.Id == id);
            if (index < 0 || Items[index].OtpHash != expectedOtpHash)
            {
                return Task.FromResult(false);
            }
            Items.RemoveAt(index);
            return Task.FromResult(true);
        }

        public Task<bool> TryReplaceOtpAsync(
            Guid id,
            AuthChallengePurpose purpose,
            string otpHash,
            DateTime expiresAtUtc,
            DateTime updatedAtUtc,
            CancellationToken cancellationToken = default)
        {
            var index = Items.FindIndex(item => item.Id == id);
            if (index < 0)
            {
                return Task.FromResult(false);
            }
            Items[index] = Items[index] with
            {
                OtpHash = otpHash,
                ExpiresAtUtc = expiresAtUtc,
                FailedAttempts = 0
            };
            return Task.FromResult(true);
        }
    }

    private sealed class FakeUnitOfWork : IUnitOfWork
    {
        public Task<int> SaveChangesAsync(
            CancellationToken cancellationToken = default) => Task.FromResult(1);

        public Task ExecuteInTransactionAsync(
            Func<CancellationToken, Task> operation,
            CancellationToken cancellationToken = default) => operation(cancellationToken);
    }

    private sealed class FakeEmailQueue(bool failEnqueue = false) : IEmailQueue
    {
        public List<EmailMessage> Messages { get; } = [];

        public Task<Guid> EnqueueAsync(
            EmailMessage message,
            CancellationToken cancellationToken = default)
        {
            if (failEnqueue)
            {
                throw new InvalidOperationException("Email queue unavailable.");
            }
            Messages.Add(message);
            return Task.FromResult(Guid.NewGuid());
        }
    }

    private sealed class FakeRedisStore : IAuthRedisStore
    {
        private readonly System.Collections.Concurrent.ConcurrentDictionary<Guid, int> _securityVersions = new();

        public Task<OtpIssueResult> ReserveOtpRequestAsync(string email) =>
            Task.FromResult(OtpIssueResult.Allowed);
        public Task<bool> IsLoginBlockedAsync(string email, string ipAddress) =>
            Task.FromResult(false);
        public Task RecordLoginFailureAsync(string email, string ipAddress) =>
            Task.CompletedTask;
        public Task ClearAccountLoginFailuresAsync(string email) =>
            Task.CompletedTask;
        public Task SetUserSecurityVersionAsync(Guid userId, int securityVersion, TimeSpan? expiry = null)
        {
            _securityVersions[userId] = securityVersion;
            return Task.CompletedTask;
        }
        public Task<int?> GetUserSecurityVersionAsync(Guid userId)
        {
            return Task.FromResult(_securityVersions.TryGetValue(userId, out var sv) ? (int?)sv : null);
        }
    }

    private sealed class FakeJwtService : IJwtService
    {
        public GeneratedAccessToken Generate(User user) =>
            new("access", "jti", DateTime.UtcNow.AddMinutes(15));
    }

    private sealed class FakeRefreshTokenFactory : IRefreshTokenFactory
    {
        public TimeSpan IdleTimeout => TimeSpan.FromHours(2);

        public static readonly Guid TokenId = Guid.Parse(
            "11111111-1111-1111-1111-111111111111");

        public GeneratedRefreshToken Generate(
            bool isPersistent,
            DateTime? absoluteExpiresAtUtc = null)
        {
            var absoluteExpiry = absoluteExpiresAtUtc ?? DateTime.UtcNow.AddDays(7);
            return new GeneratedRefreshToken(
                Guid.NewGuid(),
                "refresh",
                "refresh",
                absoluteExpiry,
                absoluteExpiry,
                isPersistent);
        }
        public bool TryGetTokenId(string rawToken, out Guid tokenId)
        {
            tokenId = TokenId;
            return true;
        }
    }

    private sealed class FakeRefreshTokenRepository(params RefreshToken[] tokens)
        : IRefreshTokenRepository
    {
        public List<RefreshToken> Items { get; } = [.. tokens];

        public Guid? RevokedUserId { get; private set; }

        public Task<RefreshToken?> GetByIdAsync(
            Guid id,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(Items.FirstOrDefault(token => token.Id == id));

        public Task AddAsync(
            RefreshToken refreshToken,
            CancellationToken cancellationToken = default)
        {
            Items.Add(refreshToken);
            return Task.CompletedTask;
        }

        public Task<int> TryRevokeActiveAsync(
            Guid id,
            Guid userId,
            string tokenHash,
            DateTime revokedAtUtc,
            Guid? replacedByTokenId = null,
            CancellationToken cancellationToken = default)
        {
            var token = Items.FirstOrDefault(item =>
                item.Id == id &&
                item.UserId == userId &&
                item.Token == tokenHash &&
                !item.IsRevoked);
            if (token is null)
            {
                return Task.FromResult(0);
            }

            token.IsRevoked = true;
            token.RevokedAtUtc = revokedAtUtc;
            token.ReplacedByTokenId = replacedByTokenId;
            return Task.FromResult(1);
        }

        public Task<int> RevokeAllActiveAsync(
            Guid userId,
            DateTime revokedAtUtc,
            CancellationToken cancellationToken = default)
        {
            RevokedUserId = userId;
            var changed = 0;
            foreach (var token in Items.Where(
                         token => token.UserId == userId && !token.IsRevoked))
            {
                token.IsRevoked = true;
                token.RevokedAtUtc = revokedAtUtc;
                changed++;
            }
            return Task.FromResult(changed);
        }

        public Task<int> RevokeFamilyAsync(
            Guid familyId,
            Guid userId,
            DateTime revokedAtUtc,
            CancellationToken cancellationToken = default)
        {
            var changed = 0;
            foreach (var token in Items.Where(
                         token =>
                             token.FamilyId == familyId &&
                             token.UserId == userId &&
                             !token.IsRevoked))
            {
                token.IsRevoked = true;
                token.RevokedAtUtc = revokedAtUtc;
                changed++;
            }
            return Task.FromResult(changed);
        }

        public Task<int> RevokeExcessActiveAsync(
            Guid userId,
            DateTime revokedAtUtc,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(0);

        public Task<int> DeleteStaleAsync(
            DateTime retentionCutoffUtc,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(0);
    }
}


