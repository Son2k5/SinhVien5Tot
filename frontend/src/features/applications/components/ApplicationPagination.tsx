import React from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

interface ApplicationPaginationProps {
  totalCount: number;
  pageSize: number;
  handlePageSizeChange: (val: string) => void;
  rangeFrom: number;
  rangeTo: number;
  canPrev: boolean;
  canNext: boolean;
  setPageIndex: (updater: number | ((p: number) => number)) => void;
  totalPages: number;
  pageSizeOptions?: number[];
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 12, 25, 50];

export const ApplicationPagination: React.FC<ApplicationPaginationProps> = ({
  totalCount,
  pageSize,
  handlePageSizeChange,
  rangeFrom,
  rangeTo,
  canPrev,
  canNext,
  setPageIndex,
  totalPages,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 sm:px-4 pt-3 pb-2 text-[11px] text-slate-500 border-t border-slate-100">
      <span className="font-normal">
        Tổng số: <span className="font-semibold text-slate-700">{totalCount}</span>
      </span>

      <div className="flex-1" />

      <label className="inline-flex items-center gap-1.5 font-normal">
        Số dòng/trang
        <span className="relative inline-flex items-center">
          <select
            value={String(pageSize)}
            onChange={(e) => handlePageSizeChange(e.target.value)}
            className="appearance-none h-7 pl-2.5 pr-7 rounded-md border border-slate-200 bg-white text-[11px] font-medium text-slate-600 cursor-pointer hover:border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
          >
            {pageSizeOptions.map((n) => (
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
          onClick={() => setPageIndex(1)}
          title="Trang đầu"
          className="h-7 w-7 rounded-md inline-flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
        >
          <ChevronsLeft size={13} />
        </button>
        <button
          type="button"
          disabled={canPrev}
          onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
          title="Trang trước"
          className="h-7 w-7 rounded-md inline-flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
        >
          <ChevronLeft size={13} />
        </button>
        <button
          type="button"
          disabled={canNext}
          onClick={() => setPageIndex((p) => p + 1)}
          title="Trang sau"
          className="h-7 w-7 rounded-md inline-flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
        >
          <ChevronRight size={13} />
        </button>
        <button
          type="button"
          disabled={canNext}
          onClick={() => setPageIndex(totalPages)}
          title="Trang cuối"
          className="h-7 w-7 rounded-md inline-flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
        >
          <ChevronsRight size={13} />
        </button>
      </div>
    </div>
  );
};
