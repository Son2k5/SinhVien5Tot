using SV5T.Application.Models.Auth;
using SV5T.Domain.Enums;

namespace SV5T.Application.Interfaces.Services.Auth;

public interface IAuthChallengeStore
{
    Task<AuthChallengeData?> GetAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    Task StoreAsync(
        AuthChallengeData challenge,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    Task<int> IncrementFailureAsync(
        Guid id,
        AuthChallengePurpose purpose,
        DateTime nowUtc,
        CancellationToken cancellationToken = default);

    Task<bool> TryConsumeAsync(
        Guid id,
        AuthChallengePurpose purpose,
        string expectedOtpHash,
        DateTime consumedAtUtc,
        CancellationToken cancellationToken = default);

    Task<bool> TryReplaceOtpAsync(
        Guid id,
        AuthChallengePurpose purpose,
        string otpHash,
        DateTime expiresAtUtc,
        DateTime updatedAtUtc,
        CancellationToken cancellationToken = default);
}
