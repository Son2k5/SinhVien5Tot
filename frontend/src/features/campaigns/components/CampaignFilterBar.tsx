import { AwardLevel, CampaignStatus } from '../types/campaign.types';
import { ChevronDown, RotateCcw, Search, X } from 'lucide-react';

export interface CampaignFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  level: AwardLevel | '';
  onLevelChange: (value: AwardLevel | '') => void;
  status: CampaignStatus | '';
  onStatusChange: (value: CampaignStatus | '') => void;
  schoolYear: string;
  onSchoolYearChange: (value: string) => void;
  activeFilterCount: number;
  onReset: () => void;
}

export function CampaignFilterBar({
  searchQuery,
  onSearchChange,
  level,
  onLevelChange,
  status,
  onStatusChange,
  schoolYear,
  onSchoolYearChange,
  activeFilterCount,
  onReset,
}: CampaignFilterBarProps) {
  return (
    <>
      <div className="px-3 sm:px-4 pt-2.5 pb-2.5 bg-gradient-to-b from-slate-50/70 to-white">
        <div className="filter-no-ring flex flex-col lg:flex-row items-stretch lg:items-center gap-1.5">
          {/* Search - ngan 1 nua, nam ben trai */}
          <div className="relative w-full lg:w-[46%] lg:max-w-[490px] shrink-0">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Tìm theo tên chiến dịch, năm học..."
                aria-label="Tìm theo tên chiến dịch, năm học"
                className="w-full h-9 rounded-md border border-slate-300 hover:border-slate-400 bg-white pl-8 pr-8 py-0 text-[12px] leading-9 font-normal text-slate-900 placeholder:text-slate-400 focus:border-[#1683ff] focus:ring-1 focus:ring-[#1683ff]/25 focus:outline-none transition-colors shadow-2xs"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
            {searchQuery && (
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

          {/* Cum phai: selects + nam hoc + nut reset */}
          <div className="flex flex-1 flex-col sm:flex-row sm:justify-end sm:items-center gap-1.5 lg:pl-2">
            <div className="flex flex-wrap sm:flex-nowrap w-full sm:w-auto gap-1.5">
              {/* Level select */}
              <div className="relative w-full sm:w-[145px] shrink-0">
                <select
                  value={level}
                  onChange={(e) => onLevelChange(e.target.value ? (e.target.value as AwardLevel) : '')}
                  className="appearance-none w-full h-9 rounded-md border border-slate-300 hover:border-slate-400 bg-white pl-2.5 pr-7 py-0 text-[12px] leading-9 font-normal text-slate-800 focus:border-[#1683ff] focus:ring-1 focus:ring-[#1683ff]/25 focus:outline-none cursor-pointer transition-colors shadow-2xs"
                >
                  <option value="">Tất cả cấp xét</option>
                  <option value={AwardLevel.School}>Cấp Trường</option>
                  <option value={AwardLevel.City}>Cấp Thành phố</option>
                  <option value={AwardLevel.Central}>Cấp Trung ương</option>
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* Status select */}
              <div className="relative w-full sm:w-[155px] shrink-0">
                <select
                  value={status}
                  onChange={(e) => onStatusChange(e.target.value ? (e.target.value as CampaignStatus) : '')}
                  className="appearance-none w-full h-9 rounded-md border border-slate-300 hover:border-slate-400 bg-white pl-2.5 pr-7 py-0 text-[12px] leading-9 font-normal text-slate-800 focus:border-[#1683ff] focus:ring-1 focus:ring-[#1683ff]/25 focus:outline-none cursor-pointer transition-colors shadow-2xs"
                >
                  <option value="">Tất cả trạng thái</option>
                  <option value={CampaignStatus.Draft}>Bản nháp</option>
                  <option value={CampaignStatus.Open}>Đang mở đăng ký</option>
                  <option value={CampaignStatus.Closed}>Đã đóng đăng ký</option>
                  <option value={CampaignStatus.Reviewing}>Đang xét duyệt</option>
                  <option value={CampaignStatus.Published}>Đã công bố</option>
                  <option value={CampaignStatus.Archived}>Đã lưu trữ</option>
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* School Year input */}
              <div className="relative w-full sm:w-[145px] shrink-0">
                <input
                  type="text"
                  value={schoolYear}
                  onChange={(e) => onSchoolYearChange(e.target.value)}
                  placeholder="Năm học (VD: 25-26)"
                  className="w-full h-9 rounded-md border border-slate-300 hover:border-slate-400 bg-white pl-2.5 pr-7 py-0 text-[12px] leading-9 font-normal text-slate-800 placeholder:text-slate-400 focus:border-[#1683ff] focus:ring-1 focus:ring-[#1683ff]/25 focus:outline-none transition-colors shadow-2xs"
                />
                {schoolYear && (
                  <button
                    type="button"
                    onClick={() => onSchoolYearChange('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer transition-colors"
                    title="Xóa năm học"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Reset Filters button if any filter active */}
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={onReset}
                  className="h-9 px-2.5 text-[12px] font-normal text-rose-600 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 rounded-md inline-flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  title="Xóa toàn bộ bộ lọc"
                >
                  <RotateCcw size={11} />
                  <span>Xóa lọc ({activeFilterCount})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Short divider separating filter / table */}
      <div className="flex items-center gap-2 px-2 sm:px-6 pt-0 pb-2.5">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-slate-200" />
        <div className="flex-1 h-px bg-gradient-to-l from-transparent via-slate-200 to-slate-200" />
      </div>
    </>
  );
}
