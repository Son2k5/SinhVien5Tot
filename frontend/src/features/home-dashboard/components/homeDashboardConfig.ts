import type { LucideIcon } from 'lucide-react';
import {
  Compass,
  GraduationCap,
  HeartHandshake,
  ShieldCheck,
  Users,
} from 'lucide-react';
import type {
  CriterionDetailItem,
  CriterionKey,
  CriterionProgress,
  PortalContentSource,
  StandardJourney,
} from '../types/home-dashboard.types';

export interface CriterionDefinition {
  key: CriterionKey;
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: 'blue' | 'green' | 'orange' | 'purple' | 'pink';
  criteria?: CriterionDetailItem[];
}

export function mergeDashboardCriteriaWithStandards(
  baseCriteria: CriterionDefinition[],
  standards?: StandardJourney[],
): CriterionDefinition[] {
  if (!standards || standards.length === 0) {
    return baseCriteria.map((base) => ({
      ...base,
      description: '',
      criteria: [],
    }));
  }

  return baseCriteria.map((base) => {
    const std = standards.find((s) => s.key === base.key);
    if (!std) {
      return {
        ...base,
        description: '',
        criteria: [],
      };
    }

    return {
      ...base,
      title: std.title || base.title,
      description: std.description || '',
      criteria: std.criteria || [],
    };
  });
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
    description: '',
    icon: HeartHandshake,
    tone: 'blue',
  },
  {
    key: 'study',
    number: '02',
    title: 'Học tập tốt',
    description: '',
    icon: GraduationCap,
    tone: 'green',
  },
  {
    key: 'fitness',
    number: '03',
    title: 'Thể lực tốt',
    description: '',
    icon: ShieldCheck,
    tone: 'orange',
  },
  {
    key: 'volunteer',
    number: '04',
    title: 'Tình nguyện tốt',
    description: '',
    icon: Users,
    tone: 'purple',
  },
  {
    key: 'integration',
    number: '05',
    title: 'Hội nhập tốt',
    description: '',
    icon: Compass,
    tone: 'pink',
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
