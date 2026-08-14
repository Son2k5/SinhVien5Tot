import { RefreshCw } from 'lucide-react';
import { SkeletonBlock } from '../../common/SkeletonBlock';

interface DashboardFallbackNoticeProps {
  error?: unknown;
  onRetry: () => void;
}

export function DashboardFallbackNotice({ error, onRetry }: DashboardFallbackNoticeProps) {
  const message = error instanceof Error
    ? error.message
    : 'Máy chủ welcome tạm thời chưa phản hồi.';

  return (
    <div className='sv2-fallback-notice' role='status'>
      <span><RefreshCw size={16} /></span>
      <p><strong>Đang hiển thị dữ liệu mẫu.</strong> {message}</p>
      <button type='button' onClick={onRetry}>Kết nối lại</button>
    </div>
  );
}

export function HomeDashboardSkeleton() {
  return (
    <div className='sv2-content' role='status' aria-live='polite' aria-busy='true'>
      <SkeletonBlock className='h-[520px] rounded-[30px]' />

      <section className='grid gap-4' aria-hidden='true'>
        <div className='flex items-end justify-between gap-6'>
          <div className='grid gap-2'><SkeletonBlock className='h-3 w-32 rounded' /><SkeletonBlock className='h-8 w-56 rounded-lg' /></div>
          <SkeletonBlock className='hidden h-3 w-64 rounded md:block' />
        </div>
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5'>
          {Array.from({ length: 5 }, (_, index) => <SkeletonBlock key={index} className='h-48 rounded-[18px]' />)}
        </div>
      </section>

      <section className='grid gap-4' aria-hidden='true'>
        <div className='grid gap-2'><SkeletonBlock className='h-3 w-28 rounded' /><SkeletonBlock className='h-8 w-52 rounded-lg' /></div>
        <div className='grid gap-4 lg:grid-cols-[minmax(240px,0.65fr)_minmax(0,1.35fr)]'>
          <SkeletonBlock className='h-[360px] rounded-[24px]' />
          <div className='grid gap-3'>
            {Array.from({ length: 5 }, (_, index) => <SkeletonBlock key={index} className='h-16 rounded-[14px]' />)}
          </div>
        </div>
      </section>

      <section className='grid gap-4' aria-hidden='true'>
        <div className='grid gap-2'><SkeletonBlock className='h-3 w-36 rounded' /><SkeletonBlock className='h-8 w-64 rounded-lg' /></div>
        <div className='grid grid-cols-1 gap-5 md:grid-cols-3'>
          {Array.from({ length: 3 }, (_, index) => <SkeletonBlock key={index} className='h-64 rounded-[20px]' />)}
        </div>
      </section>

      <section className='grid gap-3' aria-hidden='true'>
        <div className='grid gap-2'><SkeletonBlock className='h-3 w-32 rounded' /><SkeletonBlock className='h-8 w-56 rounded-lg' /></div>
        {Array.from({ length: 4 }, (_, index) => <SkeletonBlock key={index} className='h-24 rounded-[16px]' />)}
      </section>

      <span className='sr-only'>Đang tải dữ liệu trang chủ...</span>
    </div>
  );
}
