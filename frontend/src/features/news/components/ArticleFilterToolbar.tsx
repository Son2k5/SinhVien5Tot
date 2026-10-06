import { Search, ChevronDown, RotateCcw, X } from 'lucide-react';

interface ArticleFilterToolbarProps {
  search: string;
  onSearchChange: (val: string) => void;
  category: string;
  onCategoryChange: (val: string) => void;
  status: string;
  onStatusChange: (val: string) => void;
  debouncedSearch: string;
  onResetFilters: () => void;
  categoryOptions: Record<string, string>;
  statusOptions: Record<string, string>;
}

export function ArticleFilterToolbar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  status,
  onStatusChange,
  debouncedSearch,
  onResetFilters,
  categoryOptions,
  statusOptions,
}: ArticleFilterToolbarProps) {
  const activeFilterCount =
    (debouncedSearch.trim() ? 1 : 0) + (category ? 1 : 0) + (status ? 1 : 0);

  return (
    <div className="px-3 sm:px-4 pt-2.5 pb-2.5 space-y-1 bg-gradient-to-b from-slate-50/70 to-white font-inter">
      <div className="filter-no-ring flex flex-col lg:flex-row items-stretch lg:items-center gap-1.5">
        {/* Ô tìm kiếm */}
        <div className="relative w-full lg:w-[44%] lg:max-w-[480px] shrink-0">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm kiếm bài viết theo tiêu đề..."
              className="w-full h-9 rounded-md border border-slate-300 hover:border-slate-400 bg-white pl-8 pr-8 py-0 text-[12px] leading-9 font-normal text-slate-900 placeholder:text-slate-400 focus:border-[#1683ff] focus:ring-1 focus:ring-[#1683ff]/25 focus:outline-none transition-colors shadow-2xs font-inter"
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer transition-colors"
              title="Xóa tìm kiếm"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Các Dropdown lọc */}
        <div className="flex flex-1 flex-col sm:flex-row sm:justify-end sm:items-center gap-1.5 lg:pl-2">
          <div className="flex w-full sm:w-auto gap-1.5">
            {/* Dropdown Danh mục */}
            <div className="relative w-full sm:w-[170px] shrink-0">
              <select
                value={category}
                onChange={(e) => onCategoryChange(e.target.value)}
                className="appearance-none w-full h-9 rounded-md border border-slate-300 hover:border-slate-400 bg-white pl-2.5 pr-7 py-0 text-[12px] leading-9 font-normal text-slate-800 focus:border-[#1683ff] focus:ring-1 focus:ring-[#1683ff]/25 focus:outline-none cursor-pointer transition-colors shadow-2xs font-inter"
              >
                {Object.entries(categoryOptions).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>

            {/* Dropdown Trạng thái */}
            <div className="relative w-full sm:w-[170px] shrink-0">
              <select
                value={status}
                onChange={(e) => onStatusChange(e.target.value)}
                className="appearance-none w-full h-9 rounded-md border border-slate-300 hover:border-slate-400 bg-white pl-2.5 pr-7 py-0 text-[12px] leading-9 font-normal text-slate-800 focus:border-[#1683ff] focus:ring-1 focus:ring-[#1683ff]/25 focus:outline-none cursor-pointer transition-colors shadow-2xs font-inter"
              >
                {Object.entries(statusOptions).map(([val, label]) => (
                  <option key={val} value={val}>
                    {label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Nút đặt lại */}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onResetFilters}
              className="h-9 px-2.5 rounded-md inline-flex items-center justify-center gap-1 border border-slate-300 hover:border-slate-400 text-slate-600 hover:text-slate-800 text-[12px] bg-white cursor-pointer transition-colors shadow-2xs shrink-0 font-inter"
              title="Đặt lại bộ lọc"
            >
              <RotateCcw size={12} />
              <span className="hidden sm:inline">Đặt lại</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <div className="pt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] font-inter">
          <span className="text-[11px] font-normal text-slate-500 mr-0.5">Đang lọc:</span>

          {debouncedSearch.trim() && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100/80 text-slate-600 font-normal text-[11px]">
              "{debouncedSearch}"
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="hover:text-rose-600 cursor-pointer"
                title="Bỏ lọc tìm kiếm"
              >
                <X size={11} />
              </button>
            </span>
          )}

          {category && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50/80 text-blue-600 font-normal text-[11px] border border-blue-100">
              Danh mục: {categoryOptions[category]}
              <button
                type="button"
                onClick={() => onCategoryChange('')}
                className="hover:text-rose-600 cursor-pointer"
                title="Bỏ lọc danh mục"
              >
                <X size={11} />
              </button>
            </span>
          )}

          {status && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50/80 text-violet-600 font-normal text-[11px] border border-violet-100">
              Trạng thái: {statusOptions[status]}
              <button
                type="button"
                onClick={() => onStatusChange('')}
                className="hover:text-rose-600 cursor-pointer"
                title="Bỏ lọc trạng thái"
              >
                <X size={11} />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
