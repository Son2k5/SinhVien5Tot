import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const PAGE_SIZE_OPTIONS = [10, 12, 25, 50];

interface StudentPaginationProps {
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
  pageIndex: number;
  onPageChange: (val: number) => void;
}

export function StudentPagination({
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
  pageIndex,
  onPageChange,
}: StudentPaginationProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 sm:px-4 pt-3 pb-2 text-[11px] text-slate-500 border-t border-slate-100 bg-slate-50/50">
      <span className="font-normal">
        Tổng số: <span className="font-semibold text-slate-700">{total}</span>
        {selectedCount > 0 && (
          <span className="ml-2 font-medium text-blue-600">
            · Đã chọn {selectedCount} dòng (
            <button
              type="button"
              onClick={onClearSelection}
              className="underline hover:text-blue-800 cursor-pointer"
            >
              bỏ chọn
            </button>
            )
          </span>
        )}
      </span>

      <div className="flex items-center gap-1.5 ml-auto">
        <span className="text-slate-400">Hiển thị</span>
        <div className="relative inline-block">
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(e.target.value)}
            className="appearance-none bg-white border border-slate-200 rounded-md pl-2 pr-6 py-0.5 text-[11px] font-normal text-slate-700 hover:border-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            {PAGE_SIZE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <ChevronDown
            size={11}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
        </div>
        <span className="text-slate-400">dòng/trang</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="tabular-nums font-normal text-slate-600">
          {rangeFrom}–{rangeTo} / {total}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            disabled={canPrev}
            onClick={() => onPageChange(1)}
            className="h-6 w-6 rounded flex items-center justify-center text-slate-500 hover:bg-slate-200/60 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            title="Trang đầu"
          >
            <ChevronsLeft size={13} />
          </button>
          <button
            type="button"
            disabled={canPrev}
            onClick={() => onPageChange(Math.max(1, pageIndex - 1))}
            className="h-6 w-6 rounded flex items-center justify-center text-slate-500 hover:bg-slate-200/60 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            title="Trang trước"
          >
            <ChevronLeft size={13} />
          </button>
          <span className="px-1.5 text-[11px] font-semibold text-slate-700 tabular-nums">
            {pageIndex} / {totalPages || 1}
          </span>
          <button
            type="button"
            disabled={canNext}
            onClick={() => onPageChange(Math.min(totalPages, pageIndex + 1))}
            className="h-6 w-6 rounded flex items-center justify-center text-slate-500 hover:bg-slate-200/60 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            title="Trang sau"
          >
            <ChevronRight size={13} />
          </button>
          <button
            type="button"
            disabled={canNext}
            onClick={() => onPageChange(totalPages)}
            className="h-6 w-6 rounded flex items-center justify-center text-slate-500 hover:bg-slate-200/60 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            title="Trang cuối"
          >
            <ChevronsRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
