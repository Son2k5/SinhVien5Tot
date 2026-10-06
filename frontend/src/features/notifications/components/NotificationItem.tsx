import {
  BadgeCheck,
  Bell,
  FileCheck,
  FileWarning,
  Megaphone,
  Newspaper,
  type LucideIcon,
} from 'lucide-react';
import { formatRelativeTime, parseServerDate } from '../../../utils/date';
import type { NotificationResponse, NotificationType } from '../types/notification.types';

export interface TypeMeta {
  icon: LucideIcon;
  tone: string;
  label: string;
}

export const TYPE_META: Record<NotificationType, TypeMeta> = {
  ArticlePublished: { icon: Newspaper, tone: 'bg-sky-50 text-sky-600 ring-sky-100', label: 'Bài viết' },
  CampaignPublished: { icon: Megaphone, tone: 'bg-indigo-50 text-indigo-600 ring-indigo-100', label: 'Đợt xét' },
  ApplicationSubmitted: { icon: FileCheck, tone: 'bg-blue-50 text-blue-600 ring-blue-100', label: 'Hồ sơ' },
  EvidenceReviewed: { icon: FileWarning, tone: 'bg-amber-50 text-amber-600 ring-amber-100', label: 'Minh chứng' },
  ApplicationDecided: { icon: BadgeCheck, tone: 'bg-emerald-50 text-emerald-600 ring-emerald-100', label: 'Kết quả' },
  ApplicationWithdrawn: { icon: FileWarning, tone: 'bg-rose-50 text-rose-600 ring-rose-100', label: 'Rút hồ sơ' },
};

export const FALLBACK_META: TypeMeta = {
  icon: Bell,
  tone: 'bg-slate-100 text-slate-500 ring-slate-200',
  label: 'Thông báo',
};

const absoluteFormatter = new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export interface NotificationItemProps {
  notification: NotificationResponse;
  onSelect: (notification: NotificationResponse) => void;
  compact?: boolean;
}

export function NotificationItem({ notification, onSelect, compact = false }: NotificationItemProps) {
  const meta = TYPE_META[notification.type] ?? FALLBACK_META;
  const Icon = meta.icon;
  const createdAt = parseServerDate(notification.createdAt);
  const validDate = !Number.isNaN(createdAt.getTime());
  const unread = !notification.isRead;

  return (
    <button
      type="button"
      data-notification-focusable
      onClick={() => onSelect(notification)}
      className={`group relative w-full flex items-start gap-3 text-left rounded-xl px-3 py-3 transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 ${
        unread ? 'bg-blue-50/60 hover:bg-blue-50' : 'hover:bg-slate-50/90'
      }`}
    >
      <span
        className={`shrink-0 mt-0.5 w-9 h-9 rounded-xl ring-1 flex items-center justify-center ${meta.tone}`}
        aria-hidden="true"
      >
        <Icon size={17} strokeWidth={2} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-start gap-2">
          <span
            className={`flex-1 min-w-0 text-[13px] leading-snug ${compact ? 'line-clamp-1' : ''} ${
              unread ? 'font-semibold text-[#11295f]' : 'font-medium text-slate-700'
            }`}
          >
            {notification.title}
          </span>
          {unread && (
            <span
              className="mt-1.5 w-2 h-2 rounded-full bg-blue-600 shrink-0 shadow-[0_0_0_3px_rgba(37,99,235,0.15)]"
              aria-hidden="true"
            />
          )}
        </span>
        <span
          className={`block mt-0.5 text-xs leading-relaxed break-words ${compact ? 'line-clamp-2' : ''} ${
            unread ? 'text-slate-600' : 'text-slate-500'
          }`}
        >
          {notification.body}
        </span>
        <span className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-400">
          <span className="font-medium text-slate-500">{meta.label}</span>
          {validDate && (
            <>
              <span aria-hidden="true">·</span>
              <time dateTime={createdAt.toISOString()} title={absoluteFormatter.format(createdAt)}>
                {formatRelativeTime(createdAt, Date.now())}
              </time>
            </>
          )}
        </span>
      </span>
      {unread && <span className="sr-only">(chưa đọc)</span>}
    </button>
  );
}

export default NotificationItem;
