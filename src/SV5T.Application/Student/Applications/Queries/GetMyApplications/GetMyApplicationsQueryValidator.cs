using FluentValidation;

namespace SV5T.Application.Student.Applications.Queries.GetMyApplications;

public sealed class GetMyApplicationsQueryValidator : AbstractValidator<GetMyApplicationsQuery>
{
    public GetMyApplicationsQueryValidator()
    {
        RuleFor(x => x.PageIndex).GreaterThanOrEqualTo(1).WithMessage("Số trang phải lớn hơn hoặc bằng 1.");
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100).WithMessage("Số lượng mỗi trang phải từ 1 đến 100.");
        RuleFor(x => x.Status).IsInEnum().When(x => x.Status.HasValue).WithMessage("Trạng thái không hợp lệ.");
    }
}
