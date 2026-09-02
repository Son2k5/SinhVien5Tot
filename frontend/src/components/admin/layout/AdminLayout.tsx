import { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import type { User } from '../../../types/auth';
import { getVisibleMenuGroups } from './adminNavConfig';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { AdminChatPopover } from './AdminChatPopover';
import { AdminNotificationPopover } from './AdminNotificationPopover';
import { AdminUserMenu } from './AdminUserMenu';
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
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const popoverRef = useRef<HTMLDivElement>(null);
  const displayName = user.name || user.email.split('@')[0];
  const visibleGroups = useMemo(() => getVisibleMenuGroups(user), [user]);

  // Đóng tất cả popovers khi chuyển route
  useEffect(() => {
    setMobileOpen(false);
    setChatOpen(false);
    setNotificationOpen(false);
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
    if (!chatOpen && !notificationOpen && !accountOpen) return;

    const close = (event: PointerEvent) => {
      if (!popoverRef.current?.contains(event.target as Node)) {
        setChatOpen(false);
        setNotificationOpen(false);
        setAccountOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setChatOpen(false);
        setNotificationOpen(false);
        setAccountOpen(false);
      }
    };

    document.addEventListener('pointerdown', close);
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [chatOpen, accountOpen, notificationOpen]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-700 flex font-['Be_Vietnam_Pro',sans-serif]">
      {/* Skip Link for Accessibility */}
      <a
        href="#admin-main"
        className="fixed z-[300] -top-16 left-5 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 rounded-xl shadow-lg transition-all focus:top-4"
      >
        Chuyển đến nội dung chính
      </a>

      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
          aria-hidden="true"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <AdminSidebar
        groups={visibleGroups}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapse={() => setCollapsed((prev) => !prev)}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main Page Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <AdminHeader
          user={user}
          displayName={displayName}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onOpenMobile={() => setMobileOpen(true)}
          chatOpen={chatOpen}
          onToggleChat={() => {
            setChatOpen((prev) => !prev);
            setNotificationOpen(false);
            setAccountOpen(false);
          }}
          notificationOpen={notificationOpen}
          onToggleNotification={() => {
            setNotificationOpen((prev) => !prev);
            setChatOpen(false);
            setAccountOpen(false);
          }}
          accountOpen={accountOpen}
          onToggleAccount={() => {
            setAccountOpen((prev) => !prev);
            setChatOpen(false);
            setNotificationOpen(false);
          }}
          popoverRef={popoverRef}
        >
          {/* Chat Popover */}
          {chatOpen && (
            <AdminChatPopover onClose={() => setChatOpen(false)} />
          )}

          {/* Notifications Popover */}
          {notificationOpen && (
            <AdminNotificationPopover onClose={() => setNotificationOpen(false)} />
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

        {/* Main Content Viewport */}
        <main
          id="admin-main"
          className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto outline-none overflow-y-auto"
          tabIndex={-1}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
