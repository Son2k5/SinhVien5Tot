import { useRef, type KeyboardEvent } from 'react';

export type NotificationTab = 'all' | 'unread';

export const NOTIFICATION_TABS: Array<{ key: NotificationTab; label: string }> = [
  { key: 'all', label: 'Tất cả' },
  { key: 'unread', label: 'Chưa đọc' },
];

export interface NotificationFilterTabsProps {
  currentTab: NotificationTab;
  unreadCount: number;
  onTabChange: (tab: NotificationTab) => void;
}

export function NotificationFilterTabs({
  currentTab,
  unreadCount,
  onTabChange,
}: NotificationFilterTabsProps) {
  const tabRefs = useRef<Record<NotificationTab, HTMLButtonElement | null>>({
    all: null,
    unread: null,
  });

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const next: NotificationTab = currentTab === 'all' ? 'unread' : 'all';
    onTabChange(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div
      className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl"
      role="tablist"
      aria-label="Lọc thông báo"
    >
      {NOTIFICATION_TABS.map((t) => (
        <button
          key={t.key}
          ref={(el) => {
            tabRefs.current[t.key] = el;
          }}
          role="tab"
          aria-selected={currentTab === t.key}
          tabIndex={currentTab === t.key ? 0 : -1}
          onKeyDown={handleTabKeyDown}
          onClick={() => onTabChange(t.key)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            currentTab === t.key
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>{t.label}</span>
          {t.key === 'unread' && unreadCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-700 text-[10px] font-mono font-bold">
              {unreadCount}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export default NotificationFilterTabs;
