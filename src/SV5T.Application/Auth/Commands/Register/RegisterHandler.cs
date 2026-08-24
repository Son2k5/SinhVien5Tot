using FluentValidation;
using SV5T.Application.Auth.Dtos;
using SV5T.Application.Auth.Support;
using SV5T.Application.Auth.Templates;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Common.Interfaces;
using SV5T.Application.Common.Models;
using SV5T.Domain.Auth.Enums;
using SV5T.Domain.Users;

namespace SV5T.Application.Auth.Commands.Register;

public sealed record RegisterCommand(string Name, string Email, string Password);

public sealed class RegisterHandler(
    IUserRepository userRepository,
    IAuthChallengeStore challengeStore,
    IPasswordHasher passwordHasher,
    IOtpService otpService,
    IAuthRedisStore throttleStore,
    IEmailQueue emailQueue,
    IValidator<RegisterRequest> registerValidator) : ICommandHandler<RegisterCommand, Guid>
{
    public async Task<Guid> HandleAsync(RegisterCommand command, CancellationToken cancellationToken = default)
    {
        var request = new RegisterRequest(command.Name, command.Email, command.Password);
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
