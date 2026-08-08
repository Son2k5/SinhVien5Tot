using FluentValidation;
using Microsoft.Extensions.Logging;
using SV5T.Application.Common.Exceptions;
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

public sealed class AuthService(
    IUserRepository userRepository,
    IRefreshTokenRepository refreshTokenRepository,
    IAuthChallengeStore challengeStore,
    IUnitOfWork unitOfWork,
    IPasswordHasher passwordHasher,
    IOtpService otpService,
    ISha256Hasher sha256Hasher,
    IAuthRedisStore redisStore,
    IJwtService jwtService,
    IRefreshTokenFactory refreshTokenFactory,
    IEmailQueue emailQueue,
    ILogger<AuthService> logger,
    IValidator<RegisterRequest> registerValidator,
    IValidator<LoginRequest> loginValidator,
    IValidator<VerifyOtpRequest> verifyOtpValidator,
    IValidator<ResendOtpRequest> resendOtpValidator,
    IValidator<ForgotPasswordRequest> forgotPasswordValidator,
    IValidator<VerifyResetOtpRequest> verifyResetOtpValidator,
    IValidator<ResetPasswordRequest> resetPasswordValidator) : IAuthService
{
    public async Task<Guid> RegisterAsync(
        RegisterRequest request,
        CancellationToken cancellationToken = default)
    {
        await ValidateAsync(registerValidator, request, cancellationToken);
        var email = NormalizeEmail(request.Email);
        var normalizedEmail = email.ToUpperInvariant();

        // Perform the same expensive work before checking account state to reduce
        // timing-based account enumeration. The password is not written to User yet.
        await EnsureOtpCanBeIssuedAsync(email);
        var passwordHash = passwordHasher.Hash(request.Password);
        var existing = await userRepository.GetByNormalizedEmailAsync(
            normalizedEmail, false, cancellationToken);

        if (existing?.IsVerified == true)
        {
            // Return an indistinguishable, non-existent challenge id.
            return Guid.NewGuid();
        }

        var otp = otpService.Generate();
        var challenge = CreateChallenge(
            AuthChallengePurpose.Registration,
            email,
            normalizedEmail,
            otp,
            passwordHash);

        await challengeStore.StoreAsync(challenge, cancellationToken);
        try
        {
            await QueueOtpEmailAsync(
                email, otp, OtpPurpose.Register, cancellationToken);
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
        CancellationToken cancellationToken = default)
    {
        await ValidateAsync(verifyOtpValidator, request, cancellationToken);
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
                EnsureChallengeUsable(challenge, AuthChallengePurpose.Registration, now);

                if (!otpService.FixedTimeEquals(submittedHash, challenge!.OtpHash) ||
                    string.IsNullOrWhiteSpace(challenge.PasswordHash) ||
                    !await challengeStore.TryConsumeAsync(
                        challenge.Id,
                        AuthChallengePurpose.Registration,
                        submittedHash,
                        now,
                        transactionCancellationToken))
                {
                    throw InvalidChallenge();
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
                        PasswordHash = challenge.PasswordHash,
                        IsVerified = true,
                        IsActive = true
                    };
                    await userRepository.AddAsync(user, transactionCancellationToken);
                }
                else
                {
                    user.PasswordHash = challenge.PasswordHash;
                    user.IsVerified = true;
                    user.IsActive = true;
                    user.UpdatedAt = now;
                }

                await unitOfWork.SaveChangesAsync(transactionCancellationToken);
            },
            cancellationToken);

        if (accountAlreadyVerified)
        {
            throw InvalidChallenge();
        }
    }

    public async Task ResendOtpAsync(
        ResendOtpRequest request,
        CancellationToken cancellationToken = default)
    {
        await ValidateAsync(resendOtpValidator, request, cancellationToken);
        var challenge = await challengeStore.GetAsync(
            request.RegistrationId,
            cancellationToken);
        EnsureChallengeUsable(
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
            now.AddMinutes(otpService.ExpiryMinutes),
            now,
            cancellationToken);
        if (!replaced)
        {
            throw InvalidChallenge();
        }

        await QueueOtpEmailAsync(
            challenge.Email,
            otp,
            OtpPurpose.Register,
            cancellationToken);
    }

    public async Task<AuthTokens> LoginAsync(
        LoginRequest request,
        string ipAddress,
        CancellationToken cancellationToken = default)
    {
        await ValidateAsync(loginValidator, request, cancellationToken);
        var email = NormalizeEmail(request.Email);

        if (await redisStore.IsLoginBlockedAsync(email, ipAddress))
        {
            throw new UseCaseException(
                ApplicationErrorKind.RateLimited,
                "Đăng nhập bị tạm khóa. Vui lòng thử lại sau.");
        }

        var user = await userRepository.GetByNormalizedEmailAsync(
            email.ToUpperInvariant(), false, cancellationToken);
        var passwordValid = passwordHasher.Verify(
            request.Password,
            user?.PasswordHash);

        if (user is null || !user.IsActive || !user.IsVerified ||
            string.IsNullOrWhiteSpace(user.PasswordHash) ||
            !passwordValid)
        {
            await redisStore.RecordLoginFailureAsync(email, ipAddress);
            throw new UseCaseException(
                ApplicationErrorKind.Unauthorized,
                "Email hoặc mật khẩu không đúng.");
        }

        await redisStore.ClearLoginFailuresAsync(email, ipAddress);
        return await CreateTokensAsync(user, cancellationToken);
    }

    public async Task<AuthTokens> RefreshAsync(
        string refreshToken,
        CancellationToken cancellationToken = default)
    {
        if (!refreshTokenFactory.TryGetTokenId(refreshToken, out var oldTokenId))
        {
            throw InvalidSession();
        }

        var nextRefresh = refreshTokenFactory.Generate();
        User? user = null;
        var validSession = false;
        await unitOfWork.ExecuteInTransactionAsync(
            async transactionCancellationToken =>
            {
                var now = DateTime.UtcNow;
                var session = await refreshTokenRepository.GetByIdAsync(
                    oldTokenId,
                    transactionCancellationToken);
                if (session is null)
                {
                    return;
                }

                if (session.IsRevoked ||
                    !sha256Hasher.VerifyToken(refreshToken, session.Token))
                {
                    await refreshTokenRepository.RevokeAllActiveAsync(
                        session.UserId,
                        now,
                        transactionCancellationToken);
                    return;
                }

                if (session.ExpiresAtUtc <= now)
                {
                    return;
                }

                user = await userRepository.GetByIdAsync(
                    session.UserId,
                    transactionCancellationToken);
                if (user is null || !user.IsActive || !user.IsVerified)
                {
                    await refreshTokenRepository.RevokeAllActiveAsync(
                        session.UserId,
                        now,
                        transactionCancellationToken);
                    return;
                }

                var revoked = await refreshTokenRepository.TryRevokeActiveAsync(
                    session.Id,
                    session.UserId,
                    session.Token,
                    now,
                    transactionCancellationToken);
                if (revoked != 1)
                {
                    await refreshTokenRepository.RevokeAllActiveAsync(
                        session.UserId,
                        now,
                        transactionCancellationToken);
                    return;
                }

                await refreshTokenRepository.AddAsync(
                    CreateRefreshToken(user.Id, nextRefresh, now),
                    transactionCancellationToken);
                await unitOfWork.SaveChangesAsync(transactionCancellationToken);
                await refreshTokenRepository.RevokeExcessActiveAsync(
                    user.Id,
                    now,
                    transactionCancellationToken);
                validSession = true;
            },
            cancellationToken);

        if (!validSession || user is null)
        {
            throw InvalidSession();
        }

        var access = jwtService.Generate(user);

        return new AuthTokens(
            access.Token, access.ExpiresAtUtc,
            nextRefresh.RawToken, nextRefresh.ExpiresAtUtc);
    }

    public async Task<Guid> ForgotPasswordAsync(
        ForgotPasswordRequest request,
        CancellationToken cancellationToken = default)
    {
        await ValidateAsync(forgotPasswordValidator, request, cancellationToken);
        var email = NormalizeEmail(request.Email);
        var user = await userRepository.GetByNormalizedEmailAsync(
            email.ToUpperInvariant(), false, cancellationToken);

        if (user is null || !user.IsVerified || !user.IsActive ||
            string.IsNullOrWhiteSpace(user.PasswordHash) ||
            await redisStore.ReserveOtpRequestAsync(email) != OtpIssueResult.Allowed)
        {
            return Guid.NewGuid();
        }

        var otp = otpService.Generate();
        var challenge = CreateChallenge(
            AuthChallengePurpose.PasswordReset,
            email,
            email.ToUpperInvariant(),
            otp,
            passwordHash: null);
        await challengeStore.StoreAsync(challenge, cancellationToken);

        try
        {
            await QueueOtpEmailAsync(
                email, otp, OtpPurpose.ResetPassword, cancellationToken);
        }
        catch (Exception exception)
        {
            await challengeStore.DeleteAsync(challenge.Id, CancellationToken.None);
            logger.LogError(
                exception,
                "Failed to queue password reset OTP for {EmailRef}.",
                EmailReference(email));
        }

        return challenge.Id;
    }

    public async Task VerifyResetOtpAsync(
        VerifyResetOtpRequest request,
        CancellationToken cancellationToken = default)
    {
        await ValidateAsync(verifyResetOtpValidator, request, cancellationToken);
        _ = await ValidateChallengeOtpAsync(
            request.ResetId,
            AuthChallengePurpose.PasswordReset,
            request.Otp,
            cancellationToken);
    }

    public async Task ResetPasswordAsync(
        ResetPasswordRequest request,
        CancellationToken cancellationToken = default)
    {
        await ValidateAsync(resetPasswordValidator, request, cancellationToken);
        var submittedHash = await ValidateChallengeOtpAsync(
            request.ResetId,
            AuthChallengePurpose.PasswordReset,
            request.Otp,
            cancellationToken);

        await unitOfWork.ExecuteInTransactionAsync(
            async transactionCancellationToken =>
            {
                var now = DateTime.UtcNow;
                var challenge = await challengeStore.GetAsync(
                    request.ResetId,
                    transactionCancellationToken);
                EnsureChallengeUsable(challenge, AuthChallengePurpose.PasswordReset, now);

                if (!otpService.FixedTimeEquals(submittedHash, challenge!.OtpHash) ||
                    !await challengeStore.TryConsumeAsync(
                        challenge.Id,
                        AuthChallengePurpose.PasswordReset,
                        submittedHash,
                        now,
                        transactionCancellationToken))
                {
                    throw InvalidChallenge();
                }

                var user = await userRepository.GetByNormalizedEmailAsync(
                    challenge.NormalizedEmail,
                    true,
                    transactionCancellationToken)
                    ?? throw InvalidChallenge();

                user.PasswordHash = passwordHasher.Hash(request.NewPassword);
                user.UpdatedAt = now;
                await refreshTokenRepository.RevokeAllActiveAsync(
                    user.Id,
                    now,
                    transactionCancellationToken);
                await unitOfWork.SaveChangesAsync(transactionCancellationToken);
            },
            cancellationToken);
    }

    public async Task LogoutAsync(
        Guid userId,
        string jti,
        DateTime accessTokenExpiresAtUtc,
        string? refreshToken,
        CancellationToken cancellationToken = default)
    {
        if (!string.IsNullOrWhiteSpace(refreshToken) &&
            refreshTokenFactory.TryGetTokenId(refreshToken, out var tokenId))
        {
            var storedToken = await refreshTokenRepository.GetByIdAsync(
                tokenId,
                cancellationToken);
            if (storedToken is not null &&
                storedToken.UserId == userId &&
                !storedToken.IsRevoked &&
                sha256Hasher.VerifyToken(refreshToken, storedToken.Token))
            {
                await refreshTokenRepository.TryRevokeActiveAsync(
                    storedToken.Id,
                    userId,
                    storedToken.Token,
                    DateTime.UtcNow,
                    cancellationToken);
            }
        }

        await redisStore.BlacklistAccessTokenAsync(
            jti, accessTokenExpiresAtUtc - DateTime.UtcNow);
    }

    private AuthChallengeData CreateChallenge(
        AuthChallengePurpose purpose,
        string email,
        string normalizedEmail,
        string otp,
        string? passwordHash)
    {
        var now = DateTime.UtcNow;
        return new AuthChallengeData(
            Guid.NewGuid(),
            purpose,
            email,
            normalizedEmail,
            passwordHash,
            otpService.Hash(otp),
            0,
            otpService.MaxAttempts,
            now.AddMinutes(otpService.ExpiryMinutes),
            now);
    }

    private async Task<string> ValidateChallengeOtpAsync(
        Guid challengeId,
        AuthChallengePurpose purpose,
        string submittedOtp,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var challenge = await challengeStore.GetAsync(
            challengeId, cancellationToken);
        EnsureChallengeUsable(challenge, purpose, now);

        var submittedHash = otpService.Hash(submittedOtp);
        if (otpService.FixedTimeEquals(submittedHash, challenge!.OtpHash))
        {
            return submittedHash;
        }

        _ = await challengeStore.IncrementFailureAsync(
            challengeId, purpose, now, cancellationToken);
        throw InvalidChallenge();
    }

    private static void EnsureChallengeUsable(
        AuthChallengeData? challenge,
        AuthChallengePurpose purpose,
        DateTime nowUtc,
        bool allowExpired = false)
    {
        if (challenge is null ||
            challenge.Purpose != purpose ||
            challenge.FailedAttempts >= challenge.MaxAttempts ||
            (!allowExpired && challenge.ExpiresAtUtc <= nowUtc))
        {
            throw InvalidChallenge();
        }
    }

    private async Task<AuthTokens> CreateTokensAsync(
        User user,
        CancellationToken cancellationToken = default)
    {
        var access = jwtService.Generate(user);
        var refresh = refreshTokenFactory.Generate();
        await unitOfWork.ExecuteInTransactionAsync(
            async transactionCancellationToken =>
            {
                var now = DateTime.UtcNow;
                await refreshTokenRepository.AddAsync(
                    CreateRefreshToken(user.Id, refresh, now),
                    transactionCancellationToken);
                await unitOfWork.SaveChangesAsync(transactionCancellationToken);
                await refreshTokenRepository.RevokeExcessActiveAsync(
                    user.Id,
                    now,
                    transactionCancellationToken);
            },
            cancellationToken);
        return new AuthTokens(
            access.Token, access.ExpiresAtUtc,
            refresh.RawToken, refresh.ExpiresAtUtc);
    }

    private static RefreshToken CreateRefreshToken(
        Guid userId,
        GeneratedRefreshToken generated,
        DateTime createdAtUtc) =>
        new()
        {
            Id = generated.TokenId,
            Token = generated.TokenHash,
            UserId = userId,
            CreatedAtUtc = createdAtUtc,
            ExpiresAtUtc = generated.ExpiresAtUtc
        };

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
                    otpService.ExpiryMinutes,
                    purpose),
                OtpEmailTemplate.TemplateKey(purpose)),
            cancellationToken);

    private async Task EnsureOtpCanBeIssuedAsync(string email)
    {
        var result = await redisStore.ReserveOtpRequestAsync(email);
        if (result == OtpIssueResult.Cooldown)
        {
            throw new UseCaseException(
                ApplicationErrorKind.RateLimited,
                "Vui lòng chờ trước khi yêu cầu OTP mới.");
        }
        if (result == OtpIssueResult.RateLimited)
        {
            throw new UseCaseException(
                ApplicationErrorKind.RateLimited,
                "Đã vượt quá số lần yêu cầu OTP.");
        }
    }

    private string EmailReference(string email)
    {
        var hash = sha256Hasher.HashIdentifier(email);
        return hash[..12];
    }

    private static string NormalizeEmail(string email) =>
        email.Trim().ToLowerInvariant();

    private static UseCaseException InvalidChallenge() =>
        new(
            ApplicationErrorKind.Validation,
            "Mã xác thực không hợp lệ, đã hết hạn hoặc đã được sử dụng.",
            "invalid_challenge");

    private static UseCaseException InvalidSession() =>
        new(
            ApplicationErrorKind.Unauthorized,
            "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.",
            "invalid_session");

    private static async Task ValidateAsync<T>(
        IValidator<T> validator,
        T value,
        CancellationToken cancellationToken)
    {
        var result = await validator.ValidateAsync(value, cancellationToken);
        if (!result.IsValid)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                string.Join(" ", result.Errors.Select(error => error.ErrorMessage)),
                "validation_error");
        }
    }
}
