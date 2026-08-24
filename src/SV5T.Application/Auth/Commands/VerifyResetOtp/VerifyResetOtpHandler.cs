using FluentValidation;
using SV5T.Application.Auth.Dtos;
using SV5T.Application.Auth.Support;
using SV5T.Application.Common.Interfaces;
using SV5T.Domain.Auth.Enums;

namespace SV5T.Application.Auth.Commands.VerifyResetOtp;

public sealed record VerifyResetOtpCommand(VerifyResetOtpRequest Request);

public sealed class VerifyResetOtpHandler(
    IAuthChallengeStore challengeStore,
    IOtpService otpService,
    IValidator<VerifyResetOtpRequest> verifyResetOtpValidator) : ICommandHandler<VerifyResetOtpCommand>
{
    public async Task HandleAsync(VerifyResetOtpCommand command, CancellationToken cancellationToken = default)
    {
        var request = command.Request;
        await AuthServiceSupport.ValidateAsync(
            verifyResetOtpValidator, request, cancellationToken);
        var now = DateTime.UtcNow;
        var challenge = await challengeStore.GetAsync(request.ResetId, cancellationToken);
        AuthServiceSupport.EnsureChallengeUsable(
            challenge,
            AuthChallengePurpose.PasswordReset,
            now);
        var submittedHash = otpService.Hash(request.Otp);
        if (otpService.FixedTimeEquals(submittedHash, challenge!.OtpHash))
        {
            return;
        }
        _ = await challengeStore.IncrementFailureAsync(
            request.ResetId,
            AuthChallengePurpose.PasswordReset,
            now,
            cancellationToken);
        throw AuthServiceSupport.InvalidChallenge();
    }
}
