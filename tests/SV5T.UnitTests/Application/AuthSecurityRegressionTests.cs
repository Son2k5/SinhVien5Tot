using FluentValidation;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.DTOs.Auth;
using SV5T.Application.Interfaces.Persistence;
using SV5T.Application.Interfaces.Repositories;
using SV5T.Application.Interfaces.Services.Auth;
using SV5T.Application.Interfaces.Services.Commons;
using SV5T.Application.Interfaces.Services.Email;
using SV5T.Application.Models.Auth;
using SV5T.Application.Models.Email;
using SV5T.Application.Services;
using SV5T.Application.Validators;
using SV5T.Domain.Entities;
using SV5T.Domain.Enums;
using SV5T.Infrastructure.Auth;
using SV5T.Infrastructure.Options.Authentication;
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
            new RegisterRequest(existing.Email, "AttackerPassword123"));

        Assert.NotEqual(Guid.Empty, registrationId);
        Assert.Equal("original-hash", existing.PasswordHash);
        var challenge = Assert.Single(challenges.Items);
        Assert.Equal(registrationId, challenge.Id);
        Assert.Equal("hash:AttackerPassword123", challenge.PasswordHash);
        Assert.Single(email.Messages);
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
    public void Jwt_DoesNotContainSecurityVersionClaim()
    {
        var service = new JwtService(
            Options.Create(new JwtOptions
            {
                Issuer = "tests",
                Audience = "tests",
                Key = "a-test-key-that-is-at-least-thirty-two-bytes-long",
                AccessTokenMinutes = 15
            }));

        var generated = service.Generate(new User
        {
            Email = "student@ms.hanu.edu.vn"
        });
        var token = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler()
            .ReadJwtToken(generated.Token);

        Assert.DoesNotContain(token.Claims, claim => claim.Type == "sv");
    }

    [Fact]
    public async Task Refresh_RejectsRevokedSessionAndRevokesActiveSessions()
    {
        var user = new User
        {
            Email = "student@ms.hanu.edu.vn",
            NormalizedEmail = "STUDENT@MS.HANU.EDU.VN",
            IsVerified = true,
            IsActive = true
        };
        var redis = new FakeRedisStore();
        var refreshTokens = new FakeRefreshTokenRepository(new RefreshToken
        {
            Id = FakeRefreshTokenFactory.TokenId,
            UserId = user.Id,
            Token = "refresh",
            IsRevoked = true,
            RevokedAtUtc = DateTime.UtcNow,
            ExpiresAtUtc = DateTime.UtcNow.AddDays(1)
        });
        var service = CreateService(
            new FakeUserRepository(user),
            new FakeChallengeRepository(),
            new FakeEmailQueue(),
            redis,
            refreshTokens: refreshTokens);

        await Assert.ThrowsAsync<UseCaseException>(() =>
            service.RefreshAsync("refresh"));

        Assert.Equal(user.Id, refreshTokens.RevokedUserId);
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
    public async Task Validators_RejectNullAndOversizedSecurityInputs()
    {
        var school = new AllowSchoolEmailValidator();
        var register = new RegisterRequestValidator(school);
        var verify = new VerifyOtpRequestValidator();
        var verifyReset = new VerifyResetOtpRequestValidator();
        var reset = new ResetPasswordRequestValidator();

        Assert.False((await register.ValidateAsync(
            new RegisterRequest("student@ms.hanu.edu.vn", null!))).IsValid);
        Assert.False((await register.ValidateAsync(
            new RegisterRequest(
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

    private static AuthService CreateService(
        IUserRepository users,
        IAuthChallengeStore challenges,
        IEmailQueue email,
        FakeRedisStore redis,
        IPasswordHasher? passwordHasher = null,
        FakeRefreshTokenRepository? refreshTokens = null) =>
        new(
            users,
            refreshTokens ?? new FakeRefreshTokenRepository(),
            challenges,
            new FakeUnitOfWork(),
            passwordHasher ?? new FakePasswordHasher(),
            new FakeOtpService(),
            new FakeSha256Hasher(),
            redis,
            new FakeJwtService(),
            new FakeRefreshTokenFactory(),
            email,
            NullLogger<AuthService>.Instance,
            new RegisterRequestValidator(new AllowSchoolEmailValidator()),
            new LoginRequestValidator(),
            new VerifyOtpRequestValidator(),
            new ResendOtpRequestValidator(),
            new ForgotPasswordRequestValidator(),
            new VerifyResetOtpRequestValidator(),
            new ResetPasswordRequestValidator());

    private static AuthChallengeData PasswordResetChallenge(User user)
    {
        var now = DateTime.UtcNow;
        return new AuthChallengeData(
            Guid.NewGuid(),
            AuthChallengePurpose.PasswordReset,
            user.Email,
            user.NormalizedEmail,
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
        public int ExpiryMinutes => 3;
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

        public Task<User?> GetByNormalizedEmailAsync(
            string normalizedEmail,
            bool tracking = false,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(items.FirstOrDefault(
                user => user.NormalizedEmail == normalizedEmail));

        public Task AddAsync(
            User user,
            CancellationToken cancellationToken = default)
        {
            items.Add(user);
            return Task.CompletedTask;
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

    private sealed class FakeEmailQueue : IEmailQueue
    {
        public List<EmailMessage> Messages { get; } = [];

        public Task<Guid> EnqueueAsync(
            EmailMessage message,
            CancellationToken cancellationToken = default)
        {
            Messages.Add(message);
            return Task.FromResult(Guid.NewGuid());
        }
    }

    private sealed class FakeRedisStore : IAuthRedisStore
    {
        public Task<OtpIssueResult> ReserveOtpRequestAsync(string email) =>
            Task.FromResult(OtpIssueResult.Allowed);
        public Task<bool> IsLoginBlockedAsync(string email, string ipAddress) =>
            Task.FromResult(false);
        public Task RecordLoginFailureAsync(string email, string ipAddress) =>
            Task.CompletedTask;
        public Task ClearLoginFailuresAsync(string email, string ipAddress) =>
            Task.CompletedTask;
        public Task BlacklistAccessTokenAsync(string jti, TimeSpan remainingLifetime) =>
            Task.CompletedTask;
        public Task<bool> IsAccessTokenBlacklistedAsync(string jti) =>
            Task.FromResult(false);
    }

    private sealed class FakeJwtService : IJwtService
    {
        public GeneratedAccessToken Generate(User user) =>
            new("access", "jti", DateTime.UtcNow.AddMinutes(15));
    }

    private sealed class FakeRefreshTokenFactory : IRefreshTokenFactory
    {
        public static readonly Guid TokenId = Guid.Parse(
            "11111111-1111-1111-1111-111111111111");

        public GeneratedRefreshToken Generate() =>
            new(TokenId, "refresh", "refresh", DateTime.UtcNow.AddDays(7));
        public bool TryGetTokenId(string rawToken, out Guid tokenId)
        {
            tokenId = TokenId;
            return true;
        }
    }

    private sealed class FakeRefreshTokenRepository(params RefreshToken[] tokens)
        : IRefreshTokenRepository
    {
        private readonly List<RefreshToken> items = [.. tokens];

        public Guid? RevokedUserId { get; private set; }

        public Task<RefreshToken?> GetByIdAsync(
            Guid id,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(items.FirstOrDefault(token => token.Id == id));

        public Task AddAsync(
            RefreshToken refreshToken,
            CancellationToken cancellationToken = default)
        {
            items.Add(refreshToken);
            return Task.CompletedTask;
        }

        public Task<int> TryRevokeActiveAsync(
            Guid id,
            Guid userId,
            string tokenHash,
            DateTime revokedAtUtc,
            CancellationToken cancellationToken = default)
        {
            var token = items.FirstOrDefault(item =>
                item.Id == id &&
                item.UserId == userId &&
                item.Token == tokenHash &&
                !item.IsRevoked &&
                item.ExpiresAtUtc > revokedAtUtc);
            if (token is null)
            {
                return Task.FromResult(0);
            }

            token.IsRevoked = true;
            token.RevokedAtUtc = revokedAtUtc;
            return Task.FromResult(1);
        }

        public Task<int> RevokeAllActiveAsync(
            Guid userId,
            DateTime revokedAtUtc,
            CancellationToken cancellationToken = default)
        {
            RevokedUserId = userId;
            var changed = 0;
            foreach (var token in items.Where(
                         token => token.UserId == userId && !token.IsRevoked))
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
