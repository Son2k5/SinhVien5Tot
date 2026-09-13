using FluentValidation;

namespace SV5T.Application.Admin.Campaigns.Commands.UpdateCampaignStatus;

public sealed class UpdateCampaignStatusCommandValidator : AbstractValidator<UpdateCampaignStatusCommand>
{
    public UpdateCampaignStatusCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty().WithMessage("Thiếu định danh chiến dịch.");
        RuleFor(x => x.Request).NotNull().WithMessage("Thiếu thông tin trạng thái chiến dịch.");
        RuleFor(x => x.Request.Status).IsInEnum().WithMessage("Trạng thái chiến dịch không hợp lệ.");
    }
}
