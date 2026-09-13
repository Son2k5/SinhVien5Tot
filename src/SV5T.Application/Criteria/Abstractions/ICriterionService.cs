using SV5T.Application.Admin.Dtos;

namespace SV5T.Application.Criteria.Abstractions;

public interface ICriterionService
{
    Task<IReadOnlyList<CriterionResponse>> GetCriteriaAsync(
        Guid standardId,
        CancellationToken cancellationToken = default);

    Task<CriterionResponse> AddCriterionAsync(
        Guid standardId,
        CreateCriterionRequest request,
        CancellationToken cancellationToken = default);

    Task<CriterionResponse> UpdateCriterionAsync(
        Guid standardId,
        Guid criterionId,
        UpdateCriterionRequest request,
        CancellationToken cancellationToken = default);

    Task DeleteCriterionAsync(
        Guid standardId,
        Guid criterionId,
        CancellationToken cancellationToken = default);
}
