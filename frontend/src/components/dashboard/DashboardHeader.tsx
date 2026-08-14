import { useEffect, useRef, useState, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bell, ChevronDown, LogOut, Menu, MessageCircle, Search, Settings, UserRound, X } from 'lucide-react';
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
    <header className='sv2-header'>
      <div className='sv2-header__inner'>
        <button
          ref={menuButtonRef}
          type='button'
          className='sv2-icon-button sv2-menu-button'
          aria-label='Mở danh sách chức năng'
          aria-expanded={launcherOpen}
          onClick={onToggleLauncher}
        >
          {launcherOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
        <BrandLogo />
        <button type='button' className='sv2-header__search' onClick={onOpenLauncher}>
          <Search size={17} />
          <span>Tìm chức năng, tin tức...</span>
          <ArrowRight size={15} />
        </button>
        <div className='sv2-header__actions'>
          <button type='button' className='sv2-icon-button sv2-notification-button' aria-label={notificationCount + ' thông báo mới'}>
            <Bell size={20} />
            {notificationCount > 0 && <span>{notificationCount}</span>}
          </button>
          <button type='button' className='sv2-icon-button sv2-message-button' aria-label='Tin nhắn'><MessageCircle size={19} /></button>
          <button type='button' className='sv2-icon-button sv2-settings-button' aria-label='Cài đặt'><Settings size={19} /></button>
          <div className='sv2-account-menu' ref={accountMenuRef}>
            <button
              type='button'
              className='sv2-account'
              aria-label='Mở menu tài khoản'
              aria-haspopup='menu'
              aria-expanded={accountOpen}
              aria-controls='dashboard-account-menu'
              onClick={() => setAccountOpen((open) => !open)}
            >
              <div className='sv2-avatar'>{avatarUrl ? <img src={avatarUrl} alt={'Ảnh đại diện của ' + displayName} /> : <UserRound size={20} />}</div>
              <div className='sv2-profile-copy'><strong>{displayName}</strong><span>{role}</span></div>
              <ChevronDown className='sv2-account-chevron' size={16} aria-hidden='true' />
            </button>
            {accountOpen && (
              <div id='dashboard-account-menu' className='sv2-account-dropdown' role='menu' aria-label='Tùy chọn tài khoản'>
                <div className='sv2-account-dropdown__identity'>
                  <strong>{displayName}</strong>
                  <span>{role}</span>
                </div>
                <Link to='/dashboard/profile' role='menuitem' onClick={() => setAccountOpen(false)}>
                  <span className='sv2-account-dropdown__icon'><UserRound size={17} /></span>
                  <span><strong>Chỉnh sửa hồ sơ</strong><small>Cập nhật thông tin cá nhân</small></span>
                </Link>
                <button
                  type='button'
                  role='menuitem'
                  className='sv2-account-dropdown__logout'
                  onClick={() => {
                    setAccountOpen(false);
                    onLogout();
                  }}
                >
                  <span className='sv2-account-dropdown__icon'><LogOut size={17} /></span>
                  <span><strong>Đăng xuất</strong><small>Kết thúc phiên làm việc</small></span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
