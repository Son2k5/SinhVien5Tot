using FluentValidation;

namespace SV5T.Application.Admin.Campaigns.Commands.DeleteCampaign;

public sealed class DeleteCampaignCommandValidator : AbstractValidator<DeleteCampaignCommand>
{
    public DeleteCampaignCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty().WithMessage("Thiếu định danh chiến dịch.");
    }
}
