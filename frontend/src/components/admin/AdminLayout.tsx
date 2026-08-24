import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  BarChart3, Bell, BookOpenCheck, ChevronDown, ChevronLeft, ChevronRight,
  ClipboardCheck, FileCheck2, FilePlus2, Files, Gauge, LogOut, Medal, Menu,
  Settings, ShieldCheck, UserCog, UserRound, UsersRound, X,
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { SiteFooter } from '../common/SiteFooter';
import type { User } from '../../types/auth';
import { isAdmin, normalizeRole } from '../../utils/authorization';
import '../../views/admin/AdminDashboard.css';

interface AdminLayoutProps { user: User; onLogout: () => void; }
interface MenuItem {
  label: string;
  to: string;
  icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  adminOnly?: boolean;
  children?: Array<{ label: string; to: string }>;
}

const menuGroups: Array<{ label: string; items: MenuItem[] }> = [
  { label: 'Điều hành', items: [
    { label: 'Tổng quan', to: '/admin', icon: Gauge },
    { label: 'Chiến dịch', to: '/admin/campaigns', icon: Files, children: [
      { label: 'Danh sách chiến dịch', to: '/admin/campaigns' },
      { label: 'Tạo chiến dịch mới', to: '/admin/campaigns/new' },
    ] },
    { label: 'Hồ sơ đăng ký', to: '/admin/applications', icon: FileCheck2, children: [
      { label: 'Chờ xét duyệt', to: '/admin/applications?status=pending' },
      { label: 'Yêu cầu bổ sung', to: '/admin/applications?status=supplement' },
      { label: 'Đã duyệt', to: '/admin/applications?status=approved' },
      { label: 'Từ chối', to: '/admin/applications?status=rejected' },
    ] },
    { label: 'Duyệt minh chứng', to: '/admin/evidence', icon: ClipboardCheck },
  ] },
  { label: 'Quản trị chương trình', items: [
    { label: 'Cấu hình tiêu chuẩn', to: '/admin/standards', icon: BookOpenCheck, adminOnly: true },
    { label: 'Danh hiệu tập thể', to: '/admin/collectives', icon: Medal },
    { label: 'Báo cáo & Thống kê', to: '/admin/reports', icon: BarChart3 },
  ] },
  { label: 'Hệ thống', items: [
    { label: 'Người dùng & Phân quyền', to: '/admin/roles', icon: UserCog, adminOnly: true },
    { label: 'Cài đặt hệ thống', to: '/admin/settings', icon: Settings },
  ] },
];

const pageTitles: Record<string, string> = {
  '/admin': 'Tổng quan', '/admin/campaigns': 'Chiến dịch',
  '/admin/campaigns/new': 'Tạo chiến dịch mới', '/admin/applications': 'Hồ sơ đăng ký',
  '/admin/evidence': 'Duyệt minh chứng', '/admin/standards': 'Cấu hình tiêu chuẩn',
  '/admin/collectives': 'Danh hiệu tập thể', '/admin/reports': 'Báo cáo & Thống kê',
  '/admin/roles': 'Người dùng & Phân quyền', '/admin/settings': 'Cài đặt hệ thống',
  '/admin/account': 'Thông tin tài khoản', '/admin/change-password': 'Đổi mật khẩu',
};

function roleLabel(role?: string): string {
  return normalizeRole(role) === 'Admin' ? 'Quản trị viên' : 'Cán bộ xét duyệt';
}

export function AdminLayout({ user, onLogout }: AdminLayoutProps) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const displayName = user.name || user.email.split('@')[0];
  const title = pageTitles[location.pathname] ?? 'Quản trị SV5T';
  const visibleGroups = useMemo(() => menuGroups.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.adminOnly || isAdmin(user)),
  })), [user]);

  useEffect(() => {
    setMobileOpen(false); setNotificationOpen(false); setAccountOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [mobileOpen]);

  useEffect(() => {
    if (!notificationOpen && !accountOpen) return;
    const close = (event: PointerEvent) => {
      if (!popoverRef.current?.contains(event.target as Node)) {
        setNotificationOpen(false); setAccountOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setNotificationOpen(false); setAccountOpen(false); }
    };
    document.addEventListener('pointerdown', close);
    window.addEventListener('keydown', closeOnEscape);
    return () => { document.removeEventListener('pointerdown', close); window.removeEventListener('keydown', closeOnEscape); };
  }, [accountOpen, notificationOpen]);

  return (
    <div className={`admin-shell [--admin-header:72px] [--admin-side:264px] [--admin-blue:#1683f7] [--admin-navy:#294f6b] [--admin-text:#496a80] [--admin-muted:#7b94a5] [--admin-line:#dcecf5] min-h-dvh text-[var(--admin-text)] bg-[#f5fafc] [font-family:'Be_Vietnam_Pro',ui-sans-serif,system-ui,sans-serif] [&_button]:[font:inherit] [&_input]:[font:inherit] [&_select]:[font:inherit] [&_:focus-visible]:outline-[length:3px] [&_:focus-visible]:outline-solid [&_:focus-visible]:outline-[color:rgba(22,131,247,.28)] [&_:focus-visible]:outline-offset-[2px] max-[900px]:[--admin-side:272px] max-[900px]:[--admin-header:66px]${collapsed ? ` [&_.admin-header]:grid-cols-[82px_minmax(220px,1fr)_auto] [&_.admin-sidebar]:w-[82px] [&_.admin-header__brand]:justify-center [&_.admin-header__brand]:p-0 [&_.admin-header__brand_.brand-logo__copy]:hidden [&_.admin-sidebar__intro>div]:hidden [&_.admin-nav-group_h2]:hidden [&_.admin-nav-entry>a_span]:hidden [&_.admin-nav-chevron]:hidden [&_.admin-subnav]:hidden [&_.admin-collapse_span]:hidden [&_.admin-sidebar__intro]:mx-[12px] [&_.admin-sidebar__intro]:p-[10px] [&_.admin-sidebar__intro]:justify-center [&_.admin-nav-entry>a]:grid-cols-[1fr] [&_.admin-nav-entry>a]:justify-items-center [&_.admin-nav-entry>a]:p-[8px] [&_.admin-collapse]:p-0 [&_.admin-main]:ml-[82px] max-[900px]:[&_.admin-sidebar]:w-[var(--admin-side)] max-[900px]:[&_.admin-sidebar]:transform-[translateX(-102%)] max-[900px]:[&_.admin-sidebar]:shadow-[18px_0_55px_rgba(28,71,96,.2)] max-[900px]:[&_.admin-main]:ml-0 max-[900px]:[&_.admin-main]:p-[calc(var(--admin-header)_+_22px)_20px_38px] max-[900px]:[&_.admin-sidebar__intro>div]:inline max-[900px]:[&_.admin-nav-group_h2]:inline max-[900px]:[&_.admin-nav-entry>a_span]:inline max-[900px]:[&_.admin-nav-chevron]:inline max-[900px]:[&_.admin-collapse_span]:inline max-[900px]:[&_.admin-nav-entry>a]:grid-cols-[21px_minmax(0,1fr)_auto] max-[900px]:[&_.admin-nav-entry>a]:justify-items-[initial] max-[900px]:[&_.admin-subnav]:grid max-[650px]:[&_.admin-main]:px-[13px]` : ''}${mobileOpen ? ` max-[900px]:[&_.admin-sidebar]:transform-none max-[900px]:[&_.admin-drawer-scrim]:opacity-100 max-[900px]:[&_.admin-drawer-scrim]:pointer-events-auto` : ''}`}>
      <a className={`fixed z-[300] top-[-60px] left-[20px] p-[11px_15px] text-white rounded-[10px] bg-[var(--admin-blue)] transition-[top] duration-[.2s] ease-[ease] focus:top-[10px]`} href="#admin-main">Chuyển đến nội dung chính</a>
      <header className={`admin-header fixed z-[100] inset-[0_0_auto] h-[var(--admin-header)] grid grid-cols-[var(--admin-side)_minmax(220px,1fr)_auto] items-center border-b border-b-[rgba(204,228,241,.92)] bg-[rgba(252,254,255,.94)] shadow-[0_10px_32px_rgba(41,93,123,.06)] backdrop-blur-[18px] transition-[grid-template-columns] duration-[.25s] ease-[ease] max-[900px]:grid-cols-[auto_1fr_auto] print:!hidden`}>
        <div className={`admin-header__brand h-full p-[0_21px] flex items-center border-r border-r-[var(--admin-line)] [&_.brand-logo__mark]:w-[42px] [&_.brand-logo__mark]:h-[42px] [&_.brand-logo__copy_strong]:text-[var(--admin-navy)] [&_.brand-logo__copy_strong]:text-[13px] [&_.brand-logo__copy_small]:text-[6.5px] max-[900px]:px-[12px] max-[900px]:border-r-0 max-[900px]:[&_.brand-logo__copy]:hidden max-[900px]:[&_.brand-logo__mark]:w-[39px] max-[900px]:[&_.brand-logo__mark]:h-[39px] max-[430px]:[&_.brand-logo]:hidden`}>
          <button type="button" className={`w-[40px] h-[40px] p-0 grid place-items-center text-[#607e92] border border-[#dceaf2] rounded-[13px] bg-white cursor-pointer max-[650px]:w-[37px] max-[650px]:h-[37px] hidden max-[900px]:grid max-[900px]:mr-[8px]`} aria-label={mobileOpen ? 'Đóng menu' : 'Mở menu'} aria-expanded={mobileOpen} onClick={() => setMobileOpen((open) => !open)}>
            {mobileOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
          <Link to="/admin" className="cursor-pointer transition-opacity hover:opacity-90 flex items-center" aria-label="Về trang quản trị">
            <BrandLogo />
          </Link>
        </div>
        <div className={`min-w-0 px-[27px] grid gap-[2px] [&_span]:text-[#8aa0af] [&_span]:text-[8px] [&_span]:font-bold [&_span]:tracking-[1px] [&_span]:uppercase [&_strong]:overflow-hidden [&_strong]:text-[var(--admin-navy)] [&_strong]:text-[15px] [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap max-[900px]:px-[8px] max-[650px]:[&_span]:hidden max-[650px]:[&_strong]:text-[12px]`}><span>Không gian quản trị</span><strong>{title}</strong></div>
        <div className={`relative h-full pr-[22px] flex items-center gap-[9px] max-[900px]:pr-[11px] max-[650px]:gap-[3px]`} ref={popoverRef}>
          <label className={`h-[44px] p-[5px_10px_5px_13px] grid grid-cols-[auto_minmax(0,1fr)] items-center gap-[9px] border border-[var(--admin-line)] rounded-[14px] bg-[#f8fcfe] [&>span]:text-[#91a5b2] [&>span]:text-[8px] [&>span]:font-bold [&>span]:uppercase [&_select]:max-w-[150px] [&_select]:text-[#3b6079] [&_select]:border-0 [&_select]:outline-none [&_select]:bg-transparent [&_select]:text-[11px] [&_select]:font-bold max-[900px]:hidden`}><span>Chiến dịch</span><select aria-label="Chiến dịch đang thao tác" defaultValue="2025-2026"><option value="2025-2026">SV5T 2025–2026</option><option value="2024-2025">SV5T 2024–2025</option></select></label>
          <div className={`relative`}>
            <button type="button" className={`w-[40px] h-[40px] p-0 grid place-items-center text-[#607e92] border border-[#dceaf2] rounded-[13px] bg-white cursor-pointer max-[650px]:w-[37px] max-[650px]:h-[37px] relative [&>span]:absolute [&>span]:top-[-5px] [&>span]:right-[-4px] [&>span]:min-w-[17px] [&>span]:h-[17px] [&>span]:px-[4px] [&>span]:grid [&>span]:place-items-center [&>span]:text-white [&>span]:border-[length:2px] [&>span]:border-solid [&>span]:border-[#fff] [&>span]:rounded-full [&>span]:bg-[#f15d73] [&>span]:text-[7px] [&>span]:font-extrabold`} aria-label="3 thông báo mới" aria-expanded={notificationOpen} onClick={() => { setNotificationOpen((open) => !open); setAccountOpen(false); }}><Bell size={20} /><span>3</span></button>
            {notificationOpen && <section className={`admin-popover absolute z-[150] top-[calc(100%_+_13px)] right-[0] w-[310px] p-[10px] grid border border-[#d9eaf3] rounded-[20px_9px_20px_9px] bg-white shadow-[0_24px_60px_rgba(36,80,107,.18)] max-[650px]:fixed max-[650px]:top-[73px] max-[650px]:right-[10px] max-[650px]:left-[10px] max-[650px]:w-auto [&>button]:p-[11px_9px] [&>button]:flex [&>button]:items-center [&>button]:gap-[10px] [&>button]:text-[#537286] [&>button]:border-0 [&>button]:border-t [&>button]:border-t-[#edf3f6] [&>button]:bg-white [&>button]:text-left [&>button]:cursor-pointer [&>button>svg]:text-[var(--admin-blue)] [&>button>span]:grid [&>button>span]:gap-[2px] [&>button_strong]:text-[#41647a] [&>button_strong]:text-[10px] [&>button_small]:text-[#91a3ae] [&>button_small]:text-[8px] [&>a]:p-[10px] [&>a]:text-[#147ce1] [&>a]:text-center [&>a]:text-[9px] [&>a]:font-bold`} aria-label="Thông báo mới">
              <div className={`p-[7px_8px_12px] flex items-center justify-between [&_strong]:text-[var(--admin-navy)] [&_strong]:text-[13px] [&_span]:p-[4px_7px] [&_span]:text-[#147ce1] [&_span]:rounded-full [&_span]:bg-[#eaf5ff] [&_span]:text-[8px] [&_span]:font-extrabold`}><strong>Thông báo</strong><span>3 mới</span></div>
              <button type="button"><FilePlus2 size={17} /><span><strong>12 hồ sơ vừa được nộp</strong><small>5 phút trước</small></span></button>
              <button type="button"><ShieldCheck size={17} /><span><strong>Minh chứng cần duyệt gấp</strong><small>Hạn xử lý còn 2 ngày</small></span></button>
              <NavLink to="/admin/applications">Xem tất cả thông báo</NavLink>
            </section>}
          </div>
          <div className={`relative`}>
            <button type="button" className={`h-[48px] p-[3px_8px_3px_4px] flex items-center gap-[9px] text-[var(--admin-text)] border-0 rounded-[15px] bg-transparent cursor-pointer hover:bg-[#f2f8fb] max-[900px]:[&>svg]:hidden max-[650px]:p-[2px]`} aria-haspopup="menu" aria-expanded={accountOpen} onClick={() => { setAccountOpen((open) => !open); setNotificationOpen(false); }}>
              <span className={`w-[38px] h-[38px] grid place-items-center overflow-hidden text-white rounded-[13px_6px_13px_6px] bg-[linear-gradient(145deg,#58d0f5,#147ee9)] [&_img]:w-full [&_img]:h-full [&_img]:object-cover max-[650px]:w-[36px] max-[650px]:h-[36px]`}>{user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : <UserRound size={20} />}</span>
              <span className={`max-w-[130px] grid text-left [&_strong]:overflow-hidden [&_strong]:text-ellipsis [&_strong]:whitespace-nowrap [&_small]:overflow-hidden [&_small]:text-ellipsis [&_small]:whitespace-nowrap [&_strong]:text-[var(--admin-navy)] [&_strong]:text-[10.5px] [&_small]:text-[#8097a6] [&_small]:text-[8px] max-[900px]:hidden`}><strong>{displayName}</strong><small>{roleLabel(user.role)}</small></span><ChevronDown size={15} />
            </button>
            {accountOpen && <div className={`admin-popover absolute z-[150] top-[calc(100%_+_13px)] right-[0] w-[310px] p-[10px] grid border border-[#d9eaf3] rounded-[20px_9px_20px_9px] bg-white shadow-[0_24px_60px_rgba(36,80,107,.18)] max-[650px]:fixed max-[650px]:top-[73px] max-[650px]:right-[10px] max-[650px]:left-[10px] max-[650px]:w-auto w-[250px] [&>div]:p-[8px_9px_12px] [&>div]:grid [&>div]:gap-[3px] [&>div]:border-b [&>div]:border-b-[#edf3f6] [&>div_strong]:text-[var(--admin-navy)] [&>div_strong]:text-[11px] [&>div_small]:overflow-hidden [&>div_small]:text-[#8498a5] [&>div_small]:text-[8.5px] [&>div_small]:text-ellipsis [&>a]:p-[11px_9px] [&>a]:flex [&>a]:items-center [&>a]:gap-[9px] [&>a]:text-[#4e6d80] [&>a]:border-0 [&>a]:rounded-[9px] [&>a]:bg-white [&>a]:text-[10px] [&>a]:text-left [&>a]:cursor-pointer [&>button]:p-[11px_9px] [&>button]:flex [&>button]:items-center [&>button]:gap-[9px] [&>button]:text-[#4e6d80] [&>button]:border-0 [&>button]:rounded-[9px] [&>button]:bg-white [&>button]:text-[10px] [&>button]:text-left [&>button]:cursor-pointer [&>a:hover]:bg-[#f1f8fc] [&>button]:text-[#b34f63] [&>button]:border-t [&>button]:border-t-[#edf3f6]`} role="menu">
              <div><strong>{displayName}</strong><small>{user.email}</small></div>
              <NavLink to="/admin/account" role="menuitem"><UserRound size={16} />Thông tin tài khoản</NavLink>
              <NavLink to="/admin/change-password" role="menuitem"><ShieldCheck size={16} />Đổi mật khẩu</NavLink>
              <button type="button" role="menuitem" onClick={onLogout}><LogOut size={16} />Đăng xuất</button>
            </div>}
          </div>
        </div>
      </header>

      <button type="button" className={`admin-drawer-scrim hidden max-[900px]:fixed max-[900px]:z-[70] max-[900px]:inset-[var(--admin-header)_0_0] max-[900px]:block max-[900px]:border-0 max-[900px]:bg-[rgba(21,50,68,.38)] max-[900px]:opacity-0 max-[900px]:pointer-events-none max-[900px]:backdrop-blur-[2px] max-[900px]:transition-[opacity] max-[900px]:duration-[.2s] max-[900px]:ease-[ease] print:!hidden`} aria-label="Đóng menu" tabIndex={mobileOpen ? 0 : -1} onClick={() => setMobileOpen(false)} />
      <aside className={`admin-sidebar fixed z-[80] top-[var(--admin-header)] bottom-[0] left-[0] w-[var(--admin-side)] flex flex-col border-r border-r-[rgba(210,232,243,.92)] bg-[linear-gradient(180deg,#fbfeff,#f4fafc)] shadow-[10px_0_36px_rgba(48,99,126,.04)] transition-[width,transform] duration-[.25s,.25s] ease-[ease,ease] [&>nav]:flex-1 [&>nav]:overflow-y-auto [&>nav]:p-[3px_12px_16px] max-[900px]:w-[var(--admin-side)] max-[900px]:transform-[translateX(-102%)] max-[900px]:shadow-[18px_0_55px_rgba(28,71,96,.2)] print:!hidden`} aria-label="Điều hướng quản trị">
        <div className={`admin-sidebar__intro m-[17px_15px_10px] p-[13px] flex items-center gap-[10px] border border-[#dbeef6] rounded-[18px_8px_18px_8px] bg-[linear-gradient(135deg,#eefdff,#f3f8ff)] [&>div]:min-w-0 [&>div]:grid [&>div]:gap-[2px] [&_strong]:text-[var(--admin-navy)] [&_strong]:text-[10.5px] [&_small]:text-[#7e97a6] [&_small]:text-[7.5px]`}><span className={`flex-[0_0_37px] h-[37px] grid place-items-center text-white rounded-[12px_5px_12px_5px] bg-[linear-gradient(145deg,#25bde8,#167fe9)]`}><UsersRound size={20} /></span><div><strong>SV5T Admin</strong><small>{roleLabel(user.role)}</small></div></div>
        <nav>
          {visibleGroups.map((group) => <section key={group.label} className={`admin-nav-group mt-[15px] [&_h2]:m-[0_10px_7px] [&_h2]:text-[#9aabb5] [&_h2]:text-[7.5px] [&_h2]:font-extrabold [&_h2]:tracking-[1.1px] [&_h2]:uppercase`}>
            <h2>{group.label}</h2>
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = item.to === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(item.to);
              return <div key={item.to} className={`admin-nav-entry [&>a]:min-h-[42px] [&>a]:p-[8px_10px] [&>a]:grid [&>a]:grid-cols-[21px_minmax(0,1fr)_auto] [&>a]:items-center [&>a]:gap-[9px] [&>a]:text-[#5a7688] [&>a]:border [&>a]:border-[transparent] [&>a]:rounded-[13px_6px_13px_6px] [&>a]:text-[9.5px] [&>a]:font-semibold [&>a]:transition-[color,background-color,border-color,box-shadow] [&>a]:duration-[.18s] [&>a]:ease-[ease] [&>a:hover]:text-[#247bb8] [&>a:hover]:bg-[#eff8fd] [&.is-active>a]:text-white [&.is-active>a]:border-[transparent] [&.is-active>a]:bg-[linear-gradient(115deg,#20a9e8,#1779e3)] [&.is-active>a]:shadow-[0_9px_22px_rgba(23,121,227,.19)] [&.is-active>a_svg]:stroke-[length:2.2] [&.is-active_.admin-nav-chevron]:transform-[rotate(180deg)]${active ? ' is-active' : ''}`}>
                <NavLink to={item.to} end={item.to === '/admin'} title={collapsed ? item.label : undefined}><Icon size={19} strokeWidth={1.9} /><span>{item.label}</span>{item.children && <ChevronDown className={`admin-nav-chevron transition-[transform] duration-[.2s] ease-[ease]`} size={14} />}</NavLink>
                {item.children && active && <div className={`admin-subnav m-[4px_0_6px_20px] pl-[18px] grid border-l border-l-[#cfe5f1] [&>a]:p-[6px_5px] [&>a]:text-[#7c95a3] [&>a]:text-[8.5px] [&>a:hover]:text-[#177dd7] [&>a:hover]:font-bold [&>a.active]:text-[#177dd7] [&>a.active]:font-bold`}>{item.children.map((child) => <NavLink key={child.to} to={child.to} className={location.pathname + location.search === child.to ? 'active' : undefined}>{child.label}</NavLink>)}</div>}
              </div>;
            })}
          </section>)}
        </nav>
        <button type="button" className={`admin-collapse min-h-[47px] m-[8px_12px_14px] p-[0_12px] flex items-center justify-center gap-[8px] text-[#6e8999] border border-[var(--admin-line)] rounded-[13px_6px_13px_6px] bg-white cursor-pointer text-[9px] font-bold max-[900px]:hidden`} onClick={() => setCollapsed((value) => !value)}>{collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}<span>{collapsed ? 'Mở rộng' : 'Thu gọn menu'}</span></button>
      </aside>

      <main id="admin-main" className={`admin-main min-h-dvh ml-[var(--admin-side)] p-[calc(var(--admin-header)_+_27px)_28px_44px] transition-[margin-left] duration-[.25s] ease-[ease] max-[900px]:ml-0 max-[900px]:p-[calc(var(--admin-header)_+_22px)_20px_38px] max-[650px]:px-[13px] print:!m-0 print:!p-[15px]`} tabIndex={-1}><Outlet /></main>
      <SiteFooter className={`${collapsed ? 'ml-[82px]' : 'ml-[var(--admin-side)]'} transition-[margin-left] duration-[.25s] max-[900px]:!ml-0 print:hidden`} />
    </div>
  );
}
