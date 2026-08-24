using SV5T.Application.Common.Interfaces;
using SV5T.Domain.Auth;

namespace SV5T.Application.Auth.Commands.Logout;

public sealed record LogoutCommand(Guid UserId, string? RefreshToken);

public sealed class LogoutHandler(
    IRefreshTokenRepository refreshTokenRepository,
    IUnitOfWork unitOfWork,
    ISha256Hasher sha256Hasher,
    IRefreshTokenFactory refreshTokenFactory) : ICommandHandler<LogoutCommand>
{
    public async Task HandleAsync(LogoutCommand command, CancellationToken cancellationToken = default)
    {
        var userId = command.UserId;
        var refreshToken = command.RefreshToken;

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
}
