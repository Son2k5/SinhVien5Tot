using Microsoft.EntityFrameworkCore;
using MySqlConnector;
using SV5T.Application.Common.Exceptions;
using SV5T.Infrastructure.Persistence.UnitOfWork;
using System.Reflection;
using System.Runtime.CompilerServices;
using Xunit;

namespace SV5T.UnitTests.Infrastructure;

public sealed class DbUniqueConstraintMapperTests
{
    [Theory]
    [InlineData("Duplicate entry 'SV001' for key 'user_profiles.IX_user_profiles_StudentCode'", "student_code_taken", "Mã sinh viên đã được sử dụng.")]
    [InlineData("Duplicate entry 'test@example.com' for key 'users.IX_users_NormalizedEmail'", "email_taken", "Email này đã được sử dụng cho một tài khoản khác.")]
    [InlineData("Duplicate entry 'user-1' for key 'user_profiles.IX_user_profiles_UserId'", "user_profile_exists", "Hồ sơ cá nhân cho tài khoản này đã tồn tại.")]
    [InlineData("Duplicate entry '...' for key 'user_addresses.IX_user_addresses_UserId_AddressType'", "address_type_duplicate", "Địa chỉ cho loại này đã tồn tại trong hồ sơ của bạn.")]
    [InlineData("Duplicate entry 'token-hash' for key 'refresh_tokens.IX_refresh_tokens_Token'", "token_duplicate", "Token đã tồn tại trong hệ thống.")]
    [InlineData("Duplicate entry '...' for key 'standard_sets.IX_standard_sets_AcademicYear_Level_AwardType_Version'", "standard_set_duplicate", "Bộ tiêu chuẩn cho năm học, cấp và phiên bản này đã tồn tại.")]
    [InlineData("Duplicate entry 'Bo tieu chuan A' for key 'standard_sets.IX_standard_sets_Name'", "standard_set_name_duplicate", "Tên bộ tiêu chuẩn đã tồn tại. Vui lòng chọn tên khác.")]
    [InlineData("Duplicate entry 'APP-001' for key 'applications.IX_applications_ApplicationCode'", "application_code_duplicate", "Mã hồ sơ đã tồn tại trong hệ thống.")]
    [InlineData("Duplicate entry 'custom' for key 'some_other_unique_index'", "unique_constraint_violation", "Dữ liệu bị trùng lặp trong hệ thống.")]
    public void TryMapConflict_KnownAndUnknownIndexes_MapsCorrectly(
        string mysqlErrorMessage,
        string expectedErrorCode,
        string expectedMessage)
    {
        // Construct a MySqlException with Number = 1062 via reflection / runtime create
        var mySqlException = CreateMySqlException(1062, mysqlErrorMessage);
        var dbUpdateException = new DbUpdateException("DbUpdate failed", mySqlException);

        var isConflict = DbUniqueConstraintMapper.TryMapConflict(dbUpdateException, out var conflictException);

        Assert.True(isConflict);
        Assert.NotNull(conflictException);
        Assert.Equal(ApplicationErrorKind.Conflict, conflictException.Kind);
        Assert.Equal(expectedErrorCode, conflictException.ErrorCode);
        Assert.Equal(expectedMessage, conflictException.Message);
    }

    [Fact]
    public void TryMapConflict_NonDuplicateMySqlError_ReturnsFalse()
    {
        var mySqlException = CreateMySqlException(1045, "Access denied");
        var dbUpdateException = new DbUpdateException("DbUpdate failed", mySqlException);

        var isConflict = DbUniqueConstraintMapper.TryMapConflict(dbUpdateException, out var conflictException);

        Assert.False(isConflict);
        Assert.Null(conflictException);
    }

    private static MySqlException CreateMySqlException(int number, string message)
    {
        var exception = (MySqlException)RuntimeHelpers.GetUninitializedObject(typeof(MySqlException));

        var numberField = typeof(MySqlException).GetField("_number", BindingFlags.Instance | BindingFlags.NonPublic)
            ?? typeof(MySqlException).GetField("m_number", BindingFlags.Instance | BindingFlags.NonPublic)
            ?? typeof(MySqlException).GetFields(BindingFlags.Instance | BindingFlags.NonPublic).FirstOrDefault(f => f.FieldType == typeof(int));

        numberField?.SetValue(exception, number);

        var messageField = typeof(Exception).GetField("_message", BindingFlags.Instance | BindingFlags.NonPublic);
        messageField?.SetValue(exception, message);

        return exception;
    }
}
