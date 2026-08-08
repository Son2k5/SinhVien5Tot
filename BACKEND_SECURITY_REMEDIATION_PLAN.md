# Kế hoạch hợp nhất và xử lý bảo mật Backend SV5T

Ngày đối chiếu: 2026-08-06

Phạm vi: `api/`, `tests/`, cấu hình local/compose và báo cáo `security_audit_report.md`.

> Tài liệu này cố ý không sao chép bất kỳ secret nào. Báo cáo nguồn đã chứa plaintext secret và phải được xem là dữ liệu nhạy cảm.

## 1. Kết luận đối chiếu

Hai lần rà soát thống nhất ở các rủi ro chính sau:

- `GET /api/users/{id}` thiếu authentication và object-level authorization.
- OTP verification có race condition vì đọc, kiểm tra, tăng counter và consume không atomic.
- Thiếu rate limiting ở tầng HTTP cho các endpoint auth tốn tài nguyên.
- Body email chứa OTP được lưu plaintext trong `email_logs`.
- Access token hiện hữu không bị vô hiệu ngay sau reset password.
- Email address bị ghi plaintext vào log.
- Development configuration chứa database credential.
- Test cho auth, authorization, Redis và integration flow còn thiếu nghiêm trọng.
- Chưa có correlation ID xuyên suốt request và background processing.

Lần rà soát trực tiếp code bổ sung các vấn đề quan trọng mà báo cáo nguồn chưa nêu:

- Re-register tài khoản chưa verify ghi đè `PasswordHash`, tạo pre-account-takeover flow.
- Login limiter dùng bucket ghép `email|IP`, có thể bypass bằng cách đổi một trong hai chiều.
- Register có thể làm đầy bảng user/email, unbounded channel và quota email dùng chung.
- Workflow DB–Redis–email có thể commit một phần.
- Email worker không claim/lease message, có thể gửi trùng khi chạy nhiều instance.
- Validator thiếu null check và maximum length.
- Clean Architecture chỉ được kiểm soát bằng thư mục/regex trong một project.

## 2. Những điểm trong báo cáo nguồn cần điều chỉnh

| Finding nguồn | Kết luận hợp nhất | Điều chỉnh |
|---|---|---|
| User endpoint là Critical | Hợp lệ, xếp High | Dữ liệu lộ là PII/role/status nhưng không có mutation hoặc credential; GUID cũng không tuần tự. |
| Secret trong `api/.env` là Critical | Hợp lệ, xử lý như incident | File tồn tại và báo cáo nguồn đã sao chép plaintext secret. Chưa chứng minh được đã commit vì snapshot không có Git history dùng được. |
| OTP race là High | Hợp lệ | Race concurrent là thật. Nhận định “Redis restart làm counter về 0 nhưng OTP vẫn còn” không chắc đúng; nếu mất Redis state thì OTP cũng thường mất. |
| Refresh token thiếu IP/UA binding là High | Không phải lỗ hổng bắt buộc | Hard-bind IP gây lỗi với mobile/NAT/VPN. Nên lưu device/session metadata làm risk signal, không mặc định hard-fail. Rotation và reuse detection hiện tại là kiểm soát chính. |
| Health endpoints public là High | Conditional/Low | Response mặc định chỉ cho biết Healthy/Unhealthy, không trả tên DB/Redis hoặc exception. Nên giới hạn `/ready` bằng network policy nếu internet-facing. |
| OTP plaintext trong EmailLog là High | Hợp lệ, xếp High/Medium tùy môi trường | Có credential material trong DB trong cửa sổ hiệu lực/retry; phải mã hóa hoặc loại bỏ. |
| CORS AllowAnyHeader/AllowAnyMethod là Medium | Không phải vulnerability hiện tại | Origin vẫn whitelist cụ thể. CORS không cấp quyền cho method/route không tồn tại. Có thể thu hẹp để hardening. |
| Thiếu ASP.NET rate limiter là Medium | Hợp lệ, nâng High | Register có Redis check trước BCrypt, nhưng attacker dùng nhiều email khác nhau vẫn bypass; login dùng bucket ghép dễ bypass. |
| `UserDto` over-exposure | Hợp lệ theo context | Cần DTO riêng cho self/admin/public. Với `/me`, role/status có thể là dữ liệu hợp lệ. |
| Controller dùng `JwtRegisteredClaimNames` vi phạm layer | Không phải dependency Infrastructure | Đây là coupling với auth scheme; `ICurrentUser` vẫn là refactor tốt. |
| `Queue<DateTime>` không thread-safe | False positive hiện tại | `InitializeDailyQuotaAsync` được await trước loop; queue chỉ được worker truy cập tuần tự. |
| Singleton `AuthRedisStore` + `IOptions<T>` | Không có lỗi | Lifetime hiện tại phù hợp; chỉ cần thay đổi nếu muốn hot reload bằng `IOptionsMonitor`. |
| Reset password không revoke access token | Hợp lệ, xếp Medium | Cửa sổ 15 phút vẫn quan trọng trong incident account takeover. |
| Chỉ có một test file | Không còn chính xác | Hiện có hai test file, 10 test pass; tuy nhiên auth core và integration vẫn chưa được test. |

## 3. Backlog hợp nhất theo mức độ ưu tiên

### P0 — Incident response: secrets

1. Rotate toàn bộ JWT signing key, OTP pepper, Redis password, SMTP credential và database password đang có trong `api/.env`/báo cáo.
2. Force logout toàn bộ session sau khi rotate JWT; đổi Redis key prefix hoặc thu hồi toàn bộ refresh session theo quy trình có kiểm soát.
3. Hủy toàn bộ OTP đang pending vì OTP pepper thay đổi.
4. Xóa an toàn các bản sao báo cáo có plaintext secret sau khi lưu một bản đã redaction.
5. Kiểm tra Git history ở repository gốc bằng `git log --all --full-history -- api/.env` và secret scanner. Nếu từng commit, rewrite history và tiếp tục coi secret là compromised dù đã xóa file.
6. Production dùng secret manager; development dùng .NET User Secrets hoặc `appsettings.Local.json` bị ignore.
7. Thêm `gitleaks`/`detect-secrets` vào pre-commit và CI.

Tiêu chí hoàn thành:

- Không còn secret cũ hoạt động.
- `gitleaks` không phát hiện secret trong source/history/artifact.
- `api/.env` và báo cáo plaintext không xuất hiện trong Docker image, CI artifact hoặc nơi chia sẻ.

### P1 — Authorization và account lifecycle

#### 3.1 Thay `GET /api/users/{id}` bằng use case rõ quyền

- Tạo `GET /api/users/me`, luôn lấy user id từ `ICurrentUser`.
- Nếu cần admin lookup, tạo `GET /api/admin/users/{id}` với policy `users:read:any` hoặc role Admin.
- Không dùng route nhận ID cho self-service.
- Tách `SelfUserDto`, `AdminUserDto` và chỉ tạo `PublicUserDto` nếu thật sự có public profile.

File dự kiến thay đổi:

- `Presentation/Controllers/UsersController.cs`
- `Application/Interfaces/Services/Users/IUserService.cs`
- `Application/Services/UserService.cs`
- `Application/DTOs/Users/*`
- Thêm `Application/Interfaces/Security/ICurrentUser.cs`
- Thêm implementation `Presentation/Security/HttpCurrentUser.cs`

Tiêu chí nghiệm thu:

- Anonymous gọi user endpoint nhận 401.
- User A không thể đọc private DTO của user B.
- Admin policy được test riêng; không chỉ dựa vào ID do client gửi.

#### 3.2 Thiết kế lại registration challenge

Không tạo hoặc thay đổi `User.PasswordHash` trước khi xác minh email. Tạo bảng/use case mới:

```text
PendingRegistration
  Id/ChallengeId (128-bit random)
  NormalizedEmail
  PasswordHash
  OtpHash
  FailedAttempts
  ExpiresAtUtc
  ConsumedAtUtc
  CreatedAtUtc
```

Flow mới:

1. `POST /register` validate và rate-limit.
2. Tạo challenge độc lập; hash password nhưng chưa ghi vào `users`.
3. Ghi `PendingRegistration` và encrypted email outbox trong cùng DB transaction.
4. Trả `registrationId`, không trả trạng thái email đã tồn tại.
5. `POST /verify-otp` nhận `registrationId + otp`, không nhận email làm định danh chính.
6. Lock/conditional-update challenge, kiểm tra expiry/attempts và consume đúng một lần.
7. Tạo `User` trong cùng transaction; xử lý unique email thành kết quả idempotent/thống nhất.

Frontend phải đổi contract tương ứng. Không giữ compatibility với flow ghi đè password cũ.

#### 3.3 Security version cho access token

- Thêm `User.SecurityVersion` hoặc `TokensValidAfterUtc`.
- JWT chứa claim `ver` hoặc `iat` phù hợp.
- `OnTokenValidated` so version với Redis cache/nguồn chuẩn.
- Increment version khi reset/change password, disable account hoặc đổi role.
- Refresh session cũng lưu version và bị từ chối nếu version cũ.

Tiêu chí nghiệm thu: access token phát hành trước reset password bị từ chối ngay ở request tiếp theo.

### P2 — OTP và rate limiting

#### 3.4 Atomic OTP verification

Nếu challenge lưu trong DB:

- Dùng transaction + row lock hoặc conditional update `WHERE ConsumedAt IS NULL AND FailedAttempts < MaxAttempts AND ExpiresAt > now`.
- Wrong OTP tăng counter atomically.
- Correct OTP consume atomically; chỉ một request concurrent thành công.

Nếu tiếp tục dùng Redis, thay `GetOtpAsync` + `IncrementOtpFailureAsync` + `RemoveOtpAsync` bằng một Lua script duy nhất trả một trong các trạng thái:

```text
NotFoundOrExpired | TooManyAttempts | Invalid | Consumed
```

Không trả số lần còn lại quá chi tiết nếu không cần thiết.

#### 3.5 Rate limiter nhiều lớp

Áp dụng limiter trước Controller/Application:

| Endpoint | Per IP | Per account/challenge | Ghi chú |
|---|---:|---:|---|
| register | 5/10 phút | 3/email/giờ | CAPTCHA/risk challenge sau ngưỡng |
| login | 10/phút | progressive delay/lock theo account | Không chỉ dùng bucket `email|IP` |
| verify OTP | 10/phút | tối đa 5/challenge tổng cộng | Counter business phải atomic |
| resend/forgot | 5/10 phút | 5/email/giờ | Response thống nhất chống enumeration |
| reset password | 10/phút | 1/reset grant | Grant dùng một lần |
| refresh | 30/phút | per session/token family | Phát hiện replay vẫn giữ nguyên |

Ngoài limiter ứng dụng cần rate limit tại reverse proxy/WAF và giới hạn global để bảo vệ CPU/Redis/DB.

Cấu hình `ForwardedHeaders` với `KnownProxies`/`KnownNetworks`; không tin tùy ý header do client gửi.

### P3 — Durable email/outbox và bảo vệ OTP at rest

Thay `EmailLog` hiện tại bằng outbox có lifecycle rõ ràng:

```text
EmailOutbox
  Id
  MessageType
  RecipientCiphertext hoặc recipient có retention ngắn
  PayloadCiphertext
  Priority
  Status: Pending/Processing/Sent/Failed
  Attempts
  NextAttemptAtUtc
  LeaseOwner
  LeaseExpiresAtUtc
  CreatedAtUtc/SentAtUtc
```

- Không lưu rendered HTML chứa OTP plaintext.
- Chỉ lưu template key và payload đã mã hóa AEAD; key nằm ngoài DB và có rotation.
- Worker claim batch atomically trước khi gửi; nhiều instance không nhận cùng message.
- Password reset có priority cao và quota dự phòng riêng, không bị registration làm cạn quota.
- Xóa ciphertext ngay sau sent; cleanup metadata theo retention policy.
- Poll theo page/batch, không `ToListAsync()` toàn bộ pending.
- Channel nếu còn dùng phải bounded và chỉ đóng vai trò wake-up optimization; DB outbox là source of truth.

Tiêu chí nghiệm thu:

- Query DB không tìm thấy OTP plaintext.
- Chạy hai worker đồng thời vẫn chỉ gửi một email/outbox id.
- 100.000 pending rows không bị load toàn bộ vào RAM.
- Registration spam không chặn password-reset email.

### P4 — Validation, API contract và error handling

1. Bổ sung `NotEmpty/NotNull` và maximum length cho mọi request.
2. Đồng bộ email length với DB; password 8–128; OTP đúng 6 digit; giới hạn request body.
3. Chuẩn hóa lỗi bằng RFC 7807 `ProblemDetails`:
   - validation: 400 + dictionary errors;
   - unauthenticated: 401;
   - authenticated nhưng thiếu quyền: 403;
   - conflict/rate limit: 409/429;
   - mọi response có `traceId` và stable `errorCode`.
4. Không để Application exception chứa HTTP status integer; map business result/exception tại Presentation.
5. Swagger thêm Bearer scheme, response schemas và 400/401/403/404/409/429.
6. Register/forgot trả response thống nhất để chống account enumeration.

### P5 — Configuration, privacy và observability

- Không log full email; dùng masked email hoặc keyed hash.
- Thêm correlation middleware và logging scope; propagate correlation id vào outbox.
- Thêm OpenTelemetry trace/metrics cho auth failures, rate-limit, OTP issue/verify, refresh replay và queue lag.
- `/health/live` chỉ phản ánh process; `/health/ready` chỉ mở trong internal network/load balancer. Không trả exception/detail public.
- Bind MySQL local vào `127.0.0.1` hoặc không publish port; bỏ fallback password trong compose, dùng `${VAR:?required}`.
- CORS hiện không phải vulnerability vì origin được whitelist. Có thể chuyển sang explicit methods/headers để giảm drift cấu hình.
- Device/IP/User-Agent của refresh session chỉ dùng làm audit/risk signal trước; không hard-bind IP mặc định.

### P6 — Enforce Clean Architecture bằng project boundary

Tách solution thành:

```text
SV5T.Domain             -> không reference project khác
SV5T.Application        -> Domain
SV5T.Infrastructure     -> Application + Domain
SV5T.Api                -> Application + Infrastructure (composition root)
SV5T.UnitTests
SV5T.IntegrationTests
```

- Presentation chỉ gọi Application use case/interface.
- EF Core, Redis, MailKit chỉ nằm Infrastructure.
- `ICurrentUser`, clock, password/token/email abstractions nằm Application.
- HTTP mapping, authentication handler và ProblemDetails nằm API.
- Thêm architecture tests bằng NetArchTest/ArchUnitNET; script regex chỉ giữ làm check phụ.

### P7 — Test strategy bắt buộc trước production

Unit tests:

- Register challenge độc lập, request thứ hai không thay password/challenge thứ nhất.
- OTP wrong/correct/expired/consumed; 20 verify concurrent chỉ một request thành công.
- Login limiter theo IP và account độc lập.
- Refresh rotation, concurrent refresh và reuse detection.
- Reset password tăng security version và revoke refresh family.
- Mapping DTO self/admin/public.

Integration tests với `WebApplicationFactory`, MySQL và Redis Testcontainers:

- Anonymous/user khác/admin cho mọi user route.
- Full register → verify → login → refresh → logout.
- Forgot → reset → token cũ bị reject.
- Rate limit trả 429 và `Retry-After`.
- Error response thống nhất.
- Hai email worker không gửi trùng.
- Outbox payload được mã hóa và cleanup.

Security tests/CI:

- `dotnet test`, architecture tests và migration test.
- NuGet vulnerable package scan.
- Gitleaks trên working tree và Git history.
- Dependency/container scan và DAST cơ bản trên staging.

## 4. Thứ tự triển khai đề xuất

| Giai đoạn | Nội dung | Ước lượng một backend engineer |
|---|---|---:|
| Ngay lập tức | Rotate/redact secrets, force logout, kiểm tra history | 0.5–1 ngày |
| Sprint 1A | User authorization, DTO split, `ICurrentUser` | 1–2 ngày |
| Sprint 1B | Pending registration + atomic OTP/reset challenge | 3–5 ngày |
| Sprint 1C | Multi-layer rate limiting + forwarded headers | 2–3 ngày |
| Sprint 2A | Security version/token invalidation | 2–3 ngày |
| Sprint 2B | Encrypted transactional email outbox + lease | 4–7 ngày |
| Sprint 3A | Validation, ProblemDetails, Swagger, privacy/logging | 2–3 ngày |
| Sprint 3B | Project split + architecture tests | 3–5 ngày |
| Xuyên suốt | Unit/integration/security tests | 4–7 ngày |

Tổng thực tế: khoảng 3–4 tuần cho một backend engineer, hoặc 2 sprint với hai người nếu chia nhánh auth và outbox nhưng thống nhất contract/migration trước.

## 5. Definition of Done toàn backend

- Không có endpoint nghiệp vụ nhạy cảm dựa vào object id từ client mà thiếu policy/ownership.
- Không có secret trong source, report, history hoặc image; toàn bộ secret đã lộ được rotate.
- Một OTP/reset/registration challenge chỉ được consume đúng một lần dưới tải concurrent.
- Reset password/disable/role change vô hiệu access và refresh token ngay lập tức.
- Endpoint auth có limiter per-IP, per-account/challenge và global.
- Không có OTP plaintext trong DB/log; PII có retention và access control.
- Email outbox hoạt động đúng với nhiều API instance, bounded memory và không gửi trùng.
- Mọi input có null/length/business validation; lỗi theo một ProblemDetails contract.
- Domain/Application được enforce bằng project references và architecture tests.
- Các flow auth, authorization và queue có integration test; CI chặn secret/vulnerable dependency/regression.

