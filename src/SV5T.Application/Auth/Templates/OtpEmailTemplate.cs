using System.Net;
using SV5T.Application.Common.Abstractions;

namespace SV5T.Application.Auth.Templates;

public static class OtpEmailTemplate
{
    public const string RegisterTemplateKey = "otp-register";
    public const string ResetPasswordTemplateKey = "otp-reset-password";

    public static string Subject(OtpPurpose purpose) =>
        purpose == OtpPurpose.Register
            ? "Mã xác thực đăng ký SV5T"
            : "Mã xác thực đổi mật khẩu SV5T";

    public static string TemplateKey(OtpPurpose purpose) =>
        purpose == OtpPurpose.Register
            ? RegisterTemplateKey
            : ResetPasswordTemplateKey;

    public static string Render(
        string otp,
        int expiryMinutes,
        OtpPurpose purpose)
    {
        var action = purpose == OtpPurpose.Register
            ? "hoàn tất đăng ký"
            : "đổi mật khẩu";

        return $"""
            <!doctype html>
            <html lang="vi">
            <body style="margin:0;background:#f5f7fb">
              <div style="font-family:Arial,sans-serif;max-width:520px;margin:24px auto;padding:28px;background:#fff;border-radius:12px">
                <h2 style="margin-top:0;color:#172554">Xác thực SV5T</h2>
                <p>Dùng mã sau để {action}:</p>
                <div style="font-size:32px;font-weight:700;letter-spacing:8px;color:#1d4ed8">
                  {WebUtility.HtmlEncode(otp)}
                </div>
                <p>Mã có hiệu lực trong {expiryMinutes} phút.</p>
                <p style="color:#64748b">Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.</p>
              </div>
            </body>
            </html>
            """;
    }
}
