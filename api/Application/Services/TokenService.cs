using FluentValidation;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.DTOs.Auth;
using SV5T.Application.Interfaces.Persistence;
using SV5T.Application.Interfaces.Repositories;
using SV5T.Application.Interfaces.Services.Auth;
using SV5T.Application.Interfaces.Services.Commons;
using SV5T.Application.Models.Auth;
using SV5T.Domain.Entities;

namespace SV5T.Application.Services;

public sealed class TokenService(
    IUserRepository userRepository,
    IRefreshTokenRepository refreshTokenRepository,
    IUnitOfWork unitOfWork,
    IPasswordHasher passwordHasher,
    ISha256Hasher sha256Hasher,
    IAuthRedisStore throttleStore,
    IJwtService jwtService,
    IRefreshTokenFactory refreshTokenFactory,
    IValidator<LoginRequest> loginValidator)
{
    public async Task<AuthTokens> LoginAsync(
        LoginRequest request,
        string ipAddress,
        CancellationToken cancellationToken)
    {
        await AuthServiceSupport.ValidateAsync(loginValidator, request, cancellationToken);
        var email = AuthServiceSupport.NormalizeEmail(request.Email);
        if (await throttleStore.IsLoginBlockedAsync(email, ipAddress))
        {
            throw new UseCaseException(
                ApplicationErrorKind.RateLimited,
                "Đăng nhập bị tạm khóa. Vui lòng thử lại sau.");
        }

        var user = await userRepository.GetByNormalizedEmailAsync(
            email.ToUpperInvariant(), false, cancellationToken);
        var passwordValid = passwordHasher.Verify(request.Password, user?.PasswordHash);
        if (user is null || !user.IsActive || !user.IsVerified ||
            string.IsNullOrWhiteSpace(user.PasswordHash) || !passwordValid)
        {
            await throttleStore.RecordLoginFailureAsync(email, ipAddress);
            throw new UseCaseException(
                ApplicationErrorKind.Unauthorized,
                "Email hoặc mật khẩu không đúng.");
        }

        await throttleStore.ClearAccountLoginFailuresAsync(email);
        return await CreateTokensAsync(user, request.RememberMe, cancellationToken);
    }

    public async Task<AuthTokens> RefreshAsync(
        string refreshToken,
        CancellationToken cancellationToken)
    {
        if (!refreshTokenFactory.TryGetTokenId(refreshToken, out var oldTokenId))
        {
            throw AuthServiceSupport.InvalidSession();
        }

        GeneratedRefreshToken? nextRefresh = null;
        User? user = null;
        var validRotation = false;
        var idleExpired = false;
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
                if (!sha256Hasher.VerifyToken(refreshToken, session.Token))
                {
                    return;
                }
                if (session.IsRevoked)
                {
                    await refreshTokenRepository.RevokeFamilyAsync(
                        session.FamilyId,
                        session.UserId,
                        now,
                        transactionCancellationToken);
                    return;
                }

                if (session.ExpiresAtUtc <= now ||
                    session.AbsoluteExpiresAtUtc <= now)
                {
                    await refreshTokenRepository.RevokeFamilyAsync(
                        session.FamilyId,
                        session.UserId,
                        now,
                        transactionCancellationToken);
                    return;
                }
                if (TokenIdlePolicy.IsIdleExpired(
                    session.LastUsedAtUtc,
                    now,
                    refreshTokenFactory.IdleTimeout))
                {
                    idleExpired = true;
                    await refreshTokenRepository.RevokeFamilyAsync(
                        session.FamilyId,
                        session.UserId,
                        now,
                        transactionCancellationToken);
                    return;
                }

                nextRefresh = refreshTokenFactory.Generate(
                    session.IsPersistent,
                    session.AbsoluteExpiresAtUtc);
                user = await userRepository.GetByIdAsync(
                    session.UserId,
                    transactionCancellationToken);
                if (user is null || !user.IsActive || !user.IsVerified)
                {
                    await refreshTokenRepository.RevokeFamilyAsync(
                        session.FamilyId,
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
                    nextRefresh.TokenId,
                    transactionCancellationToken);
                if (revoked != 1)
                {
                    await refreshTokenRepository.RevokeFamilyAsync(
                        session.FamilyId,
                        session.UserId,
                        now,
                        transactionCancellationToken);
                    return;
                }

                await refreshTokenRepository.AddAsync(
                    CreateRefreshToken(
                        user.Id,
                        session.FamilyId,
                        nextRefresh,
                        now,
                        now),
                    transactionCancellationToken);
                await unitOfWork.SaveChangesAsync(transactionCancellationToken);
                await refreshTokenRepository.RevokeExcessActiveAsync(
                    user.Id, now, transactionCancellationToken);
                validRotation = true;
            },
            cancellationToken);
        if (!validRotation || user is null || nextRefresh is null)
        {
            if (idleExpired)
            {
                throw AuthServiceSupport.IdleSessionExpired();
            }
            throw AuthServiceSupport.InvalidSession();
        }

        var access = jwtService.Generate(user);
        return new AuthTokens(
            access.Token,
            access.ExpiresAtUtc,
            nextRefresh.RawToken,
            nextRefresh.ExpiresAtUtc,
            nextRefresh.IsPersistent);
    }

    public async Task LogoutAsync(
        Guid userId,
        string? refreshToken,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken) ||
            !refreshTokenFactory.TryGetTokenId(refreshToken, out var tokenId))
        {
            return;
        }

        await unitOfWork.ExecuteInTransactionAsync(
            async transactionCancellationToken =>
            {
                var now = DateTime.UtcNow;
                var storedToken = await refreshTokenRepository.GetByIdAsync(
                    tokenId,
                    transactionCancellationToken);
                if (storedToken is not null &&
                    storedToken.UserId == userId &&
                    sha256Hasher.VerifyToken(refreshToken, storedToken.Token))
                {
                    await refreshTokenRepository.RevokeFamilyAsync(
                        storedToken.FamilyId,
                        userId,
                        now,
                        transactionCancellationToken);
                }
                await unitOfWork.SaveChangesAsync(transactionCancellationToken);
            },
            cancellationToken);
    }

    private async Task<AuthTokens> CreateTokensAsync(
        User user,
        bool isPersistent,
        CancellationToken cancellationToken)
    {
        var refresh = refreshTokenFactory.Generate(isPersistent);
        var now = DateTime.UtcNow;
        var familyId = Guid.NewGuid();
        await unitOfWork.ExecuteInTransactionAsync(
            async transactionCancellationToken =>
            {
                await refreshTokenRepository.AddAsync(
                    CreateRefreshToken(
                        user.Id,
                        familyId,
                        refresh,
                        now,
                        now),
                    transactionCancellationToken);
                await unitOfWork.SaveChangesAsync(transactionCancellationToken);
                await refreshTokenRepository.RevokeExcessActiveAsync(
                    user.Id, now, transactionCancellationToken);
            },
            cancellationToken);
        var access = jwtService.Generate(user);
        return new AuthTokens(
            access.Token,
            access.ExpiresAtUtc,
            refresh.RawToken,
            refresh.ExpiresAtUtc,
            refresh.IsPersistent);
    }

    private static RefreshToken CreateRefreshToken(
        Guid userId,
        Guid familyId,
        GeneratedRefreshToken generated,
        DateTime createdAtUtc,
        DateTime lastUsedAtUtc) =>
        new()
        {
            Id = generated.TokenId,
            Token = generated.TokenHash,
            UserId = userId,
            FamilyId = familyId,
            CreatedAtUtc = createdAtUtc,
            LastUsedAtUtc = lastUsedAtUtc,
            ExpiresAtUtc = generated.ExpiresAtUtc,
            AbsoluteExpiresAtUtc = generated.AbsoluteExpiresAtUtc,
            IsPersistent = generated.IsPersistent
        };
}
