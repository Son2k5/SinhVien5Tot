using MediatR;
using SV5T.Application.Auth.Support;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Models;
using SV5T.Domain.Auth.Enums;
using SV5T.Domain.Users;

namespace SV5T.Application.Auth.Commands.VerifyOtp;

public sealed record VerifyOtpCommand(Guid RegistrationId, string Otp) : IRequest;

public sealed class VerifyOtpHandler(
    IUserRepository userRepository,
    IAuthChallengeStore challengeStore,
    IUnitOfWork unitOfWork,
    IOtpService otpService,
    IAuthRedisStore throttleStore) : IRequestHandler<VerifyOtpCommand>
{
    public async Task Handle(VerifyOtpCommand command, CancellationToken cancellationToken)
    {
        var submittedHash = await ValidateChallengeOtpAsync(
            command.RegistrationId,
            AuthChallengePurpose.Registration,
            command.Otp,
            cancellationToken);

        var accountAlreadyVerified = false;
        await unitOfWork.ExecuteInTransactionAsync(
            async transactionCancellationToken =>
            {
                var now = DateTime.UtcNow;
                var challenge = await challengeStore.GetAsync(
                    command.RegistrationId,
                    transactionCancellationToken);
                AuthServiceSupport.EnsureChallengeUsable(
                    challenge,
                    AuthChallengePurpose.Registration,
                    now);
                if (!otpService.FixedTimeEquals(submittedHash, challenge!.OtpHash) ||
                    string.IsNullOrWhiteSpace(challenge.PasswordHash) ||
                    !await challengeStore.TryConsumeAsync(
                        challenge.Id,
                        AuthChallengePurpose.Registration,
                        submittedHash,
                        now,
                        transactionCancellationToken))
                {
                    throw AuthServiceSupport.InvalidChallenge();
                }

                var user = await userRepository.GetByNormalizedEmailAsync(
                    challenge.NormalizedEmail,
                    true,
                    transactionCancellationToken);
                if (user?.IsVerified == true)
                {
                    accountAlreadyVerified = true;
                    return;
                }

                if (user is null)
                {
                    user = new User
                    {
                        Email = challenge.Email,
                        NormalizedEmail = challenge.NormalizedEmail,
                        DisplayName = ResolveDisplayName(challenge),
                        PasswordHash = challenge.PasswordHash,
                        IsVerified = true,
                        IsActive = true
                    };
                    await userRepository.AddAsync(user, transactionCancellationToken);
                }
                else
                {
                    user.DisplayName = ResolveDisplayName(challenge);
                    user.PasswordHash = challenge.PasswordHash;
                    user.IsVerified = true;
                    user.IsActive = true;
                    user.SecurityVersion++;
                    user.UpdatedAt = now;
                }
                await unitOfWork.SaveChangesAsync(transactionCancellationToken);
                await throttleStore.SetUserSecurityVersionAsync(
                    user.Id, user.SecurityVersion);
            },
            cancellationToken);

        if (accountAlreadyVerified)
        {
            throw AuthServiceSupport.InvalidChallenge();
        }
    }

    private static string ResolveDisplayName(AuthChallengeData challenge) =>
        string.IsNullOrWhiteSpace(challenge.DisplayName)
            ? challenge.Email.Split('@', 2)[0]
            : challenge.DisplayName.Trim();

    private async Task<string> ValidateChallengeOtpAsync(
        Guid challengeId,
        AuthChallengePurpose purpose,
        string submittedOtp,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var challenge = await challengeStore.GetAsync(challengeId, cancellationToken);
        AuthServiceSupport.EnsureChallengeUsable(challenge, purpose, now);
        var submittedHash = otpService.Hash(submittedOtp);
        if (otpService.FixedTimeEquals(submittedHash, challenge!.OtpHash))
        {
            return submittedHash;
        }
        _ = await challengeStore.IncrementFailureAsync(
            challengeId, purpose, now, cancellationToken);
        throw AuthServiceSupport.InvalidChallenge();
    }
}
