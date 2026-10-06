import { Search, X, ChevronDown, RotateCcw } from 'lucide-react';
import type { CampaignResponse } from '../../campaigns/types/campaign.types';
import { APPLICATION_STATUS_CONFIG } from '../types/application.types';

interface ApplicationFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  debouncedSearch: string;
  campaigns: CampaignResponse[];
  selectedCampaignId: string;
  onCampaignChange: (campaignId: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  onResetFilters: () => void;
}

export function ApplicationFilterBar({
  search,
  onSearchChange,
  debouncedSearch,
  campaigns,
  selectedCampaignId,
  onCampaignChange,
  selectedStatus,
  onStatusChange,
  onResetFilters,
}: ApplicationFilterBarProps) {
  const hasActiveFilters = Boolean(
    debouncedSearch.trim() || selectedCampaignId || selectedStatus
  );

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
                placeholder="Tìm theo họ tên, MSSV, mã hồ sơ, lớp, khoa..."
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

          {/* Right cluster: Campaign select + Status select */}
          <div className="flex flex-1 flex-col sm:flex-row sm:justify-end sm:items-center gap-1.5 lg:pl-2">
            {/* Campaign Select */}
            <div className="relative w-full sm:w-[220px] shrink-0">
              <select
                value={selectedCampaignId}
                onChange={(e) => onCampaignChange(e.target.value)}
                className="appearance-none w-full h-9 rounded-md border border-slate-300 hover:border-slate-400 bg-white pl-2.5 pr-7 py-0 text-[12px] leading-9 font-normal text-slate-800 focus:border-[#1683ff] focus:ring-1 focus:ring-[#1683ff]/25 focus:outline-none cursor-pointer transition-colors shadow-2xs truncate"
              >
                <option value="">Tất cả đợt xét</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>

            {/* Status Select */}
            <div className="relative w-full sm:w-[170px] shrink-0">
              <select
                value={selectedStatus}
                onChange={(e) => onStatusChange(e.target.value)}
                className="appearance-none w-full h-9 rounded-md border border-slate-300 hover:border-slate-400 bg-white pl-2.5 pr-7 py-0 text-[12px] leading-9 font-normal text-slate-800 focus:border-[#1683ff] focus:ring-1 focus:ring-[#1683ff]/25 focus:outline-none cursor-pointer transition-colors shadow-2xs"
              >
                <option value="">Tất cả trạng thái</option>
                {Object.entries(APPLICATION_STATUS_CONFIG).map(([st, cfg]) => (
                  <option key={st} value={st}>
                    {cfg.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="h-9 px-2.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-[12px] inline-flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                title="Đặt lại bộ lọc"
              >
                <RotateCcw size={12} />
                <span>Đặt lại</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-2 px-2 sm:px-6 pt-0 pb-2.5">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-200 to-slate-200" />
        <div className="flex-1 h-px bg-gradient-to-l from-transparent via-slate-200 to-slate-200" />
      </div>
    </>
  );
}
