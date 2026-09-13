using MediatR;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Admin.StandardSets.Common;
using SV5T.Application.Standards.Abstractions;

namespace SV5T.Application.Admin.StandardSets.Queries.GetStandardSetById;

public sealed class GetStandardSetByIdHandler(IStandardSetRepository standardSetRepository)
    : IRequestHandler<GetStandardSetByIdQuery, StandardSetResponse?>
{
    public async Task<StandardSetResponse?> Handle(GetStandardSetByIdQuery request, CancellationToken cancellationToken)
    {
        var s = await standardSetRepository.GetByIdAsync(request.Id, true, true, cancellationToken: cancellationToken);
        return s is null ? null : AdminStandardMappings.MapToSetResponse(s, true);
    }
}
