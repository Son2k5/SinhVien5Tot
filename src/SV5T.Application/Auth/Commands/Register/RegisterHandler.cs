using MediatR;
using SV5T.Application.Auth.Support;
using SV5T.Application.Auth.Templates;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Models;
using SV5T.Domain.Auth.Enums;
using SV5T.Domain.Users;

namespace SV5T.Application.Auth.Commands.Register;

public sealed record RegisterCommand(string Name, string Email, string Password) : IRequest<Guid>;

public sealed class RegisterHandler(
    IUserRepository userRepository,
    IAuthChallengeStore challengeStore,
    IPasswordHasher passwordHasher,
    IOtpService otpService,
    IAuthRedisStore throttleStore,
    IEmailQueue emailQueue) : IRequestHandler<RegisterCommand, Guid>
{
    public async Task<Guid> Handle(RegisterCommand command, CancellationToken cancellationToken)
    {
        var displayName = command.Name.Trim();
        var email = AuthServiceSupport.NormalizeEmail(command.Email);
        var normalizedEmail = email.ToUpperInvariant();
        await EnsureOtpCanBeIssuedAsync(email);
        var passwordHash = passwordHasher.Hash(command.Password);
        var existing = await userRepository.GetByNormalizedEmailAsync(
            normalizedEmail, false, cancellationToken);
        if (existing?.IsVerified == true)
        {
            return Guid.NewGuid();
        }

        var otp = otpService.Generate();
        var now = DateTime.UtcNow;
        var challenge = new AuthChallengeData(
            Guid.NewGuid(), AuthChallengePurpose.Registration, email, normalizedEmail, displayName, passwordHash,
            otpService.Hash(otp), 0, otpService.MaxAttempts,
            now.Add(otpService.Expiry), now);

        await challengeStore.StoreAsync(challenge, cancellationToken);
        try
        {
            await emailQueue.EnqueueAsync(
                new EmailMessage(
                    email,
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

        return challenge.Id;
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
