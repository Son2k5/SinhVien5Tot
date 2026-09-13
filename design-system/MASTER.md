# SV5T Design System — Master Specification

> **Nguồn chân lý toàn cục (Global Source of Truth) cho hệ sinh thái SV5T.**
> Khi thiết kế từng trang cụ thể, kiểm tra file `design-system/pages/[page-name].md` trước. Nếu tồn tại, các quy tắc trang sẽ override file Master này.

---

## 1. Bản Sắc Thiết Kế (Brand Identity & Theme)
- **Phong cách cốt lõi:** Navy Deep Space Background kết hợp Glassmorphism thanh lịch, hiện đại.
- **Tông màu chủ đạo:** Nền xanh Navy sâu thẳm (`#0b1727`, `#0f223a`, `#132b49`), bề mặt thẻ kính mờ (Glassmorphism với `backdrop-blur-md`, `bg-white/90` hoặc `bg-slate-900/60` tùy ngữ cảnh), viền phản chiếu ánh sáng tinh tế (`#dbeaf2` / `rgba(255, 255, 255, 0.12)`).
- **Dải màu Gradient điểm nhấn (Accent):** Ocean-to-Sky Blue Gradient (`linear-gradient(120deg, #20a8e7, #177be2)`), đổ bóng mềm `shadow-[0_9px_20px_rgba(23,123,226,.17)]`.
- **Tuyệt đối không dùng Emoji làm icon giao diện:** Sử dụng 100% vector icons từ thư viện `lucide-react`.

---

## 2. Bảng Màu Chuẩn (Color Tokens)

| Token Role | Hex Code | Ý nghĩa / Ngữ cảnh sử dụng |
|---|---|---|
| **Navy Deep** | `#0b1727` / `#0f223a` | Nền trang chính, header, sidebar header, chữ đậm cấp 1 |
| **Navy Text** | `#102340` / `#162a45` | Màu chữ tiêu đề chính (h1, h2) |
| **Slate Body** | `#476a7f` / `#627d8e` | Màu chữ nội dung, nhãn, dữ liệu bảng |
| **Muted Text** | `#889eaa` / `#9aabb4` | Chữ phụ, mô tả ngắn, placeholder, breadcrumbs |
| **Accent Primary** | `#177be2` | Nút hành động chính, active tab, liên kết nổi bật |
| **Accent Cyan** | `#20a8e7` | Gradient phụ, highlight badge, KPI cyan |
| **Emerald (Thành công/Đạt)** | `#168b67` (nền `#e9f8f2`) | Trạng thái Open, Published, Đạt chuẩn, Approved |
| **Amber (Cảnh báo/Nháp)** | `#df8b13` (nền `#fff6df`) | Trạng thái Draft, Reviewing, Cần xử lý gấp |
| **Rose/Crimson (Xoá/Nguy hiểm)** | `#d84d67` (nền `#fff0f3`) | Trạng thái Rejected, Nút xoá, Cảnh báo cascade delete |
| **Glass Surface** | `rgba(255, 255, 255, 0.92)` | Thẻ dữ liệu, bảng, modal, container |
| **Glass Border** | `#dbeaf2` / `rgba(223, 235, 242, 0.8)` | Đường viền các card, form input, table header |

---

## 3. Kiểu Chữ & Phông Chữ (Typography)
- **Văn bản & Tiêu đề chính:** `Be Vietnam Pro` (Google Fonts), hỗ trợ tiếng Việt đầy đủ với các weights 400, 500, 600, 700, 800.
- **Số liệu thống kê, Mã định danh, JSON & Code:** `JetBrains Mono` / `ui-monospace` (Hiển thị rõ ràng các mã tiêu chí `CRIT-01`, mã sinh viên, UUID, ngày giờ).

---

## 4. Quy Chuẩn Thành Phần Giao Diện (Component Specifications)

### 4.1. Bảng Dữ Liệu (DataTable)
- Viền mềm bo góc bất đối xứng phong cách SV5T (`rounded-[21px_9px_21px_9px]` hoặc `rounded-2xl`).
- Header bảng: Nền nhạt (`#f8fafc` hoặc `#f0f6fa`), chữ `text-[11px] font-bold uppercase tracking-wider text-[#79909f]`.
- Hàng dữ liệu (Row): Hover hiệu ứng chuyển màu `hover:bg-[#f3f9fc]/60 transition-colors duration-150`, đường kẻ mỏng `border-b border-[#edf3f6]`.
- Empty State: Hiển thị icon vector minh họa, thông điệp rõ ràng và nút hành động kêu gọi tạo mới.
- Loading Skeleton: Dùng hiệu ứng shimmer gradient ngang, không dùng spinner to chắn giữa màn hình.

### 4.2. Biểu Mẫu Nhập Liệu (Forms & Inputs)
- Input / Select: `h-[42px] px-3.5 text-[13px] border border-[#dbeaf2] rounded-xl bg-[#f9fcfd] text-[#162a45] focus:border-[#177be2] focus:ring-2 focus:ring-[#177be2]/20 outline-none transition-all`.
- Label: `text-[12px] font-bold text-[#476a7f] mb-1.5 flex items-center justify-between`.
- Validation Error: Chữ đỏ `#dc2626 text-[11px] font-medium mt-1 flex items-center gap-1`.

### 4.3. Hộp Thoại & Drawer (Modals)
- Overlay: `bg-slate-900/40 backdrop-blur-sm fixed inset-0 z-50 flex items-center justify-center p-4`.
- Khung Modal: `bg-white rounded-[24px_10px_24px_10px] border border-[#dbeaf2] shadow-[0_25px_60px_rgba(15,35,60,0.18)] max-h-[90vh] overflow-y-auto`.
- Cảnh báo xoá/nguy hiểm: Banner màu hổ phách/đỏ nhạt, giải thích rõ ràng các dữ liệu phụ thuộc (cascade).

### 4.4. Huy Hiệu Trạng Thái (Status Badges)
- Thiết kế dạng chip bo tròn mềm: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold`.
- Luôn có kèm icon vector hoặc dấu chấm phân biệt (không chỉ dựa vào màu sắc).
