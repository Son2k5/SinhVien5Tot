import { type RefObject } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  ChevronDown,
  Menu,
  MessageSquareText,
  Search,
} from 'lucide-react';
import type { User } from '../../../types/auth';
import { roleLabel } from './adminNavConfig';

interface AdminHeaderProps {
  user: User;
  displayName: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onOpenMobile: () => void;
  chatOpen: boolean;
  onToggleChat: () => void;
  notificationOpen: boolean;
  onToggleNotification: () => void;
  accountOpen: boolean;
  onToggleAccount: () => void;
  popoverRef: RefObject<HTMLDivElement | null>;
  children?: React.ReactNode;
}

export function AdminHeader({
  user,
  displayName,
  searchQuery,
  onSearchChange,
  onOpenMobile,
  chatOpen,
  onToggleChat,
  notificationOpen,
  onToggleNotification,
  accountOpen,
  onToggleAccount,
  popoverRef,
  children,
}: AdminHeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Lấy chữ cái đầu tiên cho avatar fallback
  const initial = displayName.trim().charAt(0).toUpperCase() || 'U';
  const showBackButton = location.pathname !== '/admin';

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4 flex-shrink-0 transition-shadow duration-200 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
      {/* Left: Mobile Drawer Trigger + Back Button + Search Bar */}
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        {/* Mobile Drawer Trigger (Hidden on Desktop) */}
        <button
          type="button"
          onClick={onOpenMobile}
          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50/80 rounded-xl lg:hidden cursor-pointer transition-all active:scale-95 flex-shrink-0"
          aria-label="Mở menu điều hướng"
        >
          <Menu size={20} />
        </button>

        {/* Back Button on Header */}
        {showBackButton && (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 bg-slate-100/80 hover:bg-blue-50/80 border border-slate-200/80 rounded-xl transition-all cursor-pointer flex-shrink-0 active:scale-95 shadow-2xs"
            title="Quay lại trang trước"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Quay lại</span>
          </button>
        )}

        {/* Search Bar */}
        <div className="relative flex-1 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            size={15}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm hồ sơ, sinh viên, tiêu chuẩn..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50/80 hover:bg-slate-100/70 focus:bg-white border border-slate-200/90 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* Right: Actions (Chat, Notifications, User Profile) */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0" ref={popoverRef}>
        {/* 1. Chat with User Button */}
        <div className="relative">
          <button
            type="button"
            onClick={onToggleChat}
            className={`relative p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center active:scale-95 ${
              chatOpen
                ? 'bg-blue-50 text-blue-600 ring-2 ring-blue-100'
                : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100/80'
            }`}
            aria-label="Tin nhắn & Trò chuyện với sinh viên"
            title="Tin nhắn & Hỗ trợ sinh viên"
            aria-expanded={chatOpen}
          >
            <MessageSquareText size={19} />
            <span className="absolute top-1 right-1 min-w-[15px] h-[15px] px-1 grid place-items-center text-white bg-blue-600 text-[9px] font-extrabold rounded-full ring-2 ring-white animate-pulse">
              2
            </span>
          </button>
        </div>

        {/* 2. Notification Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={onToggleNotification}
            className={`relative p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center active:scale-95 ${
              notificationOpen
                ? 'bg-blue-50 text-blue-600 ring-2 ring-blue-100'
                : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100/80'
            }`}
            aria-label="Thông báo hệ thống"
            title="Thông báo hệ thống"
            aria-expanded={notificationOpen}
          >
            <Bell size={19} />
            <span className="absolute top-1 right-1 min-w-[15px] h-[15px] px-1 grid place-items-center text-white bg-rose-500 text-[9px] font-extrabold rounded-full ring-2 ring-white">
              3
            </span>
          </button>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200/90 mx-0.5 sm:mx-1 hidden xs:block" />

        {/* 3. User Avatar & Display Name Button */}
        <div className="relative">
          <button
            type="button"
            onClick={onToggleAccount}
            className={`flex items-center gap-2.5 p-1 sm:pr-2.5 rounded-xl transition-all cursor-pointer active:scale-98 select-none ${
              accountOpen
                ? 'bg-slate-100 ring-2 ring-blue-100'
                : 'hover:bg-slate-100/80'
            }`}
            aria-label="Menu tài khoản"
            aria-expanded={accountOpen}
          >
            {/* User Avatar */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 text-white font-bold text-xs flex items-center justify-center shadow-xs ring-2 ring-white flex-shrink-0">
              {initial}
            </div>

            {/* Name and Role (Desktop) */}
            <div className="hidden md:flex flex-col text-left min-w-0">
              <span className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px] lg:max-w-[150px]">
                {displayName}
              </span>
              <span className="text-[10px] font-medium text-slate-400 leading-tight truncate">
                {roleLabel(user.role)}
              </span>
            </div>

            {/* Chevron Icon */}
            <ChevronDown
              size={14}
              className={`text-slate-400 hidden sm:block transition-transform duration-200 ${
                accountOpen ? 'rotate-180 text-blue-600' : ''
              }`}
            />
          </button>
        </div>

        {/* Popovers Container (Chat, Notifications, User Menu) */}
        {children}
      </div>
    </header>
  );
}
