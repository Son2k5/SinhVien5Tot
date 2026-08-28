using FluentValidation;
using Microsoft.Extensions.Logging;
using SV5T.Application.Auth.Dtos;
using SV5T.Application.Auth.Support;
using SV5T.Application.Auth.Templates;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Models;
using SV5T.Domain.Auth;
using SV5T.Domain.Auth.Enums;
using SV5T.Domain.Users;

namespace SV5T.Application.Auth.Commands.ForgotPassword;

public sealed record ForgotPasswordCommand(ForgotPasswordRequest Request);

public sealed class ForgotPasswordHandler(
    IUserRepository userRepository,
    IAuthChallengeStore challengeStore,
    IOtpService otpService,
    ISha256Hasher sha256Hasher,
    IAuthRedisStore throttleStore,
    IEmailQueue emailQueue,
    ILogger<ForgotPasswordHandler> logger,
    IValidator<ForgotPasswordRequest> forgotPasswordValidator) : ICommandHandler<ForgotPasswordCommand, Guid>
{
    public async Task<Guid> HandleAsync(ForgotPasswordCommand command, CancellationToken cancellationToken = default)
    {
        var request = command.Request;
        await AuthServiceSupport.ValidateAsync(
            forgotPasswordValidator, request, cancellationToken);
        var email = AuthServiceSupport.NormalizeEmail(request.Email);
        var user = await userRepository.GetByNormalizedEmailAsync(
            email.ToUpperInvariant(), false, cancellationToken);
        if (user is null || !user.IsVerified || !user.IsActive ||
            string.IsNullOrWhiteSpace(user.PasswordHash) ||
            await throttleStore.ReserveOtpRequestAsync(email) != OtpIssueResult.Allowed)
        {
            return Guid.NewGuid();
        }

        var otp = otpService.Generate();
        var now = DateTime.UtcNow;
        var challenge = new AuthChallengeData(
            Guid.NewGuid(),
            AuthChallengePurpose.PasswordReset,
            email,
            email.ToUpperInvariant(),
            null,
            null,
            otpService.Hash(otp),
            0,
            otpService.MaxAttempts,
            now.Add(otpService.Expiry),
            now);

        var challengeStored = false;
        try
        {
            await challengeStore.StoreAsync(challenge, cancellationToken);
            challengeStored = true;
            await emailQueue.EnqueueAsync(
                new EmailMessage(
                    email,
                    OtpEmailTemplate.Subject(OtpPurpose.ResetPassword),
                    OtpEmailTemplate.Render(
                        otp,
                        (int)Math.Ceiling(otpService.Expiry.TotalMinutes),
                        OtpPurpose.ResetPassword),
                    OtpEmailTemplate.TemplateKey(OtpPurpose.ResetPassword)),
                cancellationToken);
        }
        catch (Exception exception)
        {
            if (challengeStored)
            {
                try
                {
                    await challengeStore.DeleteAsync(
                        challenge.Id,
                        CancellationToken.None);
                }
                catch (Exception cleanupException)
                {
                    logger.LogWarning(
                        cleanupException,
                        "Could not clean failed password-reset challenge {ChallengeId}.",
                        challenge.Id);
                }
            }
            logger.LogError(
                exception,
                "Failed to persist password reset request for {EmailRef}.",
                sha256Hasher.HashIdentifier(email)[..12]);
        }
        return challenge.Id;
    }
}
