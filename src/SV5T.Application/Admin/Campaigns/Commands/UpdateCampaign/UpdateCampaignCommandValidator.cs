using FluentValidation;
using SV5T.Application.Admin.Dtos;

namespace SV5T.Application.Admin.Campaigns.Commands.UpdateCampaign;

public sealed class UpdateCampaignCommandValidator : AbstractValidator<UpdateCampaignCommand>
{
    public UpdateCampaignCommandValidator(IValidator<UpdateCampaignRequest> requestValidator)
    {
        RuleFor(x => x.Id).NotEmpty().WithMessage("Thiếu định danh chiến dịch.");
        RuleFor(x => x.Request).NotNull().WithMessage("Thiếu thông tin cập nhật chiến dịch.");
        RuleFor(x => x.Request).SetValidator(requestValidator!);
    }
}
