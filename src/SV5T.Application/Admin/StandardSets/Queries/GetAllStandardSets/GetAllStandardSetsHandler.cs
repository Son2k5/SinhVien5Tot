using MediatR;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Admin.StandardSets.Common;
using SV5T.Application.Standards.Abstractions;

namespace SV5T.Application.Admin.StandardSets.Queries.GetAllStandardSets;

public sealed class GetAllStandardSetsHandler(IStandardSetRepository standardSetRepository)
    : IRequestHandler<GetAllStandardSetsQuery, IReadOnlyList<StandardSetResponse>>
{
    public async Task<IReadOnlyList<StandardSetResponse>> Handle(
        GetAllStandardSetsQuery request,
        CancellationToken cancellationToken
    )
    {
        var sets = await standardSetRepository.GetAllAsync(cancellationToken);
        return sets.Select(x => AdminStandardMappings.MapToSetResponse(x, false)).ToList();
    }
}
