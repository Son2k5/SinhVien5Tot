using SV5T.Domain.Notifications;

namespace SV5T.Application.Notifications;

public sealed record NotificationContentData(
    string? CampaignName = null,
    string? ApplicationCode = null,
    string? Decision = null,
    string? ReviewerNote = null);

public sealed record NotificationContent(string Title, string Body);

public static class NotificationContentBuilder
{
    public static NotificationContent Build(NotificationType type, NotificationContentData data)
    {
        var campaignName = Clean(data.CampaignName, 160, "đợt xét");
        var applicationCode = Clean(data.ApplicationCode, 80, "hồ sơ");
        var decision = Clean(data.Decision, 80, "đã được cập nhật");
        var note = Clean(data.ReviewerNote, 100, string.Empty);

        var content = type switch
        {
            NotificationType.CampaignPublished => new NotificationContent(
                "Đợt xét mới đã mở",
                $"Đợt xét “{campaignName}” hiện đã mở. Bạn có thể xem thông tin và thời hạn nộp hồ sơ."),
            NotificationType.ApplicationSubmitted => new NotificationContent(
                "Có hồ sơ cần xét duyệt",
                $"Hồ sơ {applicationCode} vừa được sinh viên gửi và đang chờ xét duyệt."),
            NotificationType.EvidenceReviewed => new NotificationContent(
                "Minh chứng đã được phản hồi",
                AppendNote($"Minh chứng trong hồ sơ {applicationCode} {decision}.", note)),
            NotificationType.ApplicationDecided => new NotificationContent(
                "Kết quả xét duyệt hồ sơ",
                AppendNote($"Hồ sơ {applicationCode} {decision}.", note)),
            NotificationType.ApplicationWithdrawn => new NotificationContent(
                "Hồ sơ đã được rút",
                $"Sinh viên đã rút hồ sơ {applicationCode}."),
            NotificationType.ArticlePublished => new NotificationContent(
                "Bài viết mới",
                "Một bài viết mới vừa được đăng trên hệ thống."),
            _ => throw new ArgumentOutOfRangeException(nameof(type), type, null)
        };

        return new NotificationContent(
            Truncate(content.Title, 200),
            Truncate(content.Body, 500));
    }

    private static string AppendNote(string body, string note) =>
        string.IsNullOrEmpty(note) ? body : $"{body} Ghi chú: {note}";

    private static string Clean(string? value, int maxLength, string fallback)
    {
        var cleaned = string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();
        return Truncate(cleaned, maxLength);
    }

    private static string Truncate(string value, int maxLength) =>
        value.Length <= maxLength ? value : value[..maxLength];
}
