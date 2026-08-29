using SV5T.Application.Common.Models;
using SV5T.Domain.Awards.Enums;
using SV5T.Domain.Campaigns;
using SV5T.Domain.Campaigns.Enums;

namespace SV5T.Application.Campaigns.Abstractions;

public interface ICampaignRepository
{
    Task<Campaign?> GetByIdAsync(
        Guid id,
        bool includeDetails = false,
        bool tracking = false,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Campaign>> GetAllAsync(
        AwardLevel? level = null,
        CampaignStatus? status = null,
        string? schoolYear = null,
        CancellationToken cancellationToken = default);

    Task<PagedResult<Campaign>> GetPagedAsync(
        AwardLevel? level,
        CampaignStatus? status,
        string? schoolYear,
        int pageIndex,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<bool> ExistsByNameAndSchoolYearAsync(
        string name,
        string schoolYear,
        Guid? excludeId = null,
        CancellationToken cancellationToken = default);

    Task AddAsync(Campaign campaign, CancellationToken cancellationToken = default);
    Task UpdateAsync(Campaign campaign, CancellationToken cancellationToken = default);
    Task RemoveAsync(Campaign campaign, CancellationToken cancellationToken = default);
}
