using MediatR;
using SV5T.Application.Auth.Support;
using SV5T.Application.Auth.Templates;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Models;
using SV5T.Domain.Auth.Enums;

namespace SV5T.Application.Auth.Commands.ResendOtp;

public sealed record ResendOtpCommand(Guid RegistrationId) : IRequest;

public sealed class ResendOtpHandler(
    IAuthChallengeStore challengeStore,
    IOtpService otpService,
    IAuthRedisStore throttleStore,
    IEmailQueue emailQueue) : IRequestHandler<ResendOtpCommand>
{
    public async Task Handle(ResendOtpCommand command, CancellationToken cancellationToken)
    {
        var challenge = await challengeStore.GetAsync(command.RegistrationId, cancellationToken);
        AuthServiceSupport.EnsureChallengeUsable(
            challenge,
            AuthChallengePurpose.Registration,
            DateTime.UtcNow,
            allowExpired: true);
        await EnsureOtpCanBeIssuedAsync(challenge!.Email);
        var otp = otpService.Generate();
        var now = DateTime.UtcNow;
        var replaced = await challengeStore.TryReplaceOtpAsync(
            challenge.Id,
            AuthChallengePurpose.Registration,
            otpService.Hash(otp),
            now.Add(otpService.Expiry),
            now,
            cancellationToken);
        if (!replaced)
        {
            throw AuthServiceSupport.InvalidChallenge();
        }
        try
        {
            await emailQueue.EnqueueAsync(
                new EmailMessage(
                    challenge.Email,
                    OtpEmailTemplate.Subject(OtpPurpose.Register),
                    OtpEmailTemplate.Render(
                        otp,
                        (int)Math.Ceiling(otpService.Expiry.TotalMinutes),
                        OtpPurpose.Register),
                    OtpEmailTemplate.TemplateKey(OtpPurpose.Register)),
                cancellationToken);
        }
        catch
        {
            await challengeStore.DeleteAsync(challenge.Id, CancellationToken.None);
            throw;
        }
    }

    private async Task EnsureOtpCanBeIssuedAsync(string email)
    {
        var result = await throttleStore.ReserveOtpRequestAsync(email);
        if (result != OtpIssueResult.Allowed)
        {
            throw new UseCaseException(
                ApplicationErrorKind.RateLimited,
                "Yêu cầu gửi mã OTP quá thường xuyên. Vui lòng thử lại sau.",
                "rate_limited");
        }
    }
}
