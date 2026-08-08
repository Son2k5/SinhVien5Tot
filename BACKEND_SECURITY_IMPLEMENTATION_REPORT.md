# Báo cáo triển khai hardening Backend SV5T

Ngày hoàn tất mã nguồn: 2026-08-06

Phạm vi: `api/`, migration, test backend, Docker Compose và tài liệu vận hành. Báo
cáo này không chứa lại bất kỳ secret nào từ báo cáo audit nguồn.

## 1. Kết quả

Hai bản đánh giá thống nhất ở các rủi ro chính và các hạng mục High/Medium có thể
xử lý trong mã nguồn đã được triển khai. Backend hiện build không warning, 17/17
unit test pass, dependency rule pass và NuGet không có package bị advisory hiện hành.

Các việc không thể hoàn tất chỉ bằng sửa source được tách rõ ở mục 4; quan trọng
nhất là rotate credential đã lộ và apply migration lên database thật.

## 2. Finding đã xử lý

| ID | Mức độ | Vấn đề | Cách xử lý và vị trí chính |
|---|---|---|---|
| SEC-01 | Critical | Secret thật tồn tại trong `.env` và bị chép vào báo cáo audit | Đã xóa `.env` và `api/.env`, bỏ loader `.env`, xóa connection string khỏi development config, chuyển local API sang User Secrets; compose dùng `${VAR:?required}` và chỉ bind DB/Redis vào loopback. Credential bên ngoài vẫn phải rotate theo mục 4. |
| SEC-02 | High | `GET /api/users/{id}` public, gây BOLA/IDOR | Thay bằng `[Authorize] GET /api/users/me`; ID chỉ lấy từ `ICurrentUser`. Không còn route self-service nhận user ID từ client. |
| SEC-03 | High | Re-register user chưa verify ghi đè `PasswordHash` | Password hash tạm chỉ nằm trong Redis challenge có TTL và chỉ cập nhật/tạo User sau khi OTP được consume thành công. |
| SEC-04 | High | OTP read/increment/consume không atomic | Challenge lưu Redis; tăng số lần sai, thay OTP và consume một lần dùng Lua script nguyên tử, có expiry và max attempts. |
| SEC-05 | High | Login limiter ghép email/IP và thiếu limiter HTTP | Tách Redis counter account và IP; thêm fixed-window limiter cho từng auth route, request body 64 KB và trusted forwarded headers. |
| SEC-06 | High | OTP nằm plaintext trong email log; queue không bounded/lease | Bỏ bảng email log; payload Redis Stream mã hóa bằng Data Protection, consumer group phân phối message, `XAUTOCLAIM` khôi phục pending, retry và dead-letter có retention. |
| SEC-07 | High | Spam đăng ký có thể chiếm hết quota password reset | Queue password-reset riêng có priority cao; quota dự phòng và rolling reservation được thực thi atomic trong Redis cho toàn bộ instance. |
| SEC-08 | Medium | Refresh token cũ sống sau reset password | Reset password thu hồi toàn bộ refresh token trong database. Theo yêu cầu mới, `SecurityVersion` đã bị loại bỏ nên access token đã phát hành còn hiệu lực tối đa theo TTL 15 phút. |
| SEC-09 | Medium | Refresh rotation có race với reset password | Refresh token lưu dạng hash trong MySQL; thao tác thu hồi có điều kiện và tạo token kế tiếp nằm trong transaction, đồng thời phát hiện reuse. |
| PRIVACY-01 | Medium | Log email plaintext/deterministic SHA dễ dò | Log chỉ dùng identifier HMAC có key riêng; email worker log theo `EmailQueueId`, không log recipient/OTP/token. |
| API-01 | Medium | Validation thiếu null/max length, lỗi không thống nhất | Toàn bộ auth request có validator; email 255, password 128, OTP 6 số, GUID non-empty; lỗi dùng RFC 7807 với `code` và `traceId`. |
| API-02 | Medium | Swagger thiếu Bearer và response schema | Thêm Bearer security scheme và khai báo success/error response cho từng controller action. |
| CONFIG-01 | Medium | Options không fail-fast đầy đủ | JWT, OTP, identifier HMAC, Redis, SMTP/email và school domain đều `ValidateOnStart`; kiểm tra độ dài key và range. |
| OBS-01 | Medium | Thiếu correlation ID và structured logging | `X-Correlation-ID` được validate/propagate, gắn logging scope; console log là JSON. |
| ARCH-01 | Medium | Clean Architecture chỉ là folder trong một project | Tách thành `Domain`, `Application`, `Infrastructure`, `Api`; project reference cưỡng chế một chiều và script architecture pass. |
| ARCH-02 | Low | Application exception chứa HTTP status | Application chỉ phát `ApplicationErrorKind`; middleware Presentation ánh xạ sang HTTP/ProblemDetails. |
| PERF-01 | Medium | Nguy cơ unbounded queue/full-table restore | Redis Streams tách priority/standard, consumer mỗi lần đọc một message, message hoàn tất được `XDEL`; dead-letter có giới hạn chiều dài và retention. |

## 3. Endpoint sau hardening

| Method và route | Truy cập | Kiểm soát chính |
|---|---|---|
| `POST /api/auth/register` | Anonymous | IP limit, email issue limit, Redis challenge TTL, encrypted Redis Stream |
| `POST /api/auth/verify-otp` | Anonymous | IP limit, challenge ID, atomic max-attempt/consume |
| `POST /api/auth/resend-otp` | Anonymous | IP/email cooldown, challenge ID, OTP cũ bị thay atomic |
| `POST /api/auth/login` | Anonymous | IP HTTP limit và Redis limit độc lập theo IP/account |
| `POST /api/auth/refresh-token` | Anonymous + HttpOnly cookie | Database rotation, hash verification và reuse detection |
| `POST /api/auth/forgot-password` | Anonymous | Uniform response, IP/email limit, reset challenge |
| `POST /api/auth/reset-password` | Anonymous | One-time reset challenge, đổi mật khẩu và revoke mọi refresh session |
| `POST /api/auth/logout` | Bearer | Revoke refresh cookie/session và blacklist access-token JTI |
| `GET /api/users/me` | Bearer | User ID lấy từ claim đã validate, không nhận object ID từ client |
| `GET /health/live` | Public | Chỉ phản ánh process, không lộ dependency detail |
| `GET /health/ready` | Host allow-list | DB/Redis readiness; mặc định chỉ localhost |

Không phát hiện Minimal API nghiệp vụ nào khác.

## 4. Việc bắt buộc trước khi deploy

### 4.1 Incident response cho secret đã lộ

Không tái sử dụng giá trị cũ. Rotate riêng database password, Redis password, JWT
signing key, OTP pepper và SMTP credential; tạo mới `IdentifierHash:Key`. Sau đó:

1. Nạp giá trị mới bằng secret manager của môi trường; local dùng User Secrets theo README.
2. Force logout bằng cách thu hồi toàn bộ bản ghi đang hoạt động trong bảng `refresh_tokens` và đổi JWT signing key nếu cần vô hiệu hóa access token ngay lập tức.
3. Hủy challenge/OTP pending sau khi đổi pepper.
4. Redact hoặc xóa bản `C:\Users\machh\Downloads\security_audit_report.md` vì file nguồn còn chứa plaintext secret.
5. Trên repository Git gốc, chạy secret scanner cho cả history; snapshot hiện tại không có Git history dùng được để chứng minh secret chưa từng commit.

### 4.2 Apply database migration

Sau khi cấu hình connection string mới:

```powershell
dotnet ef database update --project api/Infrastructure/SV5T.Infrastructure.csproj --startup-project api/SV5T.Api.csproj
```

Migration cần apply: `20260806024809_SecurityHardening`. Hãy backup database và
chạy staging trước production.

### 4.3 Production configuration

- Lưu Data Protection key ring trên shared protected storage khi chạy nhiều instance;
  giới hạn filesystem ACL và dùng cơ chế encrypt-at-rest của platform.
- Khai báo đúng `ReverseProxy:KnownProxies`; thêm global rate limit/CAPTCHA tại WAF cho auth.
- Chỉ expose `/health/ready` trong internal/load-balancer network.
- Frontend hiện vẫn dùng contract OTP cũ. Cần đổi sang `registrationId` và `resetId`
  trước khi phát hành đồng bộ; backend cố ý không giữ compatibility không an toàn.

## 5. Kiểm chứng đã chạy

```text
dotnet build SV5T.sln --no-restore
  Build succeeded, 0 warning, 0 error

dotnet test tests/SV5T.UnitTests/SV5T.UnitTests.csproj --no-build --no-restore
  17 passed, 0 failed

api/scripts/check-architecture.ps1
  Clean Architecture dependency check passed

dotnet list ... package --vulnerable --include-transitive
  Không có package bị advisory ở cả 5 project
```

EF Core đã discover đủ năm migration, gồm `SecurityHardening`; chưa kết nối/apply
database thật vì credential cũ đã được loại khỏi workspace.

## 6. Phần kiểm thử nên hoàn thiện ở pipeline staging

Unit regression quan trọng đã có, nhưng production gate vẫn nên bổ sung integration
test bằng MySQL/Redis Testcontainers cho full register/login/refresh/reset flow, 20
request OTP đồng thời, hai email worker trong cùng consumer group, 401/403/429 ProblemDetails
và token cũ bị reject sau reset. Đây là công việc test/infrastructure còn lại, không
phải finding source-code đang để mở.
