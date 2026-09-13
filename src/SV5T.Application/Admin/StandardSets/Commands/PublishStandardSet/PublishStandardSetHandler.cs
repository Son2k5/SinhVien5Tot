using MediatR;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Admin.StandardSets.Common;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Standards.Abstractions;
using SV5T.Domain.Awards.Enums;
using SV5T.Domain.Standards.Enums;

namespace SV5T.Application.Admin.StandardSets.Commands.PublishStandardSet;

public sealed class PublishStandardSetHandler(
    IStandardSetRepository standardSetRepository,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser
) : IRequestHandler<PublishStandardSetCommand, StandardSetResponse>
{
    public async Task<StandardSetResponse> Handle(
        PublishStandardSetCommand command,
        CancellationToken cancellationToken
    )
    {
        var standardSet =
            await standardSetRepository.GetByIdAsync(command.StandardSetId, true, true, true, cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy bộ tiêu chuẩn.",
                "standard_set_not_found"
            );
        if (standardSet.Status != StandardSetStatus.Draft)
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Chỉ có thể công bố bộ tiêu chuẩn đang ở trạng thái Nháp (Draft).",
                "standard_set_not_draft"
            );
        if (standardSet.AwardType == AwardType.Individual)
        {
            var required = new[]
            {
                StandardGroupCode.Ethics,
                StandardGroupCode.Study,
                StandardGroupCode.Fitness,
                StandardGroupCode.Volunteer,
                StandardGroupCode.Integration,
            };
            if (required.Any(groupCode => !standardSet.Standards.Any(standard => standard.GroupCode == groupCode)))
                throw new UseCaseException(
                    ApplicationErrorKind.Validation,
                    "Bộ tiêu chuẩn cá nhân phải có đầy đủ 5 tiêu chuẩn gốc (Đạo đức, Học tập, Thể lực, Tình nguyện, Hội nhập).",
                    "missing_standard_groups"
                );
        }
        var actorId = RequireAdminUserId();
        var now = DateTime.UtcNow;
        standardSet.Status = StandardSetStatus.Published;
        standardSet.PublishedAt = now;
        standardSet.UpdatedAt = now;
        standardSet.UpdatedBy = actorId.ToString();
        await standardSetRepository.UpdateAsync(standardSet, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return AdminStandardMappings.MapToSetResponse(standardSet, true);
    }

    private Guid RequireAdminUserId() =>
        currentUser.UserId
        ?? throw new UseCaseException(
            ApplicationErrorKind.Unauthorized,
            "Không xác định được danh tính người dùng hiện tại."
        );
}

