import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BellOff, CheckCheck, RefreshCw } from 'lucide-react';
import { SkeletonBlock } from '../../../components/common/SkeletonBlock';
import type { AppRole } from '../../../utils/authorization';
import { notificationsPagePath, resolveNotificationLink } from '../resolveNotificationLink';
import {
  useMarkAllRead,
  useMarkRead,
  useNotificationList,
} from '../hooks/useNotifications';
import type { NotificationResponse } from '../types/notification.types';
import { NotificationItem } from './NotificationItem';

export const DROPDOWN_LIMIT = 10;
const FOCUSABLE_SELECTOR = '[data-notification-focusable]';
const FONT_BODY = "font-['Be_Vietnam_Pro',ui-sans-serif,system-ui,sans-serif]";
const FONT_MONO = "font-['JetBrains_Mono',ui-monospace,SFMono-Regular,Menlo,monospace]";

export function formatBadge(count: number): string {
  return count > 99 ? '99+' : String(count);
}

export function moveFocus(container: HTMLElement, event: ReactKeyboardEvent): void {
  const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End'];
  if (!keys.includes(event.key)) return;
  const focusables = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('disabled'),
  );
  if (focusables.length === 0) return;
  event.preventDefault();
  const index = focusables.indexOf(document.activeElement as HTMLElement);
  let next = 0;
  if (event.key === 'End') next = focusables.length - 1;
  else if (event.key === 'ArrowDown') next = index < 0 ? 0 : (index + 1) % focusables.length;
  else if (event.key === 'ArrowUp') next = index <= 0 ? focusables.length - 1 : index - 1;
  focusables[next]?.focus();
}

export interface NotificationDropdownProps {
  id: string;
  role: AppRole;
  unreadCount: number;
  onClose: (restoreFocus?: boolean) => void;
}

export function NotificationDropdown({ id, role, unreadCount, onClose }: NotificationDropdownProps) {
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);
  const { data, isPending, isError, refetch, isRefetching } = useNotificationList(false);
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const items = (data?.pages.flatMap((page) => page.items) ?? []).slice(0, DROPDOWN_LIMIT);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  const handleSelect = (notification: NotificationResponse) => {
    if (!notification.isRead) markRead.mutate(notification.id);
    onClose();
    navigate(resolveNotificationLink(notification, role));
  };

  return (
    <div
      ref={panelRef}
      id={id}
      role="dialog"
      aria-label="Thông báo"
      tabIndex={-1}
      onKeyDown={(event) => panelRef.current && moveFocus(panelRef.current, event)}
      className={`${FONT_BODY} absolute right-0 top-full mt-2 w-[380px] z-50 max-sm:fixed max-sm:left-3 max-sm:right-3 max-sm:top-[4.5rem] max-sm:w-auto flex flex-col overflow-hidden rounded-2xl border border-white/70 bg-white/95 backdrop-blur-xl backdrop-saturate-150 ring-1 ring-[#11295f]/5 shadow-[0_24px_60px_-20px_rgba(17,41,95,0.35)] outline-none motion-safe:animate-fade-in`}
    >
      <div className="flex items-center justify-between gap-3 px-4 pt-3.5 pb-3 border-b border-slate-200/60">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-sm font-bold text-[#11295f]">Thông báo</h2>
          {unreadCount > 0 && (
            <span className={`${FONT_MONO} px-1.5 py-0.5 rounded-md bg-blue-600/10 text-blue-700 text-[10px] font-semibold tabular-nums`}>
              {formatBadge(unreadCount)} mới
            </span>
          )}
        </div>
        <button
          type="button"
          data-notification-focusable
          onClick={() => markAllRead.mutate()}
          disabled={unreadCount === 0 || markAllRead.isPending}
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50/80 disabled:text-slate-400 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
        >
          <CheckCheck size={14} aria-hidden="true" />
          Đánh dấu tất cả đã đọc
        </button>
      </div>

      <div className="max-h-[min(440px,60vh)] overflow-y-auto overscroll-contain p-1.5">
        {isPending ? (
          <ul className="space-y-1" aria-busy="true" aria-label="Đang tải thông báo">
            {Array.from({ length: 4 }, (_, index) => (
              <li key={index} className="flex items-start gap-3 px-3 py-3">
                <SkeletonBlock className="w-9 h-9 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2 pt-0.5">
                  <SkeletonBlock className="h-3 w-3/4 rounded" />
                  <SkeletonBlock className="h-2.5 w-full rounded" />
                  <SkeletonBlock className="h-2 w-16 rounded" />
                </div>
              </li>
            ))}
          </ul>
        ) : isError && items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
            <p className="text-xs text-slate-500">Chưa tải được thông báo.</p>
            <button
              type="button"
              data-notification-focusable
              onClick={() => void refetch()}
              disabled={isRefetching}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
            >
              <RefreshCw size={13} aria-hidden="true" className={isRefetching ? 'motion-safe:animate-spin' : ''} />
              Thử lại
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
            <span className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center" aria-hidden="true">
              <BellOff size={20} />
            </span>
            <p className="text-sm font-semibold text-[#11295f]">Chưa có thông báo</p>
            <p className="text-xs text-slate-500">Thông báo mới sẽ xuất hiện tại đây.</p>
          </div>
        ) : (
          <ul className="space-y-0.5">
            {items.map((notification) => (
              <li key={notification.id}>
                <NotificationItem notification={notification} onSelect={handleSelect} compact />
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link
        to={notificationsPagePath(role)}
        data-notification-focusable
        onClick={() => onClose()}
        className="block px-4 py-2.5 text-center text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50/60 border-t border-slate-200/60 transition-colors focus-visible:outline-none focus-visible:bg-blue-50/80"
      >
        Xem tất cả
      </Link>
    </div>
  );
}

export default NotificationDropdown;
