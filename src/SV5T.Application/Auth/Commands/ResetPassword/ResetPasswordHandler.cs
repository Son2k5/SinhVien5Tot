using MediatR;
using SV5T.Application.Auth.Support;
using SV5T.Application.Common.Abstractions;
using SV5T.Domain.Auth;
using SV5T.Domain.Auth.Enums;
using SV5T.Domain.Users;

namespace SV5T.Application.Auth.Commands.ResetPassword;

public sealed record ResetPasswordCommand(Guid ResetId, string Otp, string NewPassword) : IRequest;

public sealed class ResetPasswordHandler(
    IUserRepository userRepository,
    IRefreshTokenRepository refreshTokenRepository,
    IAuthChallengeStore challengeStore,
    IUnitOfWork unitOfWork,
    IPasswordHasher passwordHasher,
    IOtpService otpService,
    IAuthRedisStore throttleStore) : IRequestHandler<ResetPasswordCommand>
{
    public async Task Handle(ResetPasswordCommand command, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var challenge = await challengeStore.GetAsync(command.ResetId, cancellationToken);
        AuthServiceSupport.EnsureChallengeUsable(
            challenge,
            AuthChallengePurpose.PasswordReset,
            now);
        var submittedHash = otpService.Hash(command.Otp);
        if (!otpService.FixedTimeEquals(submittedHash, challenge!.OtpHash))
        {
            _ = await challengeStore.IncrementFailureAsync(
                command.ResetId,
                AuthChallengePurpose.PasswordReset,
                now,
                cancellationToken);
            throw AuthServiceSupport.InvalidChallenge();
        }

        await unitOfWork.ExecuteInTransactionAsync(
            async transactionCancellationToken =>
            {
                var transNow = DateTime.UtcNow;
                var currentChallenge = await challengeStore.GetAsync(
                    command.ResetId,
                    transactionCancellationToken);
                AuthServiceSupport.EnsureChallengeUsable(
                    currentChallenge,
                    AuthChallengePurpose.PasswordReset,
                    transNow);
                if (!otpService.FixedTimeEquals(submittedHash, currentChallenge!.OtpHash) ||
                    !await challengeStore.TryConsumeAsync(
                        currentChallenge.Id,
                        AuthChallengePurpose.PasswordReset,
                        submittedHash,
                        transNow,
                        transactionCancellationToken))
                {
                    throw AuthServiceSupport.InvalidChallenge();
                }

                var user = await userRepository.GetByNormalizedEmailAsync(
                    currentChallenge.NormalizedEmail,
                    true,
                    transactionCancellationToken) ??
                    throw AuthServiceSupport.InvalidChallenge();
                user.PasswordHash = passwordHasher.Hash(command.NewPassword);
                user.SecurityVersion++;
                user.UpdatedAt = transNow;
                await refreshTokenRepository.RevokeAllActiveAsync(
                    user.Id, transNow, transactionCancellationToken);
                await unitOfWork.SaveChangesAsync(transactionCancellationToken);
                await throttleStore.SetUserSecurityVersionAsync(
                    user.Id, user.SecurityVersion);
            },
            cancellationToken);
    }
}
