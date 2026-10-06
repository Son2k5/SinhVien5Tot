import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

export const PAGE_SIZE_OPTIONS = [10, 20, 50];

export interface StaffPaginationProps {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isPending: boolean;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newSize: number) => void;
}

export function StaffPagination({
  total,
  page,
  pageSize,
  totalPages,
  isPending,
  onPageChange,
  onPageSizeChange,
}: StaffPaginationProps) {
  const rangeFrom = total > 0 ? (page - 1) * pageSize + 1 : 0;
  const rangeTo = Math.min(page * pageSize, total);
  const canPrev = page <= 1;
  const canNext = page >= totalPages;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
      <div className="flex items-center gap-2">
        <span>
          Tổng cộng:{' '}
          <strong className="font-semibold text-slate-700 font-mono">{total}</strong> nhân sự
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Page Size Selector */}
        <div className="flex items-center gap-1.5">
          <span>Số dòng:</span>
          <div className="relative">
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="appearance-none h-7 pl-2 pr-6 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 cursor-pointer focus:border-blue-500 focus:outline-none transition-all shadow-2xs"
            >
              {PAGE_SIZE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <ChevronDown
              size={12}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>
        </div>

        {/* Range display */}
        <span className="font-mono text-slate-600">
          {rangeFrom} - {rangeTo}
        </span>

        {/* Page Navigation Buttons */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={canPrev || isPending}
            className="h-7 w-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            title="Trang đầu"
            aria-label="Trang đầu"
          >
            <ChevronsLeft size={13} />
          </button>
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={canPrev || isPending}
            className="h-7 w-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            title="Trang trước"
            aria-label="Trang trước"
          >
            <ChevronLeft size={13} />
          </button>
          <span className="px-2 font-mono text-slate-700">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={canNext || isPending}
            className="h-7 w-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            title="Trang sau"
            aria-label="Trang sau"
          >
            <ChevronRight size={13} />
          </button>
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={canNext || isPending}
            className="h-7 w-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            title="Trang cuối"
            aria-label="Trang cuối"
          >
            <ChevronsRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default StaffPagination;
