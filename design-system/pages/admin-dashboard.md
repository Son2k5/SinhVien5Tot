# Admin Dashboard — Page Design Guidelines & Overrides

> Trang: **Admin Dashboard / Quản Trị Hệ Thống SV5T**
> Kế thừa toàn bộ quy tắc từ `design-system/MASTER.md`.

---

## 1. Không Gian Bố Cục (Layout & Spacing)
- **Container chính:** `max-w-[1480px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6`.
- **Thanh tiêu đề trang:** Breadcrumb gọn gàng phía trên, tiêu đề lớn `h1` màu Navy (`#102340`), phụ đề ghi rõ mục đích quản trị và khu vực nút hành động (Primary Action, Export, Filter) đặt ở góc trên bên phải.
- **Card bề mặt:** Sử dụng tông nền trắng ngà kính mờ `bg-white/95 backdrop-blur-md` kết hợp viền mảnh `#dbeaf2` và đổ bóng mềm `shadow-[0_14px_38px_rgba(42,94,122,.055)]`.

---

## 2. Quy Tắc Riêng Cho 3 Module Quản Trị

### 2.1. Module Đợt Xét (Campaigns)
- **Danh sách đợt xét:** Bảng hiển thị rõ Cấp xét duyệt (Trường / Thành phố / Trung ương), Loại danh hiệu, Trạng thái (Nháp, Đang mở, Đã đóng, Đang duyệt, Công bố, Lưu trữ), Bộ tiêu chuẩn áp dụng, Thời hạn nộp hồ sơ / xét duyệt.
- **Thanh tiến độ thời gian (Timeline bar):** Hiển thị trực quan vị trí hiện tại của thời gian thực tế so với các mốc: `Mở đăng ký -> Đóng đăng ký -> Hạn nộp minh chứng -> Hạn xét duyệt`.
- **Thao tác nhanh trạng thái:** Nút dropdown cho phép chuyển nhanh trạng thái chiến dịch có xác nhận.

### 2.2. Module Bộ Tiêu Chuẩn (Standard Sets)
- **Danh sách bộ tiêu chuẩn:** Phân nhóm theo Năm học và Cấp xét duyệt.
- **Huy hiệu phiên bản:** `v1`, `v2`, `v3` nổi bật bằng phông `JetBrains Mono`.
- **Nút Publish thông minh:** Kiểm tra trước tính đầy đủ của 5 nhóm tiêu chuẩn gốc (`Đạo đức`, `Học tập`, `Thể lực`, `Tình nguyện`, `Hội nhập`). Nếu thiếu nhóm nào, hiển thị cảnh báo cụ thể.
- **Tính năng sao chép mẫu:** Cho phép chọn một bộ tiêu chuẩn đã có để clone toàn bộ cây tiêu chí sang năm học hoặc phiên bản mới.

### 2.3. Module Cây Tiêu Chí (Criterion Tree Workspace)
- **Hiển thị trực quan dạng cây (Hierarchy Tree):**
  - Cấp 1: 5 nhóm tiêu chuẩn gốc (Ethics, Study, Fitness, Volunteer, Integration) với biểu tượng đại diện.
  - Cấp 2+: Các nhóm tiêu chí con hoặc tiêu chí yêu cầu (Requirement).
- **Nhãn toán tử nhóm:** Hiển thị rõ `Toán tử: Đạt tất cả (ALL)`, `Đạt bất kỳ (ANY)`, hoặc `Đạt tối thiểu X (At Least X)`.
- **Nhãn kiểu đánh giá:** `Đánh giá thủ công (Manual)`, `Đạt / Không đạt (Boolean)`, `Ngưỡng số lượng (Numeric)`, `Tích lũy (Accumulated)`.
- **Hỗ trợ JSON Definition:** Trình soạn thảo có sẵn mẫu JSON cho các kiểu đánh giá phổ biến, kèm tính năng kiểm tra tính hợp lệ của JSON trước khi gửi.
