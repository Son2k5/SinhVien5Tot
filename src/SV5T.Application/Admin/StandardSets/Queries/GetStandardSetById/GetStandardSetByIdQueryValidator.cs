using FluentValidation;

namespace SV5T.Application.Admin.StandardSets.Queries.GetStandardSetById;

public sealed class GetStandardSetByIdQueryValidator : AbstractValidator<GetStandardSetByIdQuery>
{
    public GetStandardSetByIdQueryValidator()
    {
        RuleFor(x => x.Id).NotEmpty().WithMessage("Thiếu định danh bộ tiêu chuẩn.");
    }
}
