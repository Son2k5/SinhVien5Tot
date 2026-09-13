namespace SV5T.Api.Security;

internal static class AuthRateLimitPolicies
{
    internal const string Register = "auth-register";
    internal const string Login = "auth-login";
    internal const string Otp = "auth-otp";
    internal const string Email = "auth-email";
    internal const string Refresh = "auth-refresh";
}
