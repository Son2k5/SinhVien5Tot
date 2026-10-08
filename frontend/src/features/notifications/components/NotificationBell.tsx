import { useEffect, useId, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useAuthStore } from '../../../store/useAuthStore';
import { normalizeRole } from '../../../utils/authorization';
import { useUnreadCount } from '../hooks/useNotifications';
import { formatBadge, NotificationDropdown } from './NotificationDropdown';

const FONT_MONO = "font-['JetBrains_Mono',ui-monospace,SFMono-Regular,Menlo,monospace]";

export interface NotificationBellProps {
  onOpen?: () => void;
}

export function NotificationBell({ onOpen }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const role = normalizeRole(useAuthStore((state) => state.user?.role));
  const { data } = useUnreadCount();
  const unreadCount = data?.count ?? 0;

  const close = (restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) buttonRef.current?.focus();
  };

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) onOpen?.();
  };

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' && !open) {
            event.preventDefault();
            toggle();
          }
        }}
        aria-label={unreadCount > 0 ? `Thông báo, ${unreadCount} chưa đọc` : 'Thông báo'}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        title="Thông báo"
        className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-colors cursor-pointer active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 ${
          open
            ? 'bg-blue-50 text-blue-600 ring-2 ring-blue-100'
            : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100/80'
        }`}
      >
        <Bell size={18} aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            className={`${FONT_MONO} absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-semibold leading-none tabular-nums flex items-center justify-center ring-2 ring-white`}
          >
            {formatBadge(unreadCount)}
          </span>
        )}
      </button>

      {open && (
        <NotificationDropdown
          id={panelId}
          role={role}
          unreadCount={unreadCount}
          onClose={close}
        />
      )}
    </div>
  );
}

export default NotificationBell;
