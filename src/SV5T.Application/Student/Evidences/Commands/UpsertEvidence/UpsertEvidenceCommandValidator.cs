using FluentValidation;

namespace SV5T.Application.Student.Evidences.Commands.UpsertEvidence;

public sealed class UpsertEvidenceCommandValidator : AbstractValidator<UpsertEvidenceCommand>
{
    public UpsertEvidenceCommandValidator(IValidator<UpsertEvidenceRequest> requestValidator)
    {
        RuleFor(x => x.ApplicationId).NotEmpty().WithMessage("Thiếu định danh hồ sơ.");
        RuleFor(x => x.CriterionId).NotEmpty().WithMessage("Thiếu định danh tiêu chí.");
        RuleFor(x => x.Request).NotNull().WithMessage("Thiếu thông tin minh chứng.");
        RuleFor(x => x.Request).SetValidator(requestValidator!);
    }
}

public sealed class UpsertEvidenceRequestValidator : AbstractValidator<UpsertEvidenceRequest>
{
    public UpsertEvidenceRequestValidator()
    {
        RuleFor(x => x.DataJson).NotEmpty().WithMessage("Nội dung minh chứng không được để trống.");
        RuleFor(x => x.DataJson)
            .Must(BeValidJson).WithMessage("Nội dung minh chứng không đúng định dạng.")
            .When(x => !string.IsNullOrWhiteSpace(x.DataJson));
    }

    private static bool BeValidJson(string json)
    {
        try
        {
            using var doc = System.Text.Json.JsonDocument.Parse(json);
            return true;
        }
        catch
        {
            return false;
        }
    }
}
