using FluentValidation;
using SV5T.Application.Admin.Dtos;
using SV5T.Domain.Submissions.Enums;

namespace SV5T.Application.Admin.Students.Validators;

public sealed class DeleteStudentRequestValidator : AbstractValidator<DeleteStudentRequest>
{
    public DeleteStudentRequestValidator()
    {
        RuleFor(x => x.Confirm).Equal(true).WithMessage("Vui lòng xác nhận xóa sinh viên trước khi thực hiện.");

        RuleFor(x => x.Reason)
            .MaximumLength(500)
            .WithMessage("Lý do xóa không được quá 500 ký tự.")
            .When(x => !string.IsNullOrWhiteSpace(x.Reason));
    }
}

public sealed class LockStudentRequestValidator : AbstractValidator<LockStudentRequest>
{
    public LockStudentRequestValidator()
    {
        RuleFor(x => x.Reason)
            .MaximumLength(500)
            .WithMessage("Lý do khóa không được quá 500 ký tự.")
            .When(x => !string.IsNullOrWhiteSpace(x.Reason));
    }
}

public sealed class UnlockStudentRequestValidator : AbstractValidator<UnlockStudentRequest>
{
    public UnlockStudentRequestValidator()
    {
        RuleFor(x => x.Reason)
            .MaximumLength(500)
            .WithMessage("Lý do mở khóa không được quá 500 ký tự.")
            .When(x => !string.IsNullOrWhiteSpace(x.Reason));
    }
}
public sealed class ReviewStudentEvidenceRequestValidator : AbstractValidator<ReviewStudentEvidenceRequest>
{
    public ReviewStudentEvidenceRequestValidator()
    {
        RuleFor(x => x.EvidenceId).NotEmpty().WithMessage("Thiếu mã minh chứng cần xét duyệt.");

        RuleFor(x => x.Decision)
            .Must(d => d is EvidenceStatus.Approved or EvidenceStatus.Rejected or EvidenceStatus.NeedsRevision)
            .WithMessage("Trạng thái xét duyệt không hợp lệ (chỉ chấp nhận Approved, Rejected hoặc NeedsRevision).");

        RuleFor(x => x.Note)
            .NotEmpty()
            .When(x => x.Decision is EvidenceStatus.Rejected or EvidenceStatus.NeedsRevision)
            .WithMessage("Bắt buộc phải nhập nhận xét/lý do khi từ chối hoặc yêu cầu bổ sung minh chứng.");

        RuleFor(x => x.Note)
            .MaximumLength(2000)
            .WithMessage("Nhận xét không được quá 2000 ký tự.")
            .When(x => !string.IsNullOrWhiteSpace(x.Note));

        RuleFor(x => x.RowVersion)
            .NotEmpty()
            .WithMessage("Thiếu RowVersion — không xác định được phiên bản đồng thời của minh chứng.");
    }
}
