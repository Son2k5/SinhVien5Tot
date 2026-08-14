using SV5T.Application.Common.Exceptions;
using SV5T.Application.DTOs.Welcome;
using SV5T.Application.Interfaces.Repositories;
using SV5T.Application.Interfaces.Services.Commons;
using SV5T.Application.Interfaces.Services.Welcome;
using SV5T.Domain.Entities;

namespace SV5T.Application.Services;

public sealed class WelcomeDashboardService(
    ICurrentUser currentUser,
    IUserRepository userRepository,
    IPortalContentRepository contentRepository) : IWelcomeDashboardService
{
    private const int ContentQueryLimit = 20;

    public async Task<WelcomeDashboardResponse> GetAsync(
        CancellationToken cancellationToken = default)
    {
        if (!currentUser.UserId.HasValue)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Unauthorized,
                "Phiên đăng nhập không hợp lệ.",
                "invalid_session");
        }

        var user = await userRepository.GetByIdAsync(
            currentUser.UserId.Value,
            cancellationToken);
        if (user is null || !user.IsActive)
        {
            throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy người dùng.",
                "user_not_found");
        }

        var nowUtc = DateTime.UtcNow;
        var contents = await contentRepository.GetPublishedAsync(
            nowUtc,
            ContentQueryLimit,
            cancellationToken);
        var mappedContents = contents.Select(MapContent).ToArray();

        var displayName = string.IsNullOrWhiteSpace(user.DisplayName)
            ? user.Email.Split('@', 2)[0]
            : user.DisplayName.Trim();

        return new WelcomeDashboardResponse(
            new WelcomeUserDto(
                user.Id,
                displayName,
                user.Email,
                user.AvatarUrl,
                user.Profile?.Faculty),
            GetFeatures(),
            mappedContents
                .Where(item => item.Type == PortalContentType.Notification)
                .Take(5)
                .ToArray(),
            mappedContents
                .Where(item => item.Type == PortalContentType.News)
                .Take(6)
                .ToArray(),
            contents.Count == 0
                ? nowUtc
                : contents.Max(item => item.PublishedAtUtc));
    }

    private static PortalContentDto MapContent(PortalContent content) => new(
        content.Id,
        content.Type,
        content.Source,
        content.Title,
        content.Summary,
        content.Route,
        content.Icon,
        content.IsFeatured,
        content.PublishedAtUtc);

    private static IReadOnlyList<SystemFeatureDto> GetFeatures() =>
    [
        new("overview", "Trang chào mừng", "Tổng quan thông tin và cập nhật mới", "/dashboard", "home", "Tổng quan", true),
        new("profile", "Hồ sơ cá nhân", "Cập nhật thông tin và ảnh đại diện", "/dashboard/profile", "user-round", "Cá nhân", true),
        new("feed", "Bảng tin", "Theo dõi hoạt động cộng đồng SV5T", "/dashboard?view=feed", "newspaper", "Tổng quan", false, "Sắp mở"),
        new("achievements", "Thành tích", "Quản lý tiến độ 5 tiêu chí", "/dashboard?view=achievements", "award", "Hồ sơ 5 tốt", false, "Sắp mở"),
        new("evidence", "Minh chứng", "Nộp và theo dõi minh chứng", "/dashboard?view=evidence", "file-check", "Hồ sơ 5 tốt", false, "Sắp mở"),
        new("campaigns", "Chiến dịch", "Tham gia các đợt xét duyệt", "/dashboard?view=campaigns", "flag", "Hoạt động", false, "Sắp mở"),
        new("ranking", "Bảng xếp hạng", "Khám phá sinh viên tiêu biểu", "/dashboard?view=ranking", "chart", "Hoạt động", false, "Sắp mở"),
        new("clubs", "Nhóm & CLB", "Kết nối các cộng đồng sinh viên", "/dashboard?view=clubs", "users", "Cộng đồng", false, "Sắp mở"),
        new("saved", "Đã lưu", "Xem lại nội dung bạn quan tâm", "/dashboard?view=saved", "bookmark", "Cá nhân", false, "Sắp mở")
    ];
}
