using FluentValidation;
using MediatR;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Admin.StandardSets.Common;
using SV5T.Application.Auth.Support;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Standards.Abstractions;
using SV5T.Domain.Standards;
using SV5T.Domain.Standards.Enums;

namespace SV5T.Application.Admin.StandardSets.Commands.AddStandard;

public sealed class AddStandardHandler(
    IStandardSetRepository standardSetRepository,
    IStandardRepository standardRepository,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser,
    IValidator<CreateStandardRequest> validator
) : IRequestHandler<AddStandardCommand, StandardResponse>
{
    public async Task<StandardResponse> Handle(AddStandardCommand request, CancellationToken cancellationToken)
    {
        await AuthServiceSupport.ValidateAsync(validator, request.Request, cancellationToken);
        var standardSet =
            await standardSetRepository.GetByIdAsync(
                request.StandardSetId,
                tracking: false,
                cancellationToken: cancellationToken
            )
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Khong tim thay bo tieu chuan.",
                "standard_set_not_found"
            );
        if (standardSet.Status != StandardSetStatus.Draft)
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Khong the them tieu chuan vao bo tieu chuan da cong bo (Published).",
                "standard_set_not_editable"
            );
        string finalCode = request.Request.Code?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(finalCode))
        {
            finalCode = request.Request.GroupCode switch
            {
                StandardGroupCode.Ethics => "TC_DAODUC",
                StandardGroupCode.Study => "TC_HOCTAP",
                StandardGroupCode.Fitness => "TC_THELUC",
                StandardGroupCode.Volunteer => "TC_TINHNGUYEN",
                StandardGroupCode.Integration => "TC_HOINHAP",
                _ => $"TC_STD_{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}",
            };
        }
        var codeExists = await standardRepository.ExistsCodeInStandardSetAsync(
            request.StandardSetId,
            finalCode,
            cancellationToken: cancellationToken
        );
        if (codeExists)
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                $"Ma tieu chuan '{finalCode}' da ton tai trong bo tieu chuan nay.",
                "standard_code_duplicate"
            );
        var actorId = RequireAdminUserId();
        var standard = new Standard
        {
            StandardSetId = request.StandardSetId,
            GroupCode = request.Request.GroupCode,
            Code = finalCode,
            Title = request.Request.Title.Trim(),
            Description = request.Request.Description?.Trim(),
            DisplayOrder = request.Request.DisplayOrder,
            Operator = request.Request.Operator,
            MinimumSatisfied = request.Request.MinimumSatisfied,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = actorId.ToString(),
        };
        await standardRepository.AddAsync(standard, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return AdminStandardMappings.MapToStandardResponse(standard);
    }

    private Guid RequireAdminUserId() =>
        currentUser.UserId
        ?? throw new UseCaseException(
            ApplicationErrorKind.Unauthorized,
            "Khong xac dinh duoc danh tinh nguoi dung hien tai."
        );
}
