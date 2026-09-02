import type { ComponentType } from 'react';
import {
  BarChart3,
  BookOpenCheck,
  CalendarDays,
  ClipboardCheck,
  FileCheck2,
  LayoutDashboard,
  Medal,
  Settings,
  UserCog,
} from 'lucide-react';
import type { User } from '../../../types/auth';
import { isAdmin, normalizeRole } from '../../../utils/authorization';

export interface MenuItem {
  label: string;
  to: string;
  icon: ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  adminOnly?: boolean;
  badge?: string | number;
  children?: Array<{ label: string; to: string; badge?: string | number }>;
}

export interface MenuGroup {
  label: string;
  items: MenuItem[];
}

export const menuGroups: MenuGroup[] = [
  {
    label: 'Tổng quan',
    items: [
      { label: 'Bảng điều khiển', to: '/admin', icon: LayoutDashboard },
      { label: 'Chiến dịch', to: '/admin/campaigns', icon: CalendarDays },
      {
        label: 'Hồ sơ đăng ký',
        to: '/admin/applications',
        icon: FileCheck2,
        badge: '24',
        children: [
          { label: 'Chờ xét duyệt', to: '/admin/applications?status=pending', badge: '12' },
          { label: 'Yêu cầu bổ sung', to: '/admin/applications?status=supplement', badge: '4' },
          { label: 'Đã duyệt', to: '/admin/applications?status=approved', badge: '7' },
          { label: 'Từ chối', to: '/admin/applications?status=rejected', badge: '1' },
        ],
      },
      { label: 'Duyệt minh chứng', to: '/admin/evidence', icon: ClipboardCheck },
    ],
  },
  {
    label: 'Quản trị chương trình',
    items: [
      { label: 'Cấu hình tiêu chuẩn', to: '/admin/standards', icon: BookOpenCheck, adminOnly: true },
      { label: 'Danh hiệu tập thể', to: '/admin/collectives', icon: Medal },
      { label: 'Báo cáo & Thống kê', to: '/admin/reports', icon: BarChart3 },
    ],
  },
  {
    label: 'Hệ thống',
    items: [
      { label: 'Người dùng & Phân quyền', to: '/admin/roles', icon: UserCog, adminOnly: true },
      { label: 'Cài đặt hệ thống', to: '/admin/settings', icon: Settings },
    ],
  },
];

export const pageTitles: Record<string, string> = {
  '/admin': 'Tổng quan',
  '/admin/campaigns': 'Chiến dịch',
  '/admin/applications': 'Hồ sơ đăng ký',
  '/admin/evidence': 'Duyệt minh chứng',
  '/admin/standards': 'Cấu hình tiêu chuẩn',
  '/admin/collectives': 'Danh hiệu tập thể',
  '/admin/reports': 'Báo cáo & Thống kê',
  '/admin/roles': 'Người dùng & Phân quyền',
  '/admin/settings': 'Cài đặt hệ thống',
  '/admin/account': 'Thông tin tài khoản',
  '/admin/change-password': 'Đổi mật khẩu',
};

export function getPageInfo(pathname: string): { section: string; title: string } {
  if (pageTitles[pathname]) {
    if (['/admin', '/admin/campaigns', '/admin/applications', '/admin/evidence'].includes(pathname)) {
      return { section: 'Tổng quan', title: pageTitles[pathname] };
    }
    if (['/admin/standards', '/admin/collectives', '/admin/reports'].includes(pathname)) {
      return { section: 'Quản trị', title: pageTitles[pathname] };
    }
    return { section: 'Hệ thống', title: pageTitles[pathname] };
  }
  if (pathname.startsWith('/admin/campaigns/')) {
    return { section: 'Chiến dịch', title: 'Chi tiết chiến dịch' };
  }
  if (pathname.startsWith('/admin/standards/')) {
    return { section: 'Tiêu chuẩn', title: 'Chi tiết tiêu chuẩn' };
  }
  return { section: 'Quản trị', title: 'SV5T Portal' };
}

export function roleLabel(role?: string): string {
  return normalizeRole(role) === 'Admin' ? 'Quản trị viên' : 'Cán bộ xét duyệt';
}

export function getVisibleMenuGroups(user: User): MenuGroup[] {
  return menuGroups.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.adminOnly || isAdmin(user)),
  }));
}
