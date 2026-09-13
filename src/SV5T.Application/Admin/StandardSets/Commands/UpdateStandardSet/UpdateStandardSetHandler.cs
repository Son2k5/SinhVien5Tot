using FluentValidation;
using MediatR;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Admin.StandardSets.Common;
using SV5T.Application.Auth.Support;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Standards.Abstractions;
using SV5T.Domain.Standards.Enums;

namespace SV5T.Application.Admin.StandardSets.Commands.UpdateStandardSet;

public sealed class UpdateStandardSetHandler(
    IStandardSetRepository standardSetRepository,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser,
    IValidator<UpdateStandardSetRequest> validator
) : IRequestHandler<UpdateStandardSetCommand, StandardSetResponse>
{
    public async Task<StandardSetResponse> Handle(UpdateStandardSetCommand request, CancellationToken cancellationToken)
    {
        await AuthServiceSupport.ValidateAsync(validator, request.Request, cancellationToken);
        var actorId = RequireAdminUserId();
        var standardSet =
            await standardSetRepository.GetByIdAsync(request.StandardSetId, true, true, true, cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Khong tim thay bo tieu chuan.",
                "standard_set_not_found"
            );
        if (standardSet.Status != StandardSetStatus.Draft)
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Chi co the chinh sua thong tin bo tieu chuan dang o trang thai Nhap (Draft).",
                "standard_set_not_editable"
            );
        var exists = await standardSetRepository.ExistsByAcademicYearAndLevelAsync(
            request.Request.AcademicYear.Trim(),
            request.Request.Level,
            request.Request.AwardType,
            standardSet.Version,
            excludeId: standardSet.Id,
            cancellationToken: cancellationToken
        );
        if (exists)
        {
            var academicYear = request.Request.AcademicYear;
            var level = request.Request.Level;
            var awardType = request.Request.AwardType;
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                $"Da ton tai bo tieu chuan cho nam hoc '{academicYear}', " +
                $"cap '{level}' va loai '{awardType}'.",
                "standard_set_duplicate"
            );
        }
        standardSet.AcademicYear = request.Request.AcademicYear.Trim();
        standardSet.Level = request.Request.Level;
        standardSet.AwardType = request.Request.AwardType;
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
            "Khong xac dinh duoc danh tinh nguoi dung hien tai."
        );
}
