import { useEffect, useRef, useState, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Menu, MessageCircle, Search, Settings, UserRound, X } from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';

interface DashboardHeaderProps {
  displayName: string;
  role: string;
  avatarUrl?: string | null;
  notificationCount: number;
  launcherOpen: boolean;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
  onToggleLauncher: () => void;
  onOpenLauncher: () => void;
  onLogout: () => void;
}

export function DashboardHeader({
  displayName,
  role,
  avatarUrl,
  notificationCount,
  launcherOpen,
  menuButtonRef,
  onToggleLauncher,
  onOpenLauncher,
  onLogout,
}: DashboardHeaderProps) {
  const [accountOpen, setAccountOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!accountOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) setAccountOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAccountOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [accountOpen]);

  return (
    <header className="sticky top-0 z-40 h-16 sm:h-18 bg-white/90 backdrop-blur-md border-b border-slate-200/90 shadow-sm transition-shadow">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Left Side: Menu Trigger + Logo */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            ref={menuButtonRef}
            type="button"
            className="w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-blue-600 flex items-center justify-center transition-colors shadow-sm cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
            aria-label="Mở danh sách chức năng"
            aria-expanded={launcherOpen}
            onClick={onToggleLauncher}
          >
            {launcherOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link
            to="/dashboard"
            className="cursor-pointer transition-opacity hover:opacity-90 flex items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 rounded-lg"
            aria-label="Về trang tổng quan"
          >
            <BrandLogo />
          </Link>
        </div>

        {/* Center: Search Launcher Trigger */}
        <button
          type="button"
          onClick={onOpenLauncher}
          className="hidden md:flex items-center w-72 lg:w-96 h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100/80 hover:border-slate-300 text-slate-400 hover:text-slate-600 text-xs transition-colors shadow-sm cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-slate-400" />
            <span>Tìm chức năng, tin tức...</span>
          </div>
        </button>

        {/* Right Side: Quick Actions & Profile Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Notifications */}
          <button
            type="button"
            className="relative w-10 h-10 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
            aria-label={`${notificationCount} thông báo mới`}
          >
            <Bell className="w-4.5 h-4.5" />
            {notificationCount > 0 && (
              <span className="absolute top-2 right-2 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-semibold flex items-center justify-center border-2 border-white">
                {notificationCount}
              </span>
            )}
          </button>

          {/* Quick Support / Message (Desktop) */}
          <button
            type="button"
            className="hidden sm:flex w-10 h-10 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-700 items-center justify-center transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
            aria-label="Tin nhắn"
          >
            <MessageCircle className="w-4.5 h-4.5" />
          </button>

          {/* Settings (Desktop) */}
          <button
            type="button"
            className="hidden sm:flex w-10 h-10 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-700 items-center justify-center transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
            aria-label="Cài đặt"
          >
            <Settings className="w-4.5 h-4.5" />
          </button>

          <div className="w-px h-6 bg-slate-200 mx-1 hidden sm:block" />

          {/* User Profile Dropdown */}
          <div className="relative" ref={accountMenuRef}>
            <button
              type="button"
              className="flex items-center gap-2.5 p-1 sm:p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
              aria-label="Mở menu tài khoản"
              aria-haspopup="menu"
              aria-expanded={accountOpen}
              aria-controls="dashboard-account-menu"
              onClick={() => setAccountOpen((open) => !open)}
            >
              <div className="w-9 h-9 rounded-full overflow-hidden bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-medium text-xs flex-shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <UserRound className="w-4.5 h-4.5" />
                )}
              </div>
              <div className="hidden sm:grid text-left gap-0.5 max-w-[140px]">
                <strong className="text-xs font-semibold text-slate-900 truncate">{displayName}</strong>
                <span className="text-[11px] font-medium text-slate-500 truncate">{role}</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${accountOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {accountOpen && (
              <div
                id="dashboard-account-menu"
                className="absolute right-0 top-full mt-2 w-64 p-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                role="menu"
                aria-label="Tùy chọn tài khoản"
              >
                <div className="p-3 border-b border-slate-100 mb-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">{displayName}</p>
                  <p className="text-xs text-slate-500 truncate">{role}</p>
                </div>

                <Link
                  to="/dashboard/profile"
                  role="menuitem"
                  onClick={() => setAccountOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors text-xs font-medium"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <UserRound className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Chỉnh sửa hồ sơ</p>
                    <p className="text-[11px] text-slate-400 font-normal">Cập nhật thông tin cá nhân</p>
                  </div>
                </Link>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setAccountOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-rose-50 text-rose-600 transition-colors text-xs font-medium cursor-pointer mt-1"
                >
                  <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
                    <LogOut className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-rose-700">Đăng xuất</p>
                    <p className="text-[11px] text-rose-400 font-normal">Kết thúc phiên làm việc</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
