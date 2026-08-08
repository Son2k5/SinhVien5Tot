# SV5T

Hệ thống gồm ASP.NET Core 9 Web API và React/TypeScript. Backend giữ mô hình
Layered Architecture quen thuộc, đồng thời áp dụng ranh giới phụ thuộc của
Clean Architecture bằng bốn project độc lập để compiler cưỡng chế chiều phụ thuộc.

## Kiến trúc backend

```text
HTTP Request
    ↓
Presentation/Controllers
    ↓
Application/Services
    ↓
Application/Interfaces/Repositories
    ↑
Infrastructure/Repositories
    ↓
Infrastructure/Persistence/ApplicationDbContext
    ↓
Domain/Entities
```

Quy tắc phụ thuộc:

- `Domain` chứa entity, enum và quy tắc nghiệp vụ; không phụ thuộc layer khác.
- `Application` chứa DTO, service và abstraction; chỉ được phụ thuộc `Domain`.
- `Infrastructure` triển khai repository, EF Core, cấu hình dịch vụ ngoài; được
  phụ thuộc `Application` và `Domain`.
- `Presentation` chứa controller và middleware; gọi service của `Application`,
  không truy cập repository hoặc `DbContext` trực tiếp.
- `Program.cs` là composition root, chịu trách nhiệm ghép các layer.

## Cấu trúc thư mục

```text
SV5T/
├── api/
│   ├── Application/
│   │   ├── DTOs/
│   │   ├── Interfaces/
│   │   │   ├── Repositories/
│   │   │   └── Services/
│   │   └── Services/
│   ├── Domain/
│   │   ├── Entities/
│   │   └── Enums/
│   ├── Infrastructure/
│   │   ├── Options/
│   │   ├── Persistence/
│   │   │   └── Configurations/
│   │   └── Repositories/
│   ├── Presentation/
│   │   ├── Controllers/
│   │   └── Middleware/
│   ├── scripts/check-architecture.ps1
│   ├── Program.cs
│   └── SV5T.Api.csproj
├── tests/
│   └── SV5T.UnitTests/
├── SV5T.sln
├── frontend/
│   └── src/
│       ├── app/                 # App shell và global styles
│       ├── pages/               # Các trang theo route
│       └── shared/              # Asset/component dùng chung
└── compose.yaml
```

## Quy ước đặt tên

- Folder và namespace dùng `PascalCase` ở backend.
- Class/interface/file dùng `PascalCase`; interface bắt đầu bằng `I`.
- Entity dùng danh từ số ít: `User`, `UserProfile`, `RefreshToken`.
- DTO có hậu tố theo vai trò: `UserDto`, `CreateUserRequest`.
- Implementation repository có hậu tố `Repository`.
- EF Core configuration có hậu tố `Configuration`.
- Enum member dùng `PascalCase`, ví dụ `Role.Admin`, không dùng `ADMIN`.

## Chạy local

Yêu cầu: .NET SDK 9, Node.js/npm, MySQL local và Docker Desktop cho Redis.

```powershell
# 0. Chỉ tạo .env ở thư mục gốc cho Docker Compose và thay toàn bộ placeholder
Copy-Item .env.example .env

# Backend tự nạp api/.env. Điền các giá trị còn trống trong file này.
# User Secrets vẫn được hỗ trợ làm giá trị dự phòng khi một dòng .env để trống.
dotnet user-secrets --project api/SV5T.Api.csproj set "ConnectionStrings:DefaultConnection" "<mysql-connection-string>"
dotnet user-secrets --project api/SV5T.Api.csproj set "ConnectionStrings:Redis" "<redis-connection-string>"
dotnet user-secrets --project api/SV5T.Api.csproj set "Jwt:Key" "<random-32-byte-minimum>"
dotnet user-secrets --project api/SV5T.Api.csproj set "Otp:Pepper" "<separate-random-32-byte-minimum>"
dotnet user-secrets --project api/SV5T.Api.csproj set "IdentifierHash:Key" "<separate-random-32-byte-minimum>"
dotnet user-secrets --project api/SV5T.Api.csproj set "EmailSettings:Username" "<smtp-login>"
dotnet user-secrets --project api/SV5T.Api.csproj set "EmailSettings:Password" "<smtp-key>"
dotnet user-secrets --project api/SV5T.Api.csproj set "EmailSettings:FromAddress" "<verified-sender>"

# 1. Đảm bảo MySQL local đang chạy, sau đó khởi động Redis
docker compose up -d

# 2. Build và kiểm tra dependency rule
dotnet restore SV5T.sln
dotnet build SV5T.sln --no-restore
powershell -ExecutionPolicy Bypass -File api/scripts/check-architecture.ps1

# 3. Chạy API tại http://localhost:5080/swagger
dotnet run --project api/SV5T.Api.csproj

# 4. Chạy frontend tại http://localhost:5173
npm --prefix frontend install
npm --prefix frontend run dev
```

Frontend proxy các request `/api` sang `http://localhost:5080`.

## Thêm nghiệp vụ mới

Ví dụ với `Campaign`:

1. Đặt entity trong `Domain/Entities/Campaign.cs`.
2. Đặt request/response trong `Application/DTOs/Campaigns`.
3. Tạo `ICampaignService` và `ICampaignRepository` trong
   `Application/Interfaces`.
4. Viết `CampaignService` trong `Application/Services`.
5. Viết `CampaignRepository` trong `Infrastructure/Repositories`.
6. Thêm EF configuration trong
   `Infrastructure/Persistence/Configurations`.
7. Thêm `CampaignsController` trong `Presentation/Controllers`.
8. Đăng ký service/repository trong file `DependencyInjection.cs` của layer
   tương ứng.

Không đặt SQL/EF Core trong service, không trả HTTP response từ repository và
không expose entity trực tiếp qua controller.

## Cấu hình

Secret không được commit. File `.env` ở thư mục gốc chỉ dành cho Docker Compose
local. API đọc cấu hình local bằng .NET User Secrets và đọc environment variable
ở môi trường triển khai. Production cần tối thiểu:

```text
ConnectionStrings__DefaultConnection
ConnectionStrings__Redis
Jwt__Key
Otp__Pepper
IdentifierHash__Key
EmailSettings__Username
EmailSettings__Password
EmailSettings__FromAddress
```

### Đăng ký bằng email sinh viên

- Sinh viên đăng ký bằng email `@ms.hanu.edu.vn` và tự tạo mật khẩu.
- Backend gửi OTP qua Brevo đến hộp thư email trường. Sau khi xác minh OTP, sinh
  viên đăng nhập bằng email và mật khẩu đã tạo.
- Danh sách tên miền email được phép cấu hình bằng
  `SchoolEmail__AllowedDomains__0=ms.hanu.edu.vn`.
- Outlook chỉ là hộp thư nhận OTP; hệ thống không dùng Microsoft Identity/OAuth.

### Gửi email nền bằng Brevo SMTP

- Tạo và xác minh sender/domain trong Brevo, sau đó lấy SMTP Login và tạo SMTP Key
  tại `SMTP & API > SMTP`.
- Không tạo `api/.env`. Cấu hình local bằng `dotnet user-secrets --project
  api/SV5T.Api.csproj set "EmailSettings:Username" "<smtp-login>"` và lệnh tương
  tự cho `EmailSettings:Password`. Dùng cổng `587`, `StartTls=true`; SMTP Key
  không phải API Key hay mật khẩu tài khoản Brevo.
- Challenge đăng ký/đặt lại mật khẩu được lưu tạm trong Redis Hash với TTL; kiểm tra,
  tăng số lần sai và consume OTP dùng Lua script nguyên tử. Email được ghi vào Redis
  Streams, payload mã hóa bằng ASP.NET Core Data Protection; worker dùng consumer group,
  `XAUTOCLAIM`, retry có trì hoãn và dead-letter stream để chịu được restart/nhiều instance.
- `EmailSettings__DailyRecipientLimit` mặc định là 300 để khớp gói Brevo Free.
  `EmailSettings__PasswordResetReserve=50` giữ lại 50 lượt cuối cho email đặt lại
  mật khẩu, không cho lưu lượng đăng ký chiếm hết quota.
  OTP có hiệu lực 3 phút (`Otp__ExpirySeconds=180`). Nếu chưa nhận được, đăng
  ký gọi `POST /api/auth/resend-otp` với `registrationId`; đặt lại mật khẩu dùng
  `resetId` trả về từ `POST /api/auth/forgot-password`. Mỗi lần gửi lại tạo OTP
  mới và vô hiệu OTP cũ.
- Khi nâng cấp Brevo, đặt `EmailSettings__DailyRecipientLimit=0` để tắt giới
  hạn nội bộ; ứng dụng vẫn phải tuân thủ quota của gói Brevo.
- Áp dụng migration bằng
  `dotnet ef database update --project api/Infrastructure/SV5T.Infrastructure.csproj --startup-project api/SV5T.Api.csproj`.

### Refresh token

- Refresh token được lưu trong bảng `refresh_tokens`; cột `Token` chỉ chứa SHA-256
  hash, không lưu token thô từ cookie.
- Mỗi lần refresh sẽ thu hồi token cũ và tạo token mới trong cùng transaction.
  Việc dùng lại token đã thu hồi sẽ thu hồi toàn bộ refresh token đang hoạt động
  của người dùng.
- Token đã thu hồi hoặc đã hết hạn được giữ lại 2 ngày để phát hiện reuse, sau đó
  background service dọn định kỳ mỗi 6 giờ.

### Redis

- Redis local trong `compose.yaml` yêu cầu `REDIS_PASSWORD`, chỉ publish trên
  `127.0.0.1`, bật AOF và dùng `noeviction`.
- Redis phải từ phiên bản 6.2 trở lên vì email worker dùng `XAUTOCLAIM`. Redis là nơi
  lưu challenge và hàng đợi email nên production phải bật persistence và backup phù hợp.
- API chạy trên máy dùng `localhost:6379`; API chạy trong cùng Docker network dùng
  hostname `redis`.
- Production phải dùng mật khẩu riêng, TLS (`ssl=true`,
  `Redis__RequireTls=true`) và không publish cổng Redis ra Internet.
- Thay đổi `Redis__KeyPrefix` sẽ làm access-token blacklist, challenge và email đang chờ
  dưới prefix cũ không còn được ứng dụng nhìn thấy.

## Kiểm tra trước khi merge

```powershell
dotnet build SV5T.sln --no-restore
powershell -ExecutionPolicy Bypass -File api/scripts/check-architecture.ps1
npm.cmd --prefix frontend run build
```
