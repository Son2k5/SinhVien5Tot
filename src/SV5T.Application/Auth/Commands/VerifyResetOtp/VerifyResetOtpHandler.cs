using MediatR;
using SV5T.Application.Auth.Support;
using SV5T.Application.Common.Abstractions;
using SV5T.Domain.Auth.Enums;

namespace SV5T.Application.Auth.Commands.VerifyResetOtp;

public sealed record VerifyResetOtpCommand(Guid ResetId, string Otp) : IRequest;

public sealed class VerifyResetOtpHandler(
    IAuthChallengeStore challengeStore,
    IOtpService otpService) : IRequestHandler<VerifyResetOtpCommand>
{
    public async Task Handle(VerifyResetOtpCommand command, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var challenge = await challengeStore.GetAsync(command.ResetId, cancellationToken);
        AuthServiceSupport.EnsureChallengeUsable(
            challenge,
            AuthChallengePurpose.PasswordReset,
            now);
        var submittedHash = otpService.Hash(command.Otp);
        if (otpService.FixedTimeEquals(submittedHash, challenge!.OtpHash))
        {
            return;
        }
        _ = await challengeStore.IncrementFailureAsync(
            command.ResetId,
            AuthChallengePurpose.PasswordReset,
            now,
            cancellationToken);
        throw AuthServiceSupport.InvalidChallenge();
    }
}
