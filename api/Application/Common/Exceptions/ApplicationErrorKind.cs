namespace SV5T.Application.Common.Exceptions;

public enum ApplicationErrorKind
{
    Validation,
    Unauthorized,
    Forbidden,
    NotFound,
    Conflict,
    RateLimited,
    Unavailable
}
