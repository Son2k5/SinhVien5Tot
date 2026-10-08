import { useState, useSyncExternalStore } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCheck } from 'lucide-react';
import { SiteFooter as DashboardFooter } from '../../components/common/SiteFooter';
import {
  DashboardHeader,
  SystemLauncher,
  useWelcomeDashboard,
  useLauncher,
  formatUserRole,
} from '../home-dashboard';
import type { User } from '../auth/types/auth.types';
import { normalizeRole, type AppRole } from '../../utils/authorization';
import {
  NotificationFilterTabs,
  NotificationList,
  type NotificationTab,
} from './components';
import {
  useMarkAllRead,
  useMarkRead,
  useNotificationList,
  useUnreadCount,
} from './hooks/useNotifications';
import { resolveNotificationLink } from './resolveNotificationLink';
import type { NotificationResponse } from './types/notification.types';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeReducedMotion(onChange: () => void): () => void {
  const media = window.matchMedia(REDUCED_MOTION_QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

export function NotificationsContent({ role }: { role: AppRole }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<NotificationTab>('all');
  const reducedMotion = usePrefersReducedMotion();

  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.count ?? 0;

  const {
    data,
    isPending,
    isError,
    refetch,
    isRefetching,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useNotificationList(tab === 'unread');

  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const items = data?.pages.flatMap((page) => page.items) ?? [];

  const handleSelect = (notification: NotificationResponse) => {
    if (!notification.isRead) markRead.mutate(notification.id);
    navigate(resolveNotificationLink(notification, role));
  };

  return (
    <div className="font-['Be_Vietnam_Pro',ui-sans-serif,system-ui,sans-serif] w-full max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#11295f]">
            Thông báo
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi tất cả cập nhật về bài viết, đợt xét và kết quả thẩm định.
          </p>
        </div>

        <button
          type="button"
          onClick={() => markAllRead.mutate()}
          disabled={unreadCount === 0 || markAllRead.isPending}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50/80 disabled:text-slate-400 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors self-start sm:self-auto cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
        >
          <CheckCheck size={16} aria-hidden="true" />
          Đánh dấu tất cả đã đọc
        </button>
      </div>

      <section
        aria-label="Danh sách thông báo"
        className="rounded-2xl border border-white/70 bg-white/95 backdrop-blur-xl shadow-[0_20px_50px_-24px_rgba(17,41,95,0.18)] ring-1 ring-[#11295f]/5 overflow-hidden"
      >
        <div className="p-3 border-b border-slate-100 flex items-center justify-between gap-3">
          <NotificationFilterTabs
            currentTab={tab}
            unreadCount={unreadCount}
            onTabChange={setTab}
          />
        </div>

        <div id="notifications-panel" role="tabpanel" className="p-3">
          <NotificationList
            items={items}
            tab={tab}
            isPending={isPending}
            isError={isError}
            isRefetching={isRefetching}
            hasNextPage={Boolean(hasNextPage)}
            isFetchingNextPage={isFetchingNextPage}
            isFetchNextPageError={isFetchNextPageError}
            reducedMotion={reducedMotion}
            onSelect={handleSelect}
            onRefetch={() => void refetch()}
            onFetchNextPage={() => void fetchNextPage()}
          />
        </div>
      </section>
    </div>
  );
}

function UserNotificationsShell({ user, onLogout }: { user: User; onLogout: () => void }) {
  const { displayName, avatarUrl, notifications, features } = useWelcomeDashboard(user);
  const {
    launcherOpen,
    featureSearch,
    filteredFeatures,
    featureGroups,
    launcherButtonRef,
    launcherSearchRef,
    openLauncher,
    closeLauncher,
    toggleLauncher,
    setFeatureSearch,
  } = useLauncher(features);

  return (
    <div className="authenticated-page-background min-h-screen text-slate-700 flex flex-col font-['Be_Vietnam_Pro',ui-sans-serif,system-ui,sans-serif]">
      <DashboardHeader
        displayName={displayName}
        role={formatUserRole(user.role)}
        avatarUrl={avatarUrl}
        notificationCount={notifications.length}
        launcherOpen={launcherOpen}
        menuButtonRef={launcherButtonRef}
        onToggleLauncher={toggleLauncher}
        onOpenLauncher={openLauncher}
        onLogout={onLogout}
      />

      <SystemLauncher
        open={launcherOpen}
        searchValue={featureSearch}
        featureGroups={featureGroups}
        filteredCount={filteredFeatures.length}
        searchInputRef={launcherSearchRef}
        onSearchChange={setFeatureSearch}
        onClose={closeLauncher}
        onLogout={onLogout}
      />

      <main className="flex-1 w-full px-4 sm:px-6 py-8">
        <NotificationsContent role={normalizeRole(user.role)} />
      </main>

      <DashboardFooter />
    </div>
  );
}

export interface NotificationsPageProps {
  user: User;
  onLogout: () => void;
  variant?: 'user' | 'admin';
}

export function NotificationsPage({ user, onLogout, variant }: NotificationsPageProps) {
  const location = useLocation();
  const isAdminView = variant ? variant === 'admin' : location.pathname.startsWith('/admin');

  if (isAdminView) {
    return <NotificationsContent role={normalizeRole(user?.role)} />;
  }
  return <UserNotificationsShell user={user} onLogout={onLogout} />;
}

export default NotificationsPage;
