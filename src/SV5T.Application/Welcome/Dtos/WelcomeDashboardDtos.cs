using SV5T.Domain.Welcome;

namespace SV5T.Application.Welcome.Dtos;

public sealed record WelcomeDashboardResponse(
    WelcomeUserDto User,
    IReadOnlyList<SystemFeatureDto> Features,
    IReadOnlyList<PortalContentDto> Notifications,
    IReadOnlyList<PortalContentDto> News,
    DateTime UpdatedAtUtc,
    IReadOnlyList<CriterionProgressDto>? CriteriaProgress = null,
    IReadOnlyList<StandardJourneyDto>? Standards = null);

public sealed record CriterionProgressDto(
    string Key,
    int Progress,
    string Status,
    int CompletedRequirements,
    int TotalRequirements,
    DateTime? UpdatedAtUtc = null);

public sealed record StandardJourneyDto(
    string Key,
    string Code,
    string Title,
    string Description,
    int DisplayOrder,
    int Progress,
    int CompletedRequirements,
    int TotalRequirements,
    IReadOnlyList<CriterionJourneyItemDto> Criteria);

public sealed record CriterionJourneyItemDto(
    Guid Id,
    string Code,
    string Title,
    string? Description,
    bool IsRequired,
    int DisplayOrder,
    bool IsCompleted,
    string? EvidenceStatus);

public sealed record WelcomeUserDto(
    Guid Id,
    string DisplayName,
    string Email,
    string? AvatarUrl,
    string? Faculty);

public sealed record SystemFeatureDto(
    string Key,
    string Title,
    string Description,
    string Route,
    string Icon,
    string Group,
    bool IsAvailable,
    string? Badge = null);

public sealed record PortalContentDto(
    Guid Id,
    PortalContentType Type,
    PortalContentSource Source,
    string Title,
    string Summary,
    string Route,
    string Icon,
    bool IsFeatured,
    DateTime PublishedAtUtc);
