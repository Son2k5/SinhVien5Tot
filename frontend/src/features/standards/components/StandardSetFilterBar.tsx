import {
  AwardLevel,
  AwardType,
  AWARD_LEVEL_LABELS,
  AWARD_TYPE_LABELS,
} from '../../campaigns/types/campaign.types';
import {
  StandardSetStatus,
  STANDARD_SET_STATUS_LABELS,
} from '../types/standard.types';
import { ChevronDown, RotateCcw, Search, X } from 'lucide-react';

export interface StandardSetFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  levelFilter: AwardLevel | '';
  onLevelChange: (value: AwardLevel | '') => void;
  typeFilter: AwardType | '';
  onTypeChange: (value: AwardType | '') => void;
  statusFilter: StandardSetStatus | '';
  onStatusChange: (value: StandardSetStatus | '') => void;
  filterCount: number;
  onReset: () => void;
}

export function StandardSetFilterBar({
  searchQuery,
  onSearchChange,
  levelFilter,
  onLevelChange,
  typeFilter,
  onTypeChange,
  statusFilter,
  onStatusChange,
  filterCount,
  onReset,
}: StandardSetFilterBarProps) {
  return (
    <>
      <div className="px-3 sm:px-4 pt-2.5 pb-2.5 space-y-1 bg-gradient-to-b from-slate-50/70 to-white">
        <div className="filter-no-ring flex flex-col lg:flex-row items-stretch lg:items-center gap-1.5">
          {/* Search - bên trái, h-9, text-12px */}
          <div className="relative w-full lg:w-[46%] lg:max-w-[490px] shrink-0">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Tìm kiếm theo tên bộ tiêu chuẩn, năm học, cấp xét..."
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

          {/* Cụm phải: 3 selects w-[150px], h-9, text-12px */}
          <div className="flex flex-1 flex-col sm:flex-row sm:justify-end sm:items-center gap-1.5 lg:pl-2">
            <div className="flex w-full sm:w-auto flex-wrap sm:flex-nowrap gap-1.5">
              {/* Level filter */}
              <div className="relative w-full sm:w-[150px] shrink-0">
                <select
                  value={levelFilter}
                  onChange={(e) =>
                    onLevelChange(e.target.value ? (e.target.value as AwardLevel) : '')
                  }
                  className="appearance-none w-full h-9 rounded-md border border-slate-300 hover:border-slate-400 bg-white pl-2.5 pr-7 py-0 text-[12px] leading-9 font-normal text-slate-800 focus:border-[#1683ff] focus:ring-1 focus:ring-[#1683ff]/25 focus:outline-none cursor-pointer transition-colors shadow-2xs"
                >
                  <option value="">Tất cả Cấp xét</option>
                  <option value={AwardLevel.School}>{AWARD_LEVEL_LABELS[AwardLevel.School]}</option>
                  <option value={AwardLevel.City}>{AWARD_LEVEL_LABELS[AwardLevel.City]}</option>
                  <option value={AwardLevel.Central}>{AWARD_LEVEL_LABELS[AwardLevel.Central]}</option>
                </select>
                <ChevronDown
                  size={13}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>

              {/* Award Type filter */}
              <div className="relative w-full sm:w-[150px] shrink-0">
                <select
                  value={typeFilter}
                  onChange={(e) =>
                    onTypeChange(e.target.value ? (e.target.value as AwardType) : '')
                  }
                  className="appearance-none w-full h-9 rounded-md border border-slate-300 hover:border-slate-400 bg-white pl-2.5 pr-7 py-0 text-[12px] leading-9 font-normal text-slate-800 focus:border-[#1683ff] focus:ring-1 focus:ring-[#1683ff]/25 focus:outline-none cursor-pointer transition-colors shadow-2xs"
                >
                  <option value="">Tất cả Đối tượng</option>
                  <option value={AwardType.Individual}>{AWARD_TYPE_LABELS[AwardType.Individual]}</option>
                  <option value={AwardType.Collective}>{AWARD_TYPE_LABELS[AwardType.Collective]}</option>
                </select>
                <ChevronDown
                  size={13}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>

              {/* Status filter */}
              <div className="relative w-full sm:w-[150px] shrink-0">
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    onStatusChange(e.target.value ? (e.target.value as StandardSetStatus) : '')
                  }
                  className="appearance-none w-full h-9 rounded-md border border-slate-300 hover:border-slate-400 bg-white pl-2.5 pr-7 py-0 text-[12px] leading-9 font-normal text-slate-800 focus:border-[#1683ff] focus:ring-1 focus:ring-[#1683ff]/25 focus:outline-none cursor-pointer transition-colors shadow-2xs"
                >
                  <option value="">Tất cả Trạng thái</option>
                  <option value={StandardSetStatus.Published}>{STANDARD_SET_STATUS_LABELS[StandardSetStatus.Published]}</option>
                  <option value={StandardSetStatus.Draft}>{STANDARD_SET_STATUS_LABELS[StandardSetStatus.Draft]}</option>
                  <option value={StandardSetStatus.Archived}>{STANDARD_SET_STATUS_LABELS[StandardSetStatus.Archived]}</option>
                </select>
                <ChevronDown
                  size={13}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
              </div>

              {/* Reset filter button */}
              {filterCount > 0 && (
                <button
                  type="button"
                  onClick={onReset}
                  className="h-9 px-2.5 text-[12px] font-normal text-rose-600 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 rounded-md inline-flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  title="Xóa toàn bộ bộ lọc"
                >
                  <RotateCcw size={11} />
                  <span>Xóa lọc ({filterCount})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Đường phân cách mảnh giữa Filter và Table */}
      <div className="flex items-center gap-2 px-2 sm:px-6 pt-0 pb-2.5">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-slate-200" />
        <div className="flex-1 h-px bg-gradient-to-l from-transparent via-slate-200 to-slate-200" />
      </div>
    </>
  );
}
