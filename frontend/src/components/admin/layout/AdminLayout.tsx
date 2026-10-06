import { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import type { User } from '../../../features/auth/types/auth.types';
import { getVisibleMenuGroups } from './adminNavConfig';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminChatPopover } from './AdminChatPopover';
import { AdminUserMenu } from './AdminUserMenu';
import { useChatRealtime } from '../../../features/chat/hooks/useChatRealtime';
import { AlertCircle, X } from 'lucide-react';
import '../../../pages/admin/AdminDashboard.css';

interface AdminLayoutProps {
  user: User;
  onLogout: () => void;
}

export function AdminLayout({ user, onLogout }: AdminLayoutProps) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [accessNotice, setAccessNotice] = useState<string | null>(null);

  useEffect(() => {
    const state = location.state as { accessDeniedMessage?: string } | null;
    if (state?.accessDeniedMessage) {
      setAccessNotice(state.accessDeniedMessage);
      window.history.replaceState({}, '');
      const timer = setTimeout(() => setAccessNotice(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  useChatRealtime();

  const popoverRef = useRef<HTMLDivElement>(null);
  const displayName = user.name || user.email.split('@')[0];
  const visibleGroups = useMemo(() => getVisibleMenuGroups(user), [user]);

  // Đóng tất cả popovers khi chuyển route
  useEffect(() => {
    setMobileOpen(false);
    setChatOpen(false);
    setAccountOpen(false);
  }, [location.pathname, location.search]);

  // Khóa scroll body khi mở mobile drawer
  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  // Xử lý đóng popovers khi click bên ngoài hoặc bấm phím Escape
  useEffect(() => {
    if (!chatOpen && !accountOpen) return;

    const close = (event: PointerEvent) => {
      if (!popoverRef.current?.contains(event.target as Node)) {
        setChatOpen(false);
        setAccountOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setChatOpen(false);
        setAccountOpen(false);
      }
    };

    document.addEventListener('pointerdown', close);
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [chatOpen, accountOpen]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-700 flex flex-col font-['Be_Vietnam_Pro',sans-serif]">
      {/* Skip Link for Accessibility */}
      <a
        href="#admin-main"
        className="fixed z-[300] -top-16 left-5 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 rounded-xl shadow-lg transition-[top] focus:top-4"
      >
        Chuyển đến nội dung chính
      </a>

      {/* Top Header — full width trên cùng */}
      <AdminHeader
        user={user}
        displayName={displayName}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenMobile={() => setMobileOpen(true)}
        collapsed={collapsed}
        chatOpen={chatOpen}
        onToggleChat={() => {
          setChatOpen((prev) => !prev);
          setAccountOpen(false);
        }}
        onNotificationOpen={() => {
          setChatOpen(false);
          setAccountOpen(false);
        }}
        accountOpen={accountOpen}
        onToggleAccount={() => {
          setAccountOpen((prev) => !prev);
          setChatOpen(false);
        }}
        popoverRef={popoverRef}
      >
        {/* Chat Popover */}
        {chatOpen && (
          <AdminChatPopover onClose={() => setChatOpen(false)} />
        )}

        {/* User Profile Menu */}
        {accountOpen && (
          <AdminUserMenu
            user={user}
            displayName={displayName}
            onLogout={onLogout}
            onClose={() => setAccountOpen(false)}
          />
        )}
      </AdminHeader>

      {/* Body: Sidebar + Main nằm dưới header */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Mobile Backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
            aria-hidden="true"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Left Sidebar (đẩy xuống dưới header) */}
        <AdminSidebar
          groups={visibleGroups}
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onToggleCollapse={() => setCollapsed((prev) => !prev)}
          onCloseMobile={() => setMobileOpen(false)}
        />

        {/* Main Content Viewport */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <main
            id="admin-main"
            className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto outline-none"
            tabIndex={-1}
          >
            {accessNotice && (
              <div
                role="alert"
                aria-live="polite"
                className="mb-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200"
              >
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-xs sm:text-sm font-medium">{accessNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAccessNotice(null)}
                  className="p-1 text-amber-600 hover:text-amber-800 rounded hover:bg-amber-100/60 cursor-pointer transition-colors"
                  aria-label="Đóng thông báo"
                >
                  <X size={14} />
                </button>
              </div>
            )}
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
