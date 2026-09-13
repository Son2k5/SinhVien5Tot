using MediatR;
using SV5T.Application.Auth.Dtos;
using SV5T.Application.Auth.Support;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Models;
using SV5T.Domain.Auth;
using SV5T.Domain.Users;

namespace SV5T.Application.Auth.Commands.RefreshToken;

public sealed record RefreshTokenCommand(string RefreshToken) : IRequest<AuthTokens>;

public sealed class RefreshTokenHandler(
    IUserRepository userRepository,
    IRefreshTokenRepository refreshTokenRepository,
    IUnitOfWork unitOfWork,
    ISha256Hasher sha256Hasher,
    IJwtService jwtService,
    IRefreshTokenFactory refreshTokenFactory) : IRequestHandler<RefreshTokenCommand, AuthTokens>
{
    public async Task<AuthTokens> Handle(RefreshTokenCommand command, CancellationToken cancellationToken)
    {
        var refreshToken = command.RefreshToken;
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
                    new SV5T.Domain.Auth.RefreshToken
                    {
                        Id = nextRefresh.TokenId,
                        Token = nextRefresh.TokenHash,
                        UserId = user.Id,
                        FamilyId = session.FamilyId,
                        CreatedAtUtc = now,
                        LastUsedAtUtc = now,
                        ExpiresAtUtc = nextRefresh.ExpiresAtUtc,
                        AbsoluteExpiresAtUtc = nextRefresh.AbsoluteExpiresAtUtc,
                        IsPersistent = nextRefresh.IsPersistent
                    },
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
}
