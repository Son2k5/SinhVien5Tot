using FluentValidation;
using SV5T.Application.DTOs.Auth;
using SV5T.Application.Email;
using SV5T.Application.Interfaces.Persistence;
using SV5T.Application.Interfaces.Repositories;
using SV5T.Application.Interfaces.Services.Auth;
using SV5T.Application.Interfaces.Services.Commons;
using SV5T.Application.Interfaces.Services.Email;
using SV5T.Application.Models.Auth;
using SV5T.Application.Models.Email;
using SV5T.Domain.Entities;
using SV5T.Domain.Enums;

namespace SV5T.Application.Services;

public sealed class RegistrationService(
    IUserRepository userRepository,
    IAuthChallengeStore challengeStore,
    IUnitOfWork unitOfWork,
    IPasswordHasher passwordHasher,
    IOtpService otpService,
    IAuthRedisStore throttleStore,
    IEmailQueue emailQueue,
    IValidator<RegisterRequest> registerValidator,
    IValidator<VerifyOtpRequest> verifyOtpValidator,
    IValidator<ResendOtpRequest> resendOtpValidator)
{
    public async Task<Guid> RegisterAsync(
        RegisterRequest request,
        CancellationToken cancellationToken)
    {
        await AuthServiceSupport.ValidateAsync(registerValidator, request, cancellationToken);
        var displayName = request.Name.Trim();
        var email = AuthServiceSupport.NormalizeEmail(request.Email);
        var normalizedEmail = email.ToUpperInvariant();
        await EnsureOtpCanBeIssuedAsync(email);
        var passwordHash = passwordHasher.Hash(request.Password);
        var existing = await userRepository.GetByNormalizedEmailAsync(
            normalizedEmail, false, cancellationToken);
        if (existing?.IsVerified == true)
        {
            return Guid.NewGuid();
        }

        var otp = otpService.Generate();
        var challenge = CreateChallenge(
            AuthChallengePurpose.Registration,
            email,
            normalizedEmail,
            displayName,
            otp,
            passwordHash);
        await challengeStore.StoreAsync(challenge, cancellationToken);
        try
        {
            await QueueOtpEmailAsync(
                email,
                otp,
                OtpPurpose.Register,
                cancellationToken);
        }
        catch
        {
            await challengeStore.DeleteAsync(challenge.Id, CancellationToken.None);
            throw;
        }
        return challenge.Id;
    }

    public async Task VerifyOtpAsync(
        VerifyOtpRequest request,
        CancellationToken cancellationToken)
    {
        await AuthServiceSupport.ValidateAsync(verifyOtpValidator, request, cancellationToken);
        var submittedHash = await ValidateChallengeOtpAsync(
            request.RegistrationId,
            AuthChallengePurpose.Registration,
            request.Otp,
            cancellationToken);
        var accountAlreadyVerified = false;
        await unitOfWork.ExecuteInTransactionAsync(
            async transactionCancellationToken =>
            {
                var now = DateTime.UtcNow;
                var challenge = await challengeStore.GetAsync(
                    request.RegistrationId,
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
            },
            cancellationToken);
        if (accountAlreadyVerified)
        {
            throw AuthServiceSupport.InvalidChallenge();
        }
    }

    public async Task ResendOtpAsync(
        ResendOtpRequest request,
        CancellationToken cancellationToken)
    {
        await AuthServiceSupport.ValidateAsync(resendOtpValidator, request, cancellationToken);
        var challenge = await challengeStore.GetAsync(request.RegistrationId, cancellationToken);
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
            await QueueOtpEmailAsync(
                challenge.Email,
                otp,
                OtpPurpose.Register,
                cancellationToken);
        }
        catch
        {
            await challengeStore.DeleteAsync(challenge.Id, CancellationToken.None);
            throw;
        }
    }

    private AuthChallengeData CreateChallenge(
        AuthChallengePurpose purpose,
        string email,
        string normalizedEmail,
        string displayName,
        string otp,
        string? passwordHash)
    {
        var now = DateTime.UtcNow;
        return new AuthChallengeData(
            Guid.NewGuid(), purpose, email, normalizedEmail, displayName, passwordHash,
            otpService.Hash(otp), 0, otpService.MaxAttempts,
            now.Add(otpService.Expiry), now);
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

    private async Task EnsureOtpCanBeIssuedAsync(string email)
    {
        var result = await throttleStore.ReserveOtpRequestAsync(email);
        if (result != OtpIssueResult.Allowed)
        {
            throw new Common.Exceptions.UseCaseException(
                Common.Exceptions.ApplicationErrorKind.RateLimited,
                result == OtpIssueResult.Cooldown
                    ? "Vui lòng chờ trước khi yêu cầu OTP mới."
                    : "Đã vượt quá số lần yêu cầu OTP.");
        }
    }

    private Task<Guid> QueueOtpEmailAsync(
        string email,
        string otp,
        OtpPurpose purpose,
        CancellationToken cancellationToken) =>
        emailQueue.EnqueueAsync(
            new EmailMessage(
                email,
                OtpEmailTemplate.Subject(purpose),
                OtpEmailTemplate.Render(
                    otp,
                    (int)Math.Ceiling(otpService.Expiry.TotalMinutes),
                    purpose),
                OtpEmailTemplate.TemplateKey(purpose)),
            cancellationToken);
}
