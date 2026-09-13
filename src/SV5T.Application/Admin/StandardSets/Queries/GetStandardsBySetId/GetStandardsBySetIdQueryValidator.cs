using FluentValidation;

namespace SV5T.Application.Admin.StandardSets.Queries.GetStandardsBySetId;

public sealed class GetStandardsBySetIdQueryValidator : AbstractValidator<GetStandardsBySetIdQuery>
{
    public GetStandardsBySetIdQueryValidator()
    {
        RuleFor(x => x.StandardSetId).NotEmpty().WithMessage("Thiếu định danh bộ tiêu chuẩn.");
    }
}
