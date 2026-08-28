using FluentValidation;
using SV5T.Application.Auth.Dtos;
using SV5T.Application.Auth.Support;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Common.Abstractions;
using SV5T.Domain.Auth;
using SV5T.Domain.Users;
using RefreshTokenEntity = SV5T.Domain.Auth.RefreshToken;

namespace SV5T.Application.Auth.Commands.Login;

public sealed record LoginCommand(LoginRequest Request, string IpAddress);

public sealed class LoginHandler(
    IUserRepository userRepository,
    IRefreshTokenRepository refreshTokenRepository,
    IUnitOfWork unitOfWork,
    IPasswordHasher passwordHasher,
    IAuthRedisStore throttleStore,
    IJwtService jwtService,
    IRefreshTokenFactory refreshTokenFactory,
    IValidator<LoginRequest> loginValidator) : ICommandHandler<LoginCommand, AuthTokens>
{
    public async Task<AuthTokens> HandleAsync(LoginCommand command, CancellationToken cancellationToken = default)
    {
        var request = command.Request;
        var ipAddress = command.IpAddress;

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
                    new RefreshTokenEntity
                    {
                        Id = refresh.TokenId,
                        Token = refresh.TokenHash,
                        UserId = user.Id,
                        FamilyId = familyId,
                        CreatedAtUtc = now,
                        LastUsedAtUtc = now,
                        ExpiresAtUtc = refresh.ExpiresAtUtc,
                        AbsoluteExpiresAtUtc = refresh.AbsoluteExpiresAtUtc,
                        IsPersistent = refresh.IsPersistent
                    },
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
}
