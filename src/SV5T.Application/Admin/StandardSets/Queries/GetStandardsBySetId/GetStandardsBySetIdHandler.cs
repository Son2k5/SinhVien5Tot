using MediatR;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Admin.StandardSets.Common;
using SV5T.Application.Standards.Abstractions;

namespace SV5T.Application.Admin.StandardSets.Queries.GetStandardsBySetId;

public sealed class GetStandardsBySetIdHandler(IStandardRepository standardRepository)
    : IRequestHandler<GetStandardsBySetIdQuery, IReadOnlyList<StandardResponse>>
{
    public async Task<IReadOnlyList<StandardResponse>> Handle(
        GetStandardsBySetIdQuery request,
        CancellationToken cancellationToken
    )
    {
        var standards = await standardRepository.GetByStandardSetIdAsync(
            request.StandardSetId,
            true,
            cancellationToken
        );
        return standards.Select(AdminStandardMappings.MapToStandardResponse).ToList();
    }
}
