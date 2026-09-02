import { ArrowRight, CheckCircle2, Construction, ShieldCheck } from 'lucide-react';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';

const sections = {
  campaigns: ['Quản lý chiến dịch', 'Theo dõi danh sách, tiến độ và thời hạn của các chiến dịch Sinh viên 5 tốt.'],
  'campaign-create': ['Tạo chiến dịch mới', 'Thiết lập năm học, cấp xét duyệt, thời hạn và phạm vi áp dụng.'],
  applications: ['Hồ sơ đăng ký', 'Tiếp nhận, lọc và xử lý hồ sơ theo từng trạng thái xét duyệt.'],
  evidence: ['Duyệt minh chứng', 'Đối chiếu minh chứng với tiêu chí và ghi nhận kết quả đánh giá.'],
  standards: ['Cấu hình tiêu chuẩn', 'Quản lý nhóm tiêu chuẩn, tiêu chí và khung mẫu minh chứng.'],
  collectives: ['Danh hiệu tập thể', 'Theo dõi tỷ lệ đạt chuẩn của Chi hội và Liên chi hội.'],
  reports: ['Báo cáo & Thống kê', 'Tổng hợp dữ liệu theo chiến dịch, cấp và đơn vị.'],
  roles: ['Người dùng & Phân quyền', 'Quản lý vai trò Admin, Mentor, User và phạm vi truy cập.'],
  settings: ['Cài đặt hệ thống', 'Thiết lập thông báo, thời hạn xử lý và tham số vận hành.'],
  account: ['Thông tin tài khoản', 'Xem và cập nhật thông tin tài khoản quản trị.'],
  'change-password': ['Đổi mật khẩu', 'Cập nhật mật khẩu đăng nhập và bảo vệ phiên làm việc.'],
} as const;

export type AdminSection = keyof typeof sections;

export function AdminFeaturePage({ section }: { section: AdminSection }) {
  const [title, description] = sections[section];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5">
      <AdminPageHeader
        title={title}
        description={description}
        breadcrumbs={[{ label: title }]}
        showBack={true}
      />

      <section className="p-8 sm:p-12 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <Construction size={28} />
        </div>

        <div className="max-w-md space-y-1.5">
          <h2 className="text-base font-semibold text-slate-800">
            Nội dung đang được kết nối
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Module nghiệp vụ này đã có route và phân quyền đúng vai trò, sẵn sàng nối dữ liệu khi mô hình nghiệp vụ tương ứng được bổ sung.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={13} className="text-emerald-600" />
            <span>Route bảo vệ theo vai trò</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ShieldCheck size={13} className="text-emerald-600" />
            <span>Không lộ menu ngoài quyền</span>
          </span>
        </div>

        <div className="pt-2">
          <button
            type="button"
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Xem quy trình dự kiến</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </section>
    </div>
  );
}
