namespace SV5T.Application.Common.Exceptions;

public sealed class UseCaseException(
    ApplicationErrorKind kind,
    string publicMessage,
    string? errorCode = null)
    : Exception("A handled application error occurred.")
{
    public ApplicationErrorKind Kind { get; } = kind;

    public string PublicMessage { get; } = publicMessage;

    public string ErrorCode { get; } = errorCode ?? kind switch
    {
        ApplicationErrorKind.Validation => "invalid_request",
        ApplicationErrorKind.Unauthorized => "unauthorized",
        ApplicationErrorKind.Forbidden => "forbidden",
        ApplicationErrorKind.NotFound => "not_found",
        ApplicationErrorKind.Conflict => "conflict",
        ApplicationErrorKind.RateLimited => "rate_limited",
        _ => "request_failed"
    };
}
