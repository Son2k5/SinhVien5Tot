using Microsoft.EntityFrameworkCore;
using MySqlConnector;
using SV5T.Application.Common.Exceptions;

namespace SV5T.Infrastructure.Persistence.UnitOfWork;

public static class DbUniqueConstraintMapper
{
    private static readonly (string IndexSubstring, string Message, string ErrorCode)[] KnownConstraints =
    [
        ("IX_user_profiles_StudentCode", "Mã sinh viên đã được sử dụng.", "student_code_taken"),
        ("IX_users_NormalizedEmail", "Email này đã được sử dụng cho một tài khoản khác.", "email_taken"),
        ("IX_user_profiles_UserId", "Hồ sơ cá nhân cho tài khoản này đã tồn tại.", "user_profile_exists"),
        ("IX_user_addresses_UserId_AddressType", "Địa chỉ cho loại này đã tồn tại trong hồ sơ của bạn.", "address_type_duplicate"),
        ("IX_refresh_tokens_Token", "Token đã tồn tại trong hệ thống.", "token_duplicate"),
        ("IX_standard_sets_AcademicYear_Level_AwardType_Version", "Bộ tiêu chuẩn cho năm học, cấp và phiên bản này đã tồn tại.", "standard_set_duplicate"),
        ("IX_evidence_type_templates_Code_Version", "Biểu mẫu minh chứng cho mã và phiên bản này đã tồn tại.", "evidence_template_duplicate"),
        ("IX_applications_ApplicationCode", "Mã hồ sơ đã tồn tại trong hệ thống.", "application_code_duplicate")
    ];

    public static bool TryMapConflict(DbUpdateException exception, out UseCaseException? conflictException)
    {
        if (exception.InnerException is MySqlException { Number: 1062 } mysql)
        {
            foreach (var (indexSubstring, message, errorCode) in KnownConstraints)
            {
                if (mysql.Message.Contains(indexSubstring, StringComparison.OrdinalIgnoreCase))
                {
                    conflictException = new UseCaseException(
                        ApplicationErrorKind.Conflict,
                        message,
                        errorCode);
                    return true;
                }
            }

            // Fallback cho các unique constraint khác trong database
            conflictException = new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Dữ liệu bị trùng lặp trong hệ thống.",
                "unique_constraint_violation");
            return true;
        }

        conflictException = null;
        return false;
    }
}
