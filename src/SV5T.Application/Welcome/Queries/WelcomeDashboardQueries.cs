using MediatR;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Users.Abstractions;
using SV5T.Application.Users.Dtos;
using SV5T.Application.Welcome.Dtos;
using SV5T.Domain.Users;
using SV5T.Domain.Welcome;

namespace SV5T.Application.Welcome.Queries;

public sealed record GetWelcomeDashboardQuery : IRequest<WelcomeDashboardResponse>;

public sealed class GetWelcomeDashboardHandler(
    ICurrentUser currentUser,
    IUserRepository userRepository,
    IPortalContentRepository contentRepository)
    : IRequestHandler<GetWelcomeDashboardQuery, WelcomeDashboardResponse>
{
    private const int ContentQueryLimit = 20;

    public async Task<WelcomeDashboardResponse> Handle(
        GetWelcomeDashboardQuery query,
        CancellationToken cancellationToken)
    {
        if (!currentUser.UserId.HasValue)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Unauthorized,
                "Phiên đăng nhập không hợp lệ.",
                "invalid_session");
        }

        var user = await userRepository.GetSummaryByIdAsync(
            currentUser.UserId.Value,
            cancellationToken);
        if (user is null || !user.IsActive || !user.IsVerified)
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

        var profileFullName = user.ProfileFullName?.Trim();
        var displayName = !string.IsNullOrWhiteSpace(profileFullName)
            ? profileFullName
            : string.IsNullOrWhiteSpace(user.DisplayName)
                ? user.Email.Split('@', 2)[0]
                : user.DisplayName.Trim();

        return new WelcomeDashboardResponse(
            new WelcomeUserDto(
                user.Id,
                displayName,
                user.Email,
                user.AvatarUrl,
                user.ProfileFaculty),
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
        new("evidence", "Hồ sơ đã nộp", "Quản lý hồ sơ đã nộp & xem feedback của Mentor", "/dashboard/applications", "file-check", "Hồ sơ 5 tốt", true),
        new("campaigns", "Chiến dịch", "Chọn cấp xét & nộp hồ sơ danh hiệu", "/dashboard/campaigns", "flag", "Hoạt động", true),
        new("ranking", "Bảng xếp hạng", "Khám phá sinh viên tiêu biểu", "/dashboard?view=ranking", "chart", "Hoạt động", false, "Sắp mở"),
        new("clubs", "Nhóm & CLB", "Kết nối các cộng đồng sinh viên", "/dashboard?view=clubs", "users", "Cộng đồng", false, "Sắp mở"),
        new("saved", "Đã lưu", "Xem lại nội dung bạn quan tâm", "/dashboard?view=saved", "bookmark", "Cá nhân", false, "Sắp mở")
    ];
}
