import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export const PAGE_SIZE_OPTIONS = [10, 12, 25, 50];

export interface StandardSetPaginationProps {
  total: number;
  selectedCount: number;
  onClearSelection: () => void;
  pageSize: number;
  onPageSizeChange: (val: string) => void;
  rangeFrom: number;
  rangeTo: number;
  canPrev: boolean;
  canNext: boolean;
  totalPages: number;
  onPageChange: (val: number) => void;
}

export function StandardSetPagination({
  total,
  selectedCount,
  onClearSelection,
  pageSize,
  onPageSizeChange,
  rangeFrom,
  rangeTo,
  canPrev,
  canNext,
  totalPages,
  onPageChange,
}: StandardSetPaginationProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 sm:px-4 pt-3 pb-2 text-[11px] text-slate-500 border-t border-slate-100 bg-slate-50/50">
      <span className="font-normal">
        Tổng số: <span className="font-semibold text-slate-700">{total}</span>
        {selectedCount > 0 && (
          <span className="ml-2 font-medium text-blue-600">
            · Đã chọn {selectedCount} dòng
          </span>
        )}
      </span>

      {selectedCount > 0 && (
        <button
          type="button"
          onClick={onClearSelection}
          className="text-slate-400 hover:text-rose-600 cursor-pointer text-[11px] ml-1 transition-colors"
        >
          Bỏ chọn tất cả
        </button>
      )}

      <div className="flex-1" />

      <label className="inline-flex items-center gap-1.5 font-normal">
        Số dòng/trang
        <span className="relative inline-flex items-center">
          <select
            value={String(pageSize)}
            onChange={(e) => onPageSizeChange(e.target.value)}
            className="appearance-none h-7 pl-2.5 pr-7 rounded-md border border-slate-200 bg-white text-[11px] font-medium text-slate-600 cursor-pointer hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={String(n)}>
                {n}
              </option>
            ))}
          </select>
          <ChevronDown
            size={12}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </span>
      </label>

      <span className="font-medium text-slate-600 tabular-nums whitespace-nowrap">
        {rangeFrom} - {rangeTo}
      </span>

      <div className="inline-flex items-center gap-0.5">
        <button
          type="button"
          disabled={canPrev}
          onClick={() => onPageChange(1)}
          title="Trang đầu"
          className="h-7 w-7 rounded-md inline-flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
        >
          <ChevronsLeft size={13} />
        </button>
        <button
          type="button"
          disabled={canPrev}
          onClick={() => onPageChange(Math.max(1, rangeFrom > 0 ? Math.ceil(rangeFrom / pageSize) - 1 : 1))}
          title="Trang trước"
          className="h-7 w-7 rounded-md inline-flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
        >
          <ChevronLeft size={13} />
        </button>
        <button
          type="button"
          disabled={canNext}
          onClick={() => onPageChange(Math.ceil(rangeFrom / pageSize) + 1)}
          title="Trang sau"
          className="h-7 w-7 rounded-md inline-flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
        >
          <ChevronRight size={13} />
        </button>
        <button
          type="button"
          disabled={canNext}
          onClick={() => onPageChange(totalPages)}
          title="Trang cuối"
          className="h-7 w-7 rounded-md inline-flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
        >
          <ChevronsRight size={13} />
        </button>
      </div>
    </div>
  );
}
