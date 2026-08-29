using FluentValidation;
using SV5T.Application.Common.Exceptions;

namespace SV5T.Application.Common;

public static class ValidationExecutor
{
    public static async Task ValidateAsync<T>(
        IValidator<T> validator,
        T request,
        CancellationToken cancellationToken = default)
    {
        var result = await validator.ValidateAsync(request, cancellationToken);

        if (!result.IsValid)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                string.Join(" ", result.Errors.Select(e => e.ErrorMessage)),
                "validation_error");
        }
    }
}
