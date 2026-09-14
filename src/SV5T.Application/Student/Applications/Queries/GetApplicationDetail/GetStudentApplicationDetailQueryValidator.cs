using FluentValidation;

namespace SV5T.Application.Student.Applications.Queries.GetApplicationDetail;

public sealed class GetStudentApplicationDetailQueryValidator : AbstractValidator<GetStudentApplicationDetailQuery>
{
    public GetStudentApplicationDetailQueryValidator()
    {
        RuleFor(x => x.ApplicationId).NotEmpty().WithMessage("Thieu dinh danh ho so.");
    }
}
