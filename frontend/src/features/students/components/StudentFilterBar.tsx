import { Search, X, ChevronDown, SlidersHorizontal } from 'lucide-react';

interface StudentFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  debouncedSearch: string;
  activeF: string;
  onActiveChange: (value: string) => void;
  onOpenFilterModal: () => void;
  advancedFilterCount: number;
  totalFilterCount: number;
  faculty: string;
  onClearFaculty: () => void;
  major: string;
  onClearMajor: () => void;
  cls: string;
  onClearCls: () => void;
  cohort: string;
  onClearCohort: () => void;
  schoolYear: string;
  onClearSchoolYear: () => void;
  showDeleted: boolean;
  onClearShowDeleted: () => void;
  onClearActive: () => void;
}

export function StudentFilterBar({
  search,
  onSearchChange,
  debouncedSearch,
  activeF,
  onActiveChange,
  onOpenFilterModal,
  advancedFilterCount,
  totalFilterCount,
  faculty,
  onClearFaculty,
  major,
  onClearMajor,
  cls,
  onClearCls,
  cohort,
  onClearCohort,
  schoolYear,
  onClearSchoolYear,
  showDeleted,
  onClearShowDeleted,
  onClearActive,
}: StudentFilterBarProps) {
  return (
    <>
      <div className="px-3 sm:px-4 pt-2.5 pb-2.5 space-y-1 bg-gradient-to-b from-slate-50/70 to-white">
        <div className="filter-no-ring flex flex-col lg:flex-row items-stretch lg:items-center gap-1.5">
          {/* Search */}
          <div className="relative w-full lg:w-[46%] lg:max-w-[490px] shrink-0">
            <div className="relative flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Tìm kiếm theo họ tên, mã sinh viên (MSSV), email..."
                className="w-full h-9 rounded-md border border-slate-300 hover:border-slate-400 bg-white pl-8 pr-8 py-0 text-[12px] leading-9 font-normal text-slate-900 placeholder:text-slate-400 focus:border-[#1683ff] focus:ring-1 focus:ring-[#1683ff]/25 focus:outline-none transition-colors shadow-2xs"
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

          {/* Right cluster: select + advanced filter icon */}
          <div className="flex flex-1 flex-col sm:flex-row sm:justify-end sm:items-center gap-1.5 lg:pl-2">
            <div className="flex w-full sm:w-auto gap-1.5">
              <div className="relative w-full sm:w-[170px] shrink-0">
                <select
                  value={activeF}
                  onChange={(e) => onActiveChange(e.target.value)}
                  className="appearance-none w-full h-9 rounded-md border border-slate-300 hover:border-slate-400 bg-white pl-2.5 pr-7 py-0 text-[12px] leading-9 font-normal text-slate-800 focus:border-[#1683ff] focus:ring-1 focus:ring-[#1683ff]/25 focus:outline-none cursor-pointer transition-colors shadow-2xs"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value="1">Đang hoạt động</option>
                  <option value="0">Vô hiệu hoá</option>
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="w-full sm:w-auto flex items-center justify-end shrink-0">
              <button
                type="button"
                onClick={onOpenFilterModal}
                title="Bộ lọc nâng cao"
                aria-label="Bộ lọc nâng cao"
                className={`relative h-9 w-9 p-0 rounded-md inline-flex items-center justify-center border transition-all cursor-pointer shadow-2xs ${
                  advancedFilterCount > 0
                    ? 'bg-[#1683ff] text-white border-[#1683ff] shadow-[0_6px_16px_-6px_rgba(22,131,255,0.55)] hover:bg-[#0866db]'
                    : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400 hover:text-[#0866db] hover:bg-[#f1f9ff]'
                }`}
              >
                <SlidersHorizontal size={13} />
                {advancedFilterCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-[#102340] text-white text-[11px] font-medium flex items-center justify-center">
                    {advancedFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {totalFilterCount > 0 && (
          <div className="pt-0.5 flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-[11px] font-normal text-slate-500 mr-0.5">Đang lọc:</span>

            {debouncedSearch.trim() && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100/80 text-slate-600 font-normal text-[11px]">
                "{debouncedSearch}"
                <button type="button" onClick={() => onSearchChange('')} className="hover:text-rose-600 cursor-pointer">
                  <X size={11} />
                </button>
              </span>
            )}

            {faculty.trim() && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50/80 text-blue-600 font-normal text-[11px] border border-blue-100">
                Khoa: {faculty}
                <button type="button" onClick={onClearFaculty} className="hover:text-rose-600 cursor-pointer">
                  <X size={11} />
                </button>
              </span>
            )}

            {major.trim() && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50/80 text-blue-600 font-normal text-[11px] border border-blue-100">
                Ngành: {major}
                <button type="button" onClick={onClearMajor} className="hover:text-rose-600 cursor-pointer">
                  <X size={11} />
                </button>
              </span>
            )}

            {cls.trim() && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50/80 text-blue-600 font-normal text-[11px] border border-blue-100">
                Lớp: {cls}
                <button type="button" onClick={onClearCls} className="hover:text-rose-600 cursor-pointer">
                  <X size={11} />
                </button>
              </span>
            )}

            {cohort.trim() && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50/80 text-blue-600 font-normal text-[11px] border border-blue-100">
                Khóa: {cohort}
                <button type="button" onClick={onClearCohort} className="hover:text-rose-600 cursor-pointer">
                  <X size={11} />
                </button>
              </span>
            )}

            {schoolYear.trim() && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50/80 text-blue-600 font-normal text-[11px] border border-blue-100">
                Năm: {schoolYear}
                <button type="button" onClick={onClearSchoolYear} className="hover:text-rose-600 cursor-pointer">
                  <X size={11} />
                </button>
              </span>
            )}

            {activeF !== '' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50/80 text-violet-600 font-normal text-[11px] border border-violet-100">
                {activeF === '1' ? 'Đang hoạt động' : 'Vô hiệu hóa'}
                <button type="button" onClick={onClearActive} className="hover:text-rose-600 cursor-pointer">
                  <X size={11} />
                </button>
              </span>
            )}

            {showDeleted && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50/80 text-rose-600 font-normal text-[11px] border border-rose-100">
                Đã xóa
                <button type="button" onClick={onClearShowDeleted} className="hover:text-rose-600 cursor-pointer">
                  <X size={11} />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-2 px-2 sm:px-6 pt-0 pb-2.5">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-slate-200" />
        <div className="flex-1 h-px bg-gradient-to-l from-transparent via-slate-200 to-slate-200" />
      </div>
    </>
  );
}
