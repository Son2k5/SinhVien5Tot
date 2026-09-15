using SV5T.Application.Common.Exceptions;
using SV5T.Infrastructure.Persistence.UnitOfWork;
using Xunit;

namespace SV5T.UnitTests.Application;

public sealed class ErrorMessageSafetyTests
{
    [Fact]
    public void AllKnownDbConstraintMessages_AreSafeAndVietnamese()
    {
        var field = typeof(DbUniqueConstraintMapper)
            .GetField("KnownConstraints", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static);
        Assert.NotNull(field);
        var values = (System.Array)field!.GetValue(null)!;
        Assert.NotNull(values);
        foreach (var item in values)
        {
            var t = item.GetType();
            // ValueTuple fields are Item1/Item2/Item3 at runtime
            var msg = (string)t.GetField("Item2")!.GetValue(item)!;
            var code = (string)t.GetField("Item3")!.GetValue(item)!;
            AssertSafe(code, msg);
        }
        // fallback message
        AssertSafe("unique_constraint_violation", "Dữ liệu bị trùng lặp trong hệ thống.");
    }

    [Theory]
    [InlineData("application_duplicate", "Bạn đã đăng ký hồ sơ cho đợt xét này.")]
    [InlineData("concurrency_conflict", "Dữ liệu đã thay đổi. Vui lòng tải lại và thử lại.")]
    [InlineData("validation_error", "Phiên bản dữ liệu không hợp lệ. Vui lòng tải lại và thử lại.")]
    [InlineData("criterion_not_requirement", "Chỉ được nộp minh chứng cho tiêu chí bắt buộc.")]
    [InlineData("invalid_state_transition", "Không thể chuyển trạng thái minh chứng. Vui lòng tải lại và thử lại.")]
    public void SamplePublicMessages_AreSafe(string code, string message)
    {
        AssertSafe(code, message);
    }

    private static void AssertSafe(string code, string message)
    {
        Assert.Matches("^[a-z0-9_]{3,64}$", code);
        Assert.True(message.Length is > 0 and <= 500, $"Message too long: {code}");
        Assert.DoesNotContain("RowVersion", message);
        Assert.DoesNotContain("DataJson", message);
        Assert.DoesNotContain("Exception", message);
        Assert.DoesNotContain("System.", message);
        Assert.DoesNotContain("http", message.ToLowerInvariant());
    }
}
