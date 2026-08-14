import { SkeletonBlock } from './SkeletonBlock';

export function FormSkeleton() {
  return (
    <div className='w-full max-w-md mx-auto space-y-6 p-4' role='status' aria-live='polite' aria-busy='true'>
      <div className='space-y-2'>
        <SkeletonBlock className='h-8 rounded-lg w-2/3' />
        <SkeletonBlock className='h-4 rounded w-5/6 opacity-60' />
      </div>
      <div className='space-y-4 pt-4'>
        <div className='space-y-2'>
          <SkeletonBlock className='h-4 rounded w-1/4' />
          <SkeletonBlock className='h-11 rounded-lg w-full opacity-60' />
        </div>
        <div className='space-y-2'>
          <SkeletonBlock className='h-4 rounded w-1/4' />
          <SkeletonBlock className='h-11 rounded-lg w-full opacity-60' />
        </div>
      </div>
      <SkeletonBlock className='h-11 rounded-lg w-full mt-6' />
      <SkeletonBlock className='h-4 rounded w-1/2 mx-auto mt-6 opacity-60' />
      <span className='sr-only'>Đang tải biểu mẫu...</span>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className='w-full max-w-6xl mx-auto p-6 space-y-8' role='status' aria-live='polite' aria-busy='true'>
      <div className='bg-white rounded-2xl p-8 border border-slate-100 shadow-sm space-y-4'>
        <div className='flex items-center gap-4'>
          <SkeletonBlock className='w-16 h-16 rounded-full' />
          <div className='space-y-2'>
            <SkeletonBlock className='h-6 rounded w-48' />
            <SkeletonBlock className='h-4 rounded w-64 opacity-60' />
          </div>
        </div>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className='h-32 bg-white rounded-xl border border-slate-100 p-6 space-y-3'>
            <SkeletonBlock className='h-4 rounded w-1/3' />
            <SkeletonBlock className='h-8 rounded w-1/2' />
          </div>
        ))}
      </div>
      <span className='sr-only'>Đang tải bảng điều khiển...</span>
    </div>
  );
}
