using FluentValidation;
using Microsoft.Extensions.Logging;
using SV5T.Application.DTOs.Auth;
using SV5T.Application.Email;
using SV5T.Application.Interfaces.Persistence;
using SV5T.Application.Interfaces.Repositories;
using SV5T.Application.Interfaces.Services.Auth;
using SV5T.Application.Interfaces.Services.Commons;
using SV5T.Application.Interfaces.Services.Email;
using SV5T.Application.Models.Auth;
using SV5T.Application.Models.Email;
using SV5T.Domain.Enums;

namespace SV5T.Application.Services;

public sealed class PasswordResetService(
    IUserRepository userRepository,
    IRefreshTokenRepository refreshTokenRepository,
    IAuthChallengeStore challengeStore,
    IUnitOfWork unitOfWork,
    IPasswordHasher passwordHasher,
    IOtpService otpService,
    ISha256Hasher sha256Hasher,
    IAuthRedisStore throttleStore,
    IEmailQueue emailQueue,
    ILogger<PasswordResetService> logger,
    IValidator<ForgotPasswordRequest> forgotPasswordValidator,
    IValidator<VerifyResetOtpRequest> verifyResetOtpValidator,
    IValidator<ResetPasswordRequest> resetPasswordValidator)
{
    public async Task<Guid> ForgotPasswordAsync(
        ForgotPasswordRequest request,
        CancellationToken cancellationToken)
    {
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
        var challenge = CreateChallenge(email, email.ToUpperInvariant(), otp);
        var challengeStored = false;
        try
        {
            await challengeStore.StoreAsync(challenge, cancellationToken);
            challengeStored = true;
            await QueueOtpEmailAsync(email, otp, cancellationToken);
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
                EmailReference(email));
        }
        return challenge.Id;
    }

    public async Task VerifyResetOtpAsync(
        VerifyResetOtpRequest request,
        CancellationToken cancellationToken)
    {
        await AuthServiceSupport.ValidateAsync(
            verifyResetOtpValidator, request, cancellationToken);
        _ = await ValidateChallengeOtpAsync(
            request.ResetId,
            request.Otp,
            cancellationToken);
    }

    public async Task ResetPasswordAsync(
        ResetPasswordRequest request,
        CancellationToken cancellationToken)
    {
        await AuthServiceSupport.ValidateAsync(resetPasswordValidator, request, cancellationToken);
        var submittedHash = await ValidateChallengeOtpAsync(
            request.ResetId,
            request.Otp,
            cancellationToken);
        await unitOfWork.ExecuteInTransactionAsync(
            async transactionCancellationToken =>
            {
                var now = DateTime.UtcNow;
                var challenge = await challengeStore.GetAsync(
                    request.ResetId,
                    transactionCancellationToken);
                AuthServiceSupport.EnsureChallengeUsable(
                    challenge,
                    AuthChallengePurpose.PasswordReset,
                    now);
                if (!otpService.FixedTimeEquals(submittedHash, challenge!.OtpHash) ||
                    !await challengeStore.TryConsumeAsync(
                        challenge.Id,
                        AuthChallengePurpose.PasswordReset,
                        submittedHash,
                        now,
                        transactionCancellationToken))
                {
                    throw AuthServiceSupport.InvalidChallenge();
                }

                var user = await userRepository.GetByNormalizedEmailAsync(
                    challenge.NormalizedEmail,
                    true,
                    transactionCancellationToken) ??
                    throw AuthServiceSupport.InvalidChallenge();
                user.PasswordHash = passwordHasher.Hash(request.NewPassword);
                user.SecurityVersion++;
                user.UpdatedAt = now;
                await refreshTokenRepository.RevokeAllActiveAsync(
                    user.Id, now, transactionCancellationToken);
                await unitOfWork.SaveChangesAsync(transactionCancellationToken);
            },
            cancellationToken);
    }

    private AuthChallengeData CreateChallenge(
        string email,
        string normalizedEmail,
        string otp)
    {
        var now = DateTime.UtcNow;
        return new AuthChallengeData(
            Guid.NewGuid(),
            AuthChallengePurpose.PasswordReset,
            email,
            normalizedEmail,
            null,
            null,
            otpService.Hash(otp),
            0,
            otpService.MaxAttempts,
            now.Add(otpService.Expiry),
            now);
    }

    private async Task<string> ValidateChallengeOtpAsync(
        Guid challengeId,
        string submittedOtp,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var challenge = await challengeStore.GetAsync(challengeId, cancellationToken);
        AuthServiceSupport.EnsureChallengeUsable(
            challenge,
            AuthChallengePurpose.PasswordReset,
            now);
        var submittedHash = otpService.Hash(submittedOtp);
        if (otpService.FixedTimeEquals(submittedHash, challenge!.OtpHash))
        {
            return submittedHash;
        }
        _ = await challengeStore.IncrementFailureAsync(
            challengeId,
            AuthChallengePurpose.PasswordReset,
            now,
            cancellationToken);
        throw AuthServiceSupport.InvalidChallenge();
    }

    private Task<Guid> QueueOtpEmailAsync(
        string email,
        string otp,
        CancellationToken cancellationToken) =>
        emailQueue.EnqueueAsync(
            new EmailMessage(
                email,
                OtpEmailTemplate.Subject(OtpPurpose.ResetPassword),
                OtpEmailTemplate.Render(
                    otp,
                    (int)Math.Ceiling(otpService.Expiry.TotalMinutes),
                    OtpPurpose.ResetPassword),
                OtpEmailTemplate.TemplateKey(OtpPurpose.ResetPassword)),
            cancellationToken);

    private string EmailReference(string email) =>
        sha256Hasher.HashIdentifier(email)[..12];
}
