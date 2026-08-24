import { ArrowRight, CheckCircle2, Construction, ShieldCheck } from 'lucide-react';

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

export function AdminFeatureView({ section }: { section: AdminSection }) {
  const [title, description] = sections[section];
  return <div className={`admin-feature-page w-[min(1480px,100%)] mx-auto grid gap-[19px] gap-[22px]`}><section className={`flex items-end justify-between gap-[24px] [&_h1]:m-[5px_0_5px] [&_h1]:text-[var(--admin-navy)] [&_h1]:text-[clamp(23px,2.4vw,32px)] [&_h1]:tracking-[-.8px] [&_p]:max-w-[700px] [&_p]:m-0 [&_p]:text-[#79909f] [&_p]:text-[10.5px] [&_p]:leading-[1.6] max-[650px]:items-start max-[650px]:flex-col max-[430px]:[&_h1]:text-[23px]`}><div><span className={`text-[#1b8bd2] text-[8px] font-extrabold tracking-[1.25px] uppercase`}>Không gian chức năng</span><h1>{title}</h1><p>{description}</p></div></section><section className={`[&_button]:min-h-[39px] [&_button]:p-[0_13px] [&_button]:inline-flex [&_button]:items-center [&_button]:justify-center [&_button]:gap-[7px] [&_button]:text-[#4d7087] [&_button]:border [&_button]:border-[#d7e8f1] [&_button]:rounded-[12px_6px_12px_6px] [&_button]:bg-white [&_button]:cursor-pointer [&_button]:text-[9px] [&_button]:font-bold min-h-[360px] p-[50px] grid grid-cols-[75px_minmax(0,560px)] content-center justify-center gap-[24px] border border-[#d9eaf2] rounded-[28px_12px_28px_12px] bg-[radial-gradient(circle_at_85%_15%,rgba(35,177,220,.12),transparent_20rem),#fff] shadow-[0_20px_50px_rgba(42,92,119,.06)] [&>span]:w-[72px] [&>span]:h-[72px] [&>span]:grid [&>span]:place-items-center [&>span]:text-white [&>span]:rounded-[24px_9px_24px_9px] [&>span]:bg-[linear-gradient(145deg,#2bbbe0,#177ce1)] [&>span]:shadow-[0_14px_30px_rgba(23,124,225,.2)] [&_h2]:m-[0_0_8px] [&_h2]:text-[var(--admin-navy)] [&_h2]:text-[20px] [&_p]:m-0 [&_p]:text-[#748d9c] [&_p]:text-[10px] [&_p]:leading-[1.7] [&>div>div]:m-[17px_0] [&>div>div]:flex [&>div>div]:flex-wrap [&>div>div]:gap-[9px] [&>div>div_span]:p-[7px_9px] [&>div>div_span]:inline-flex [&>div>div_span]:items-center [&>div>div_span]:gap-[5px] [&>div>div_span]:text-[#248169] [&>div>div_span]:rounded-full [&>div>div_span]:bg-[#ebf8f3] [&>div>div_span]:text-[8px] [&>div>div_span]:font-bold max-[650px]:p-[30px_22px] max-[650px]:grid-cols-[1fr] max-[650px]:[&>span]:w-[60px] max-[650px]:[&>span]:h-[60px] max-[430px]:[&>div>div]:grid max-[430px]:[&>div>div_span]:justify-center`}><span><Construction size={26} /></span><div><h2>Nội dung đang được kết nối</h2><p>Khung layout quản trị vẫn được giữ nguyên khi chuyển trang. Module nghiệp vụ này đã có route và phân quyền đúng vai trò, sẵn sàng nối dữ liệu khi mô hình nghiệp vụ tương ứng được bổ sung.</p><div><span><CheckCircle2 size={16} />Route bảo vệ theo vai trò</span><span><ShieldCheck size={16} />Không lộ menu ngoài quyền</span></div><button type="button">Xem quy trình dự kiến <ArrowRight size={16} /></button></div></section></div>;
}
