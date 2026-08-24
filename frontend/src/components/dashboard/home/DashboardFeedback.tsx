import { RefreshCw } from 'lucide-react';
import { SkeletonBlock } from '../../common/SkeletonBlock';

interface DashboardFallbackNoticeProps {
  error?: unknown;
  onRetry: () => void;
}

export function DashboardFallbackNotice({ error, onRetry }: DashboardFallbackNoticeProps) {
  const message = error instanceof Error
    ? error.message
    : 'Máy chủ tạm thời chưa phản hồi.';

  return (
    <div
      className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 flex items-center justify-between gap-4 shadow-sm"
      role="status"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
          <RefreshCw className="w-4 h-4" />
        </div>
        <p className="text-xs sm:text-sm font-normal truncate">
          <strong className="font-medium text-amber-950">Đang hiển thị dữ liệu mẫu.</strong> {message}
        </p>
      </div>

      <button
        type="button"
        onClick={onRetry}
        className="px-3.5 py-1.5 rounded-lg border border-amber-300 bg-white hover:bg-amber-100/50 text-amber-900 text-xs font-medium transition-colors shadow-sm flex-shrink-0 cursor-pointer"
      >
        Kết nối lại
      </button>
    </div>
  );
}

export function HomeDashboardSkeleton() {
  return (
    <div className="space-y-10 sm:space-y-14" role="status" aria-live="polite" aria-busy="true">
      {/* Banner Skeleton */}
      <SkeletonBlock className="h-64 sm:h-72 rounded-2xl" />

      {/* Features Skeleton */}
      <section className="space-y-4" aria-hidden="true">
        <div className="flex items-end justify-between gap-6">
          <div className="space-y-2">
            <SkeletonBlock className="h-3 w-32 rounded" />
            <SkeletonBlock className="h-6 w-48 rounded-lg" />
          </div>
          <SkeletonBlock className="hidden sm:block h-8 w-36 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }, (_, index) => (
            <SkeletonBlock key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
      </section>

      {/* Criteria Skeleton */}
      <section className="space-y-4" aria-hidden="true">
        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-28 rounded" />
          <SkeletonBlock className="h-6 w-48 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <SkeletonBlock className="lg:col-span-4 h-80 rounded-2xl" />
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {Array.from({ length: 5 }, (_, index) => (
              <SkeletonBlock key={index} className="h-36 rounded-2xl" />
            ))}
          </div>
        </div>
      </section>

      {/* Activities Skeleton */}
      <section className="space-y-4" aria-hidden="true">
        <div className="space-y-2">
          <SkeletonBlock className="h-3 w-36 rounded" />
          <SkeletonBlock className="h-6 w-52 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <SkeletonBlock className="lg:col-span-7 h-96 rounded-2xl" />
          <div className="lg:col-span-5 space-y-4">
            <SkeletonBlock className="h-44 rounded-2xl" />
            <SkeletonBlock className="h-44 rounded-2xl" />
          </div>
        </div>
      </section>

      <span className="sr-only">Đang tải dữ liệu trang chủ...</span>
    </div>
  );
}
