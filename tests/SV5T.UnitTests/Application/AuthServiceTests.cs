using FluentValidation;
using SV5T.Application.Auth.Commands.Register;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Models;
using SV5T.Domain.Auth;
using SV5T.Domain.Auth.Enums;
using SV5T.Domain.Users;
using Xunit;

namespace SV5T.UnitTests.Application;

public sealed class AuthHandlerTests
{
    [Fact]
    public async Task RegisterHandler_CreatesChallengeAndEnqueuesEmail()
    {
        var users = new FakeUserRepository();
        var challenges = new FakeChallengeRepository();
        var email = new FakeEmailQueue();
        var redis = new FakeRedisStore();
        var handler = new RegisterHandler(
            users,
            challenges,
            new FakePasswordHasher(),
            new FakeOtpService(),
            redis,
            email);

        var command = new RegisterCommand("Nguyễn Văn A", "student@ms.hanu.edu.vn", "Password123!");
        var id = await handler.Handle(command, CancellationToken.None);

        Assert.NotEqual(Guid.Empty, id);
        Assert.Single(challenges.Items);
        Assert.Single(email.Messages);
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
}
