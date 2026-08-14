namespace SV5T.Application.Interfaces.Services.Auth;

public enum OtpPurpose
{
    Register,
    ResetPassword
}

public enum OtpIssueResult
{
    Allowed,
    Cooldown,
    RateLimited
}

public interface IAuthRedisStore
{
    Task<OtpIssueResult> ReserveOtpRequestAsync(string email);
    Task<bool> IsLoginBlockedAsync(string email, string ipAddress);
    Task RecordLoginFailureAsync(string email, string ipAddress);
    Task ClearAccountLoginFailuresAsync(string email);
}
