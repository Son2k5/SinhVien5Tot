# 🏗️ Kiến trúc Hệ thống SV5T

Dự án **SV5T** được xây dựng dựa trên nguyên lý **Clean Architecture** kết hợp với các mẫu thiết kế từ **Domain-Driven Design (DDD)** nhằm đảm bảo tính độc lập, khả năng mở rộng và dễ dàng viết kiểm thử tự động.

## 1. Sơ đồ Kiến trúc 4 Tầng (Clean Architecture)

```text
HTTP Request / SignalR Connection
    ↓
Presentation Layer (SV5T.Api)
    ├── Controllers (Admin, Student, Auth, Staff...)
    ├── SignalR Hubs (ChatHub)
    └── Middlewares (ExceptionHandling, SecurityEvents)
    ↓
Application Layer (SV5T.Application)
    ├── DTOs & ViewModels
    ├── Service Interfaces & Implementations
    └── Business Validation
    ↓
Infrastructure Layer (SV5T.Infrastructure)
    ├── Persistence (EF Core DbContext, Configurations)
    ├── Dapper Query Handlers
    ├── Identity & Token Management
    ├── Redis Streams Workers (Email Outbox)
    └── Cloud Storage (Cloudinary)
    ↓
Domain Layer (SV5T.Domain)
    ├── Entities & Aggregates (Application, Campaign, Criterion, User...)
    ├── Enums & Value Objects
    └── Domain Events & Core Business Invariants
```

## 2. Nguyên tắc Phụ thuộc (Dependency Rule)

- **Domain Layer**: Là hạt nhân của hệ thống, hoàn toàn không phụ thuộc vào bất kỳ thư viện hay framework bên ngoài nào.
- **Application Layer**: Chứa các ca sử dụng (Use Cases) và nghiệp vụ hệ thống. Phụ thuộc vào Domain, định nghĩa các interfaces cho hạ tầng.
- **Infrastructure Layer**: Triển khai các giao tiếp ngoại vi (EF Core MySQL, Dapper, Redis Streams, Cloudinary, MailKit SMTP).
- **Api Layer (Presentation)**: Điểm vào của ứng dụng (RESTful API, SignalR Hub), định tuyến request, xử lý xác thực và dependency injection.
