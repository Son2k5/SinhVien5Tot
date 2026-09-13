using MediatR;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Admin.StandardSets.Common;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Standards.Abstractions;
using SV5T.Domain.Standards.Enums;

namespace SV5T.Application.Admin.StandardSets.Commands.UpdateStandardSet;

public sealed class UpdateStandardSetHandler(
    IStandardSetRepository standardSetRepository,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser
) : IRequestHandler<UpdateStandardSetCommand, StandardSetResponse>
{
    public async Task<StandardSetResponse> Handle(UpdateStandardSetCommand command, CancellationToken cancellationToken)
    {
        var actorId = RequireAdminUserId();
        var updateRequest = command.Request;
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
                "Chỉ có thể chỉnh sửa thông tin bộ tiêu chuẩn đang ở trạng thái Nháp (Draft).",
                "standard_set_not_editable"
            );
        var exists = await standardSetRepository.ExistsByAcademicYearAndLevelAsync(
            updateRequest.AcademicYear.Trim(),
            updateRequest.Level,
            updateRequest.AwardType,
            standardSet.Version,
            excludeId: standardSet.Id,
            cancellationToken: cancellationToken
        );
        if (exists)
        {
            var academicYear = updateRequest.AcademicYear;
            var level = updateRequest.Level;
            var awardType = updateRequest.AwardType;
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                $"Đã tồn tại bộ tiêu chuẩn cho năm học '{academicYear}', " +
                $"cấp '{level}' và loại '{awardType}'.",
                "standard_set_duplicate"
            );
        }
        standardSet.Name = updateRequest.Name.Trim();
        standardSet.AcademicYear = updateRequest.AcademicYear.Trim();
        standardSet.Level = updateRequest.Level;
        standardSet.AwardType = updateRequest.AwardType;
        standardSet.UpdatedAt = DateTime.UtcNow;
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

