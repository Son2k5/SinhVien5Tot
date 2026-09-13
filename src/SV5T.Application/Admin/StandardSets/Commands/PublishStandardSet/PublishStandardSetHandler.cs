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
        PublishStandardSetCommand request,
        CancellationToken cancellationToken
    )
    {
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
                "Chi co the cong bo bo tieu chuan dang o trang thai Nhap (Draft).",
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
            if (required.Any(g => !standardSet.Standards.Any(x => x.GroupCode == g)))
                throw new UseCaseException(
                    ApplicationErrorKind.Validation,
                    "Bo tieu chuan ca nhan phai co day du 5 tieu chuan goc (Dao duc, Hoc tap, The luc, Tinh nguyen, Hoi nhap).",
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
            "Khong xac dinh duoc danh tinh nguoi dung hien tai."
        );
}
