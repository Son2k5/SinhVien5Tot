import { useEffect, useRef } from 'react';
import { Inbox, LoaderCircle, RefreshCw } from 'lucide-react';
import { SkeletonBlock } from '../../../components/common/SkeletonBlock';
import type { NotificationResponse } from '../types/notification.types';
import { NotificationItem } from './NotificationItem';

export interface NotificationListProps {
  items: NotificationResponse[];
  tab: 'all' | 'unread';
  isPending: boolean;
  isError: boolean;
  isRefetching: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
  reducedMotion: boolean;
  onSelect: (notification: NotificationResponse) => void;
  onRefetch: () => void;
  onFetchNextPage: () => void;
}

export function NotificationList({
  items,
  tab,
  isPending,
  isError,
  isRefetching,
  hasNextPage,
  isFetchingNextPage,
  isFetchNextPageError,
  reducedMotion,
  onSelect,
  onRefetch,
  onFetchNextPage,
}: NotificationListProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const autoLoad = !reducedMotion && hasNextPage && !isFetchingNextPage && !isFetchNextPageError;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!autoLoad || !sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) void onFetchNextPage();
      },
      { rootMargin: '240px 0px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [autoLoad, onFetchNextPage]);

  if (isPending) {
    return (
      <ul className="space-y-1" aria-busy="true" aria-label="Đang tải thông báo">
        {Array.from({ length: 6 }, (_, index) => (
          <li key={index} className="flex items-start gap-3 px-3 py-3.5">
            <SkeletonBlock className="w-9 h-9 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2 pt-0.5">
              <SkeletonBlock className="h-3.5 w-2/3 rounded" />
              <SkeletonBlock className="h-3 w-full rounded" />
              <SkeletonBlock className="h-2.5 w-20 rounded" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (isError && items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
        <p className="text-sm font-semibold text-[#11295f]">Không thể tải thông báo</p>
        <p className="text-xs text-slate-500">Vui lòng kiểm tra kết nối và thử lại.</p>
        <button
          type="button"
          onClick={onRefetch}
          disabled={isRefetching}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#0052cc] hover:bg-[#0747a6] text-white shadow-sm transition-colors cursor-pointer disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'motion-safe:animate-spin' : ''}`} aria-hidden="true" />
          Thử lại
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
        <span
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-500 ring-1 ring-blue-100 flex items-center justify-center mb-1"
          aria-hidden="true"
        >
          <Inbox className="w-6 h-6" />
        </span>
        <p className="text-sm font-bold text-[#11295f]">
          {tab === 'unread' ? 'Không còn thông báo chưa đọc' : 'Chưa có thông báo nào'}
        </p>
        <p className="text-xs text-slate-500 max-w-xs">
          {tab === 'unread'
            ? 'Tuyệt vời! Bạn đã xem hết các cập nhật mới nhất.'
            : 'Khi có đợt xét, bài viết hoặc cập nhật hồ sơ mới, thông báo sẽ hiển thị tại đây.'}
        </p>
      </div>
    );
  }

  return (
    <>
      <ul className="space-y-1">
        {items.map((notification) => (
          <li key={notification.id}>
            <NotificationItem notification={notification} onSelect={onSelect} />
          </li>
        ))}
      </ul>

      <div ref={sentinelRef} aria-hidden="true" className="h-px" />

      {isFetchingNextPage && (
        <p className="flex items-center justify-center gap-2 py-4 text-xs text-slate-500" role="status">
          <LoaderCircle className="w-4 h-4 motion-safe:animate-spin" aria-hidden="true" />
          Đang tải thêm...
        </p>
      )}

      {hasNextPage && !isFetchingNextPage && (reducedMotion || isFetchNextPageError) && (
        <div className="flex flex-col items-center gap-1.5 py-4">
          <button
            type="button"
            onClick={onFetchNextPage}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-blue-600 hover:bg-blue-50/80 transition-colors cursor-pointer"
          >
            Tải thêm thông báo
          </button>
          {isFetchNextPageError && (
            <p className="text-[11px] text-rose-500">Tải thêm thất bại, vui lòng thử lại.</p>
          )}
        </div>
      )}
    </>
  );
}

export default NotificationList;
