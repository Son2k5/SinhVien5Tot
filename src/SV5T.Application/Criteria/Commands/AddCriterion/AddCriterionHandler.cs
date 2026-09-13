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

namespace SV5T.Application.Criteria.Commands.AddCriterion;

public sealed class AddCriterionHandler(
    IStandardRepository sr,
    IStandardSetRepository ssr,
    ICriterionRepository cr,
    IUnitOfWork uow,
    ICurrentUser cu,
    IValidator<CreateCriterionRequest> v
) : IRequestHandler<AddCriterionCommand, CriterionResponse>
{
    public async Task<CriterionResponse> Handle(AddCriterionCommand req, CancellationToken ct)
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
                "Khong the them tieu chi vao bo da cong bo.",
                "standard_set_not_editable"
            );
        string code = req.Request.Code?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(code))
            code = await GenCode(req.StandardId, standard.Code, req.Request, ct);
        else
        {
            var ex = await cr.ExistsCodeInStandardAsync(req.StandardId, code, cancellationToken: ct);
            if (ex)
                throw new UseCaseException(
                    ApplicationErrorKind.Conflict,
                    $"Ma tieu chi '{code}' da ton tai.",
                    "criterion_code_duplicate"
                );
        }
        if (req.Request.ParentCriterionId.HasValue)
        {
            var p = await cr.GetByIdAsync(req.Request.ParentCriterionId.Value, cancellationToken: ct);
            if (p is null || p.StandardId != req.StandardId || p.Type != CriterionType.Group)
                throw new UseCaseException(
                    ApplicationErrorKind.Validation,
                    "Tieu chi cha khong hop le.",
                    "invalid_parent_criterion"
                );
        }
        var actor = cu.UserId ?? throw new UseCaseException(ApplicationErrorKind.Unauthorized, "Khong xac dinh user.");
        var c = new Criterion
        {
            StandardId = req.StandardId,
            ParentCriterionId = req.Request.ParentCriterionId,
            Type = req.Request.Type,
            Code = code,
            Title = req.Request.Title.Trim(),
            Description = req.Request.Description?.Trim(),
            DisplayOrder = req.Request.DisplayOrder,
            Operator = req.Request.Operator,
            MinimumSatisfied = req.Request.MinimumSatisfied,
            EvaluationType = req.Request.EvaluationType,
            DefinitionJson = req.Request.DefinitionJson,
            ReviewGuidance = req.Request.ReviewGuidance?.Trim(),
            CreatedAt = DateTime.UtcNow,
            CreatedBy = actor.ToString(),
        };
        await cr.AddAsync(c, ct);
        await uow.SaveChangesAsync(ct);
        return AdminStandardMappings.MapToCriterionResponse(c);
    }

    async Task<string> GenCode(Guid sid, string scode, CreateCriterionRequest rq, CancellationToken ct2)
    {
        var all = await cr.GetByStandardIdAsync(sid, ct2);
        var ex = all.Select(x => x.Code.ToUpperInvariant()).ToHashSet();
        var bp = string.IsNullOrWhiteSpace(scode) ? "TC" : scode;
        if (!rq.ParentCriterionId.HasValue)
        {
            if (rq.Type == CriterionType.Group)
            {
                var ca = bp + "_GRP";
                int i = 1;
                while (ex.Contains(ca.ToUpperInvariant()))
                {
                    i++;
                    ca = bp + "_GRP" + i;
                }
                return ca;
            }
            int r = 1;
            while (r < 500)
            {
                var cand = bp + "." + r;
                if (!ex.Contains(cand.ToUpperInvariant()))
                    return cand;
                r++;
            }
            return bp + "." + Guid.NewGuid().ToString("N")[..4];
        }
        var par = all.FirstOrDefault(x => x.Id == rq.ParentCriterionId.Value);
        var pc = par?.Code ?? bp;
        if (rq.Type == CriterionType.Group)
        {
            var ca = pc + "_OPT";
            int i = 1;
            while (ex.Contains(ca.ToUpperInvariant()))
            {
                i++;
                ca = pc + "_OPT" + i;
            }
            return ca;
        }
        int idx = 1;
        while (idx < 500)
        {
            var cand = pc.Contains("_OPT", StringComparison.OrdinalIgnoreCase)
                ? pc.Replace("_OPT", "") + ".TC." + idx
                : pc + "." + idx;
            if (!ex.Contains(cand.ToUpperInvariant()))
                return cand;
            idx++;
        }
        return pc + "." + Guid.NewGuid().ToString("N")[..4];
    }
}
