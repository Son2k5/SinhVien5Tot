using FluentValidation;
using SV5T.Application.Auth.Dtos;
using SV5T.Application.Auth.Support;
using SV5T.Application.Common.Interfaces;
using SV5T.Domain.Auth;
using SV5T.Domain.Auth.Enums;
using SV5T.Domain.Users;

namespace SV5T.Application.Auth.Commands.ResetPassword;

public sealed record ResetPasswordCommand(ResetPasswordRequest Request);

public sealed class ResetPasswordHandler(
    IUserRepository userRepository,
    IRefreshTokenRepository refreshTokenRepository,
    IAuthChallengeStore challengeStore,
    IUnitOfWork unitOfWork,
    IPasswordHasher passwordHasher,
    IOtpService otpService,
    IValidator<ResetPasswordRequest> resetPasswordValidator) : ICommandHandler<ResetPasswordCommand>
{
    public async Task HandleAsync(ResetPasswordCommand command, CancellationToken cancellationToken = default)
    {
        var request = command.Request;
        await AuthServiceSupport.ValidateAsync(resetPasswordValidator, request, cancellationToken);
        var now = DateTime.UtcNow;
        var challenge = await challengeStore.GetAsync(request.ResetId, cancellationToken);
        AuthServiceSupport.EnsureChallengeUsable(
            challenge,
            AuthChallengePurpose.PasswordReset,
            now);
        var submittedHash = otpService.Hash(request.Otp);
        if (!otpService.FixedTimeEquals(submittedHash, challenge!.OtpHash))
        {
            _ = await challengeStore.IncrementFailureAsync(
                request.ResetId,
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
                    request.ResetId,
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
                user.PasswordHash = passwordHasher.Hash(request.NewPassword);
                user.SecurityVersion++;
                user.UpdatedAt = transNow;
                await refreshTokenRepository.RevokeAllActiveAsync(
                    user.Id, transNow, transactionCancellationToken);
                await unitOfWork.SaveChangesAsync(transactionCancellationToken);
            },
            cancellationToken);
    }
}
