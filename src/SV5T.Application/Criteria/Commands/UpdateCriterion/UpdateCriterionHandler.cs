using FluentValidation;
using MediatR;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Admin.StandardSets.Common;
using SV5T.Application.Auth.Support;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Criteria.Abstractions;
using SV5T.Application.Standards.Abstractions;
using SV5T.Domain.Criteria;
using SV5T.Domain.Standards.Enums;

namespace SV5T.Application.Criteria.Commands.UpdateCriterion;

public sealed class UpdateCriterionHandler(
    IStandardRepository sr,
    IStandardSetRepository ssr,
    ICriterionRepository cr,
    IUnitOfWork uow,
    ICurrentUser cu,
    IValidator<UpdateCriterionRequest> v
) : IRequestHandler<UpdateCriterionCommand, CriterionResponse>
{
    public async Task<CriterionResponse> Handle(UpdateCriterionCommand req, CancellationToken ct)
    {
        await AuthServiceSupport.ValidateAsync(v, req.Request, ct);
        var standard =
            await sr.GetByIdAsync(req.StandardId, tracking: false, cancellationToken: ct)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Khong tim thay tieu chuan.",
                "standard_not_found"
            );
        var set =
            await ssr.GetByIdAsync(standard.StandardSetId, tracking: false, cancellationToken: ct)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Khong tim thay bo tieu chuan.",
                "standard_set_not_found"
            );
        if (set.Status != StandardSetStatus.Draft)
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Khong the sua tieu chi khi bo da cong bo.",
                "standard_set_not_editable"
            );
        var c =
            await cr.GetByIdAsync(req.CriterionId, tracking: true, cancellationToken: ct)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Khong tim thay tieu chi.",
                "criterion_not_found"
            );
        if (c.StandardId != req.StandardId)
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "Tieu chi khong thuoc tieu chuan.",
                "invalid_criterion_scope"
            );
        if (
            !string.IsNullOrWhiteSpace(req.Request.Code)
            && !string.Equals(c.Code, req.Request.Code.Trim(), StringComparison.OrdinalIgnoreCase)
        )
        {
            var ex = await cr.ExistsCodeInStandardAsync(
                req.StandardId,
                req.Request.Code.Trim(),
                excludeId: req.CriterionId,
                cancellationToken: ct
            );
            if (ex)
                throw new UseCaseException(
                    ApplicationErrorKind.Conflict,
                    $"Ma '{req.Request.Code.Trim()}' da dung.",
                    "criterion_code_duplicate"
                );
            c.Code = req.Request.Code.Trim();
        }
        if (req.Request.ParentCriterionId.HasValue)
        {
            if (req.Request.ParentCriterionId.Value == req.CriterionId)
                throw new UseCaseException(
                    ApplicationErrorKind.Validation,
                    "Khong tu lam cha.",
                    "self_referencing_criterion"
                );
            var p = await cr.GetByIdAsync(req.Request.ParentCriterionId.Value, cancellationToken: ct);
            if (p is null || p.StandardId != req.StandardId || p.Type != CriterionType.Group)
                throw new UseCaseException(
                    ApplicationErrorKind.Validation,
                    "Tieu chi cha khong hop le.",
                    "invalid_parent_criterion"
                );
        }
        var actor = cu.UserId ?? throw new UseCaseException(ApplicationErrorKind.Unauthorized, "Khong xac dinh user.");
        c.ParentCriterionId = req.Request.ParentCriterionId;
        c.Type = req.Request.Type;
        if (!string.IsNullOrWhiteSpace(req.Request.Code))
            c.Code = req.Request.Code.Trim();
        c.Title = req.Request.Title.Trim();
        c.Description = req.Request.Description?.Trim();
        c.DisplayOrder = req.Request.DisplayOrder;
        c.Operator = req.Request.Operator;
        c.MinimumSatisfied = req.Request.MinimumSatisfied;
        c.EvaluationType = req.Request.EvaluationType;
        c.DefinitionJson = req.Request.DefinitionJson;
        c.ReviewGuidance = req.Request.ReviewGuidance?.Trim();
        c.UpdatedAt = DateTime.UtcNow;
        c.UpdatedBy = actor.ToString();
        await cr.UpdateAsync(c, ct);
        await uow.SaveChangesAsync(ct);
        return AdminStandardMappings.MapToCriterionResponse(c);
    }
}
