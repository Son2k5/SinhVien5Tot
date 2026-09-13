using MediatR;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Criteria.Abstractions;
using SV5T.Application.Standards.Abstractions;
using SV5T.Domain.Standards.Enums;

namespace SV5T.Application.Criteria.Commands.DeleteCriterion;

public sealed class DeleteCriterionHandler(
    IStandardRepository sr,
    IStandardSetRepository ssr,
    ICriterionRepository cr,
    IUnitOfWork uow
) : IRequestHandler<DeleteCriterionCommand, MediatR.Unit>
{
    public async Task<MediatR.Unit> Handle(DeleteCriterionCommand req, CancellationToken ct)
    {
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
                "Khong the xoa khi bo da cong bo.",
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
        var all = await cr.GetByStandardIdAsync(req.StandardId, ct);
        var toDelete = new HashSet<Guid> { req.CriterionId };
        void Collect(Guid pid)
        {
            foreach (var ch in all.Where(x => x.ParentCriterionId == pid))
            {
                if (toDelete.Add(ch.Id))
                    Collect(ch.Id);
            }
        }
        Collect(req.CriterionId);
        var list = all.Where(x => toDelete.Contains(x.Id)).ToList();
        await cr.RemoveRangeAsync(list, ct);
        await uow.SaveChangesAsync(ct);
        return MediatR.Unit.Value;
    }
}
