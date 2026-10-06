import React from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface EvidenceReviewPaginationProps {
  totalStudents: number;
  rawItemsCount: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageSizeChange: (newPageSize: number) => void;
  pageIndex: number;
  totalPages: number;
  onPageChange: (newPageIndex: number) => void;
  rangeFrom: number;
  rangeTo: number;
  canPrev: boolean;
  canNext: boolean;
}

export const EvidenceReviewPagination: React.FC<EvidenceReviewPaginationProps> = ({
  totalStudents,
  rawItemsCount,
  pageSize,
  pageSizeOptions = [10, 12, 25, 50],
  onPageSizeChange,
  pageIndex,
  totalPages,
  onPageChange,
  rangeFrom,
  rangeTo,
  canPrev,
  canNext,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 sm:px-4 pt-3 pb-2 text-[11px] text-slate-500 border-t border-[#eef2f6]">
      <span className="font-normal">
        Tổng số: <span className="font-semibold text-slate-700">{totalStudents}</span> sinh viên (
        {rawItemsCount} minh chứng)
      </span>

      <div className="flex-1" />

      {/* Page size selector */}
      <label className="inline-flex items-center gap-1.5 font-normal">
        Số dòng/trang
        <span className="relative inline-flex items-center">
          <select
            value={String(pageSize)}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value));
              onPageChange(1);
            }}
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

      {/* Range count */}
      <span className="font-medium text-slate-600 tabular-nums whitespace-nowrap">
        {rangeFrom} - {rangeTo}
      </span>

      {/* Navigation buttons */}
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
          onClick={() => onPageChange(Math.max(1, pageIndex - 1))}
          title="Trang trước"
          className="h-7 w-7 rounded-md inline-flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
        >
          <ChevronLeft size={13} />
        </button>
        <button
          type="button"
          disabled={canNext}
          onClick={() => onPageChange(pageIndex + 1)}
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
};
