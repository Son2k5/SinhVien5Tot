using SV5T.Domain.Welcome;

namespace SV5T.Application.Welcome.Dtos;

public sealed record WelcomeDashboardResponse(
    WelcomeUserDto User,
    IReadOnlyList<SystemFeatureDto> Features,
    IReadOnlyList<PortalContentDto> Notifications,
    IReadOnlyList<PortalContentDto> News,
    DateTime UpdatedAtUtc);

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
