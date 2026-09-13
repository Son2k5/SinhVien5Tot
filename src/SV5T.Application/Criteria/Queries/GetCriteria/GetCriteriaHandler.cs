using MediatR;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Admin.StandardSets.Common;
using SV5T.Application.Criteria.Abstractions;

namespace SV5T.Application.Criteria.Queries.GetCriteria;

public sealed class GetCriteriaHandler(ICriterionRepository criterionRepository)
    : IRequestHandler<GetCriteriaQuery, IReadOnlyList<CriterionResponse>>
{
    public async Task<IReadOnlyList<CriterionResponse>> Handle(
        GetCriteriaQuery request,
        CancellationToken cancellationToken
    )
    {
        var criteria = await criterionRepository.GetByStandardIdAsync(request.StandardId, cancellationToken);
        return criteria.Select(AdminStandardMappings.MapToCriterionResponse).ToList();
    }
}
