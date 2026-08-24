import type { LucideIcon } from 'lucide-react';
import {
  Compass,
  GraduationCap,
  HeartHandshake,
  ShieldCheck,
  Users,
} from 'lucide-react';
import type { CriterionKey, CriterionProgress, PortalContentSource } from '../../../types/welcome';

export interface CriterionDefinition {
  key: CriterionKey;
  number: string;
  title: string;
  shortDescription: string;
  description: string;
  icon: LucideIcon;
  tone: 'blue' | 'green' | 'orange' | 'purple' | 'pink';
  requirements: string[];
}

export const portalSourceLabels: Record<PortalContentSource, string> = {
  System: 'Hệ thống SV5T',
  University: 'Nhà trường',
  Faculty: 'Khoa',
  YouthUnion: 'Đoàn Thanh niên',
};

export const dashboardCriteria: CriterionDefinition[] = [
  {
    key: 'ethics',
    number: '01',
    title: 'Đạo đức tốt',
    shortDescription: 'Sống có lý tưởng, trách nhiệm và kỷ luật.',
    description: 'Tiêu chí ghi nhận ý thức công dân, phẩm chất đạo đức và tinh thần trách nhiệm của sinh viên với tập thể, nhà trường và cộng đồng.',
    icon: HeartHandshake,
    tone: 'blue',
    requirements: ['Chấp hành tốt quy định của nhà trường', 'Có ý thức trách nhiệm với cộng đồng', 'Tham gia hoạt động giáo dục chính trị, tư tưởng'],
  },
  {
    key: 'study',
    number: '02',
    title: 'Học tập tốt',
    shortDescription: 'Không ngừng học hỏi, nâng cao tri thức.',
    description: 'Tiêu chí đánh giá kết quả học tập, tinh thần nghiên cứu, đổi mới sáng tạo và khả năng chủ động phát triển chuyên môn.',
    icon: GraduationCap,
    tone: 'green',
    requirements: ['Duy trì kết quả học tập theo yêu cầu', 'Tham gia hoạt động học thuật hoặc nghiên cứu', 'Có kế hoạch tự học và phát triển chuyên môn'],
  },
  {
    key: 'fitness',
    number: '03',
    title: 'Thể lực tốt',
    shortDescription: 'Rèn luyện thể chất, xây dựng lối sống lành mạnh.',
    description: 'Tiêu chí khuyến khích sinh viên duy trì sức khỏe, tham gia thể thao và hình thành thói quen sống tích cực, cân bằng.',
    icon: ShieldCheck,
    tone: 'orange',
    requirements: ['Tham gia kiểm tra hoặc hoạt động thể lực', 'Duy trì thói quen vận động thường xuyên', 'Có lối sống lành mạnh và tích cực'],
  },
  {
    key: 'volunteer',
    number: '04',
    title: 'Tình nguyện tốt',
    shortDescription: 'Sẵn sàng sẻ chia, cống hiến vì cộng đồng.',
    description: 'Tiêu chí ghi nhận tinh thần xung kích, các hoạt động tình nguyện và đóng góp thiết thực của sinh viên cho xã hội.',
    icon: Users,
    tone: 'purple',
    requirements: ['Tham gia hoạt động hoặc chiến dịch tình nguyện', 'Có thời lượng cống hiến được xác nhận', 'Lan tỏa giá trị tích cực tới cộng đồng'],
  },
  {
    key: 'integration',
    number: '05',
    title: 'Hội nhập tốt',
    shortDescription: 'Chủ động hội nhập, tự tin trong môi trường toàn cầu.',
    description: 'Tiêu chí đánh giá ngoại ngữ, kỹ năng mềm, năng lực thích nghi và tinh thần chủ động kết nối trong môi trường đa văn hóa.',
    icon: Compass,
    tone: 'pink',
    requirements: ['Đạt chuẩn ngoại ngữ hoặc kỹ năng hội nhập', 'Tham gia hoạt động giao lưu, kỹ năng', 'Có khả năng làm việc và kết nối đa văn hóa'],
  },
];

const todayFormatter = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
});

const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const eventTimeFormatter = new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
});

const calendarDayFormatter = new Intl.DateTimeFormat('vi-VN', { day: '2-digit' });
const calendarMonthFormatter = new Intl.DateTimeFormat('vi-VN', { month: 'short' });

export function formatToday(): string {
  return todayFormatter.format(new Date());
}

export function formatUserRole(role?: string | number | null): string {
  if (role === null || role === undefined) return 'Sinh viên';
  const roleStr = String(role).trim().toLocaleLowerCase('en-US');
  if (roleStr === 'admin' || roleStr === '3') return 'Quản trị viên';
  if (roleStr === 'mentor' || roleStr === '2') return 'Cán bộ xét duyệt';
  return 'Sinh viên';
}

export function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

export function formatEventTime(value: string): string {
  return eventTimeFormatter.format(new Date(value));
}

export function getEventCalendar(value: string): { day: string; month: string } {
  const date = new Date(value);
  return {
    day: calendarDayFormatter.format(date),
    month: calendarMonthFormatter.format(date).replace('thg', 'TH'),
  };
}

export function calculateAverageProgress(progress: CriterionProgress[]): number {
  if (progress.length === 0) return 0;
  return Math.round(progress.reduce((total, item) => total + item.progress, 0) / progress.length);
}
