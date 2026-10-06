import React from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import type { ReviewTab } from '../hooks/useEvidenceReviewWorkspace';
import type { CampaignResponse } from '../../campaigns/types/campaign.types';
import { STANDARD_GROUPS } from '../types/application.types';

interface EvidenceReviewFilterBarProps {
  activeTab: ReviewTab;
  search: string;
  setSearch: (val: string) => void;
  debouncedSearch: string;
  campaigns: CampaignResponse[];
  selectedCampaignId: string;
  setSelectedCampaignId: (val: string) => void;
  selectedStandardGroup: string;
  setSelectedStandardGroup: (val: string) => void;
  faculties: string[];
  selectedFaculty: string;
  setSelectedFaculty: (val: string) => void;
  submittedWaitingFilter: 'all' | 'today' | 'over3' | 'over7';
  setSubmittedWaitingFilter: (val: 'all' | 'today' | 'over3' | 'over7') => void;
  revisionStudentStatus: 'all' | 'pending' | 'resubmitted';
  setRevisionStudentStatus: (val: 'all' | 'pending' | 'resubmitted') => void;
  approvedTimeFilter: 'all' | 'today' | 'week' | 'month';
  setApprovedTimeFilter: (val: 'all' | 'today' | 'week' | 'month') => void;
  rejectedReasonCategory: string;
  setRejectedReasonCategory: (val: string) => void;
  activeFiltersCount: number;
  resetAllFilters: () => void;
  setPageIndex: (val: number) => void;
}

export const EvidenceReviewFilterBar: React.FC<EvidenceReviewFilterBarProps> = ({
  activeTab,
  search,
  setSearch,
  debouncedSearch,
  campaigns,
  selectedCampaignId,
  setSelectedCampaignId,
  selectedStandardGroup,
  setSelectedStandardGroup,
  faculties,
  selectedFaculty,
  setSelectedFaculty,
  submittedWaitingFilter,
  setSubmittedWaitingFilter,
  revisionStudentStatus,
  setRevisionStudentStatus,
  approvedTimeFilter,
  setApprovedTimeFilter,
  rejectedReasonCategory,
  setRejectedReasonCategory,
  activeFiltersCount,
  resetAllFilters,
  setPageIndex,
}) => {
  return (
    <div className="px-3 sm:px-4 pt-2.5 pb-2.5 space-y-2 bg-gradient-to-b from-slate-50/70 to-white">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-1.5">
        {/* Search */}
        <div className="relative w-full lg:w-[42%] lg:max-w-[460px] shrink-0">
          <div className="relative flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo họ tên, MSSV, tiêu chí, email..."
              className="w-full h-9 rounded-md border border-slate-300 hover:border-slate-400 bg-white pl-8 pr-8 py-0 text-[12px] leading-9 font-normal text-slate-900 placeholder:text-slate-400 focus:border-[#1683ff] focus:ring-1 focus:ring-[#1683ff]/25 focus:outline-none transition-colors shadow-2xs"
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer transition-colors"
              title="Xóa tìm kiếm"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Filter selectors */}
        <div className="flex flex-1 flex-col sm:flex-row sm:justify-end sm:items-center gap-1.5 lg:pl-2 flex-wrap">
          {/* Chiến dịch selector */}
          <div className="relative w-full sm:w-[170px] shrink-0">
            <select
              value={selectedCampaignId}
              onChange={(e) => {
                setSelectedCampaignId(e.target.value);
                setPageIndex(1);
              }}
              className="appearance-none w-full h-9 rounded-md border border-slate-300 hover:border-slate-400 bg-white pl-2.5 pr-7 py-0 text-[12px] leading-9 font-normal text-slate-800 focus:border-[#1683ff] focus:ring-1 focus:ring-[#1683ff]/25 focus:outline-none cursor-pointer transition-colors shadow-2xs"
            >
              <option value="">Tất cả chiến dịch</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.schoolYear})
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          {/* 5 Tiêu chuẩn selector */}
          <div className="relative w-full sm:w-[155px] shrink-0">
            <select
              value={selectedStandardGroup}
              onChange={(e) => {
                setSelectedStandardGroup(e.target.value);
                setPageIndex(1);
              }}
              className="appearance-none w-full h-9 rounded-md border border-slate-300 hover:border-slate-400 bg-white pl-2.5 pr-7 py-0 text-[12px] leading-9 font-normal text-slate-800 focus:border-[#1683ff] focus:ring-1 focus:ring-[#1683ff]/25 focus:outline-none cursor-pointer transition-colors shadow-2xs"
            >
              <option value="all">5 Tiêu chuẩn: Tất cả</option>
              <option value="Ethics">Đạo đức tốt</option>
              <option value="Study">Học tập tốt</option>
              <option value="Fitness">Thể lực tốt</option>
              <option value="Volunteer">Tình nguyện tốt</option>
              <option value="Integration">Hội nhập tốt</option>
            </select>
            <ChevronDown
              size={13}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          {/* Khoa/Viện selector */}
          <div className="relative w-full sm:w-[145px] shrink-0">
            <select
              value={selectedFaculty}
              onChange={(e) => {
                setSelectedFaculty(e.target.value);
                setPageIndex(1);
              }}
              className="appearance-none w-full h-9 rounded-md border border-slate-300 hover:border-slate-400 bg-white pl-2.5 pr-7 py-0 text-[12px] leading-9 font-normal text-slate-800 focus:border-[#1683ff] focus:ring-1 focus:ring-[#1683ff]/25 focus:outline-none cursor-pointer transition-colors shadow-2xs"
            >
              <option value="all">Tất cả khoa / viện</option>
              {faculties.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          {/* Bộ lọc chuyên biệt cho từng tab */}
          {activeTab === 'Submitted' && (
            <div className="relative w-full sm:w-[140px] shrink-0">
              <select
                value={submittedWaitingFilter}
                onChange={(e) => {
                  setSubmittedWaitingFilter(e.target.value as 'all' | 'today' | 'over3' | 'over7');
                  setPageIndex(1);
                }}
                className="appearance-none w-full h-9 rounded-md border border-slate-300 hover:border-slate-400 bg-white pl-2.5 pr-7 py-0 text-[12px] leading-9 font-normal text-slate-800 focus:border-[#1683ff] focus:ring-1 focus:ring-[#1683ff]/25 focus:outline-none cursor-pointer transition-colors shadow-2xs"
              >
                <option value="all">Thời gian: Tất cả</option>
                <option value="today">Hôm nay</option>
                <option value="over3">Quá 3 ngày</option>
                <option value="over7">Quá 7 ngày</option>
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          )}

          {activeTab === 'NeedsRevision' && (
            <div className="relative w-full sm:w-[150px] shrink-0">
              <select
                value={revisionStudentStatus}
                onChange={(e) => {
                  setRevisionStudentStatus(e.target.value as 'all' | 'pending' | 'resubmitted');
                  setPageIndex(1);
                }}
                className="appearance-none w-full h-9 rounded-md border border-slate-300 hover:border-slate-400 bg-white pl-2.5 pr-7 py-0 text-[12px] leading-9 font-normal text-slate-800 focus:border-[#1683ff] focus:ring-1 focus:ring-[#1683ff]/25 focus:outline-none cursor-pointer transition-colors shadow-2xs"
              >
                <option value="all">Tình trạng: Tất cả</option>
                <option value="pending">Chưa cập nhật lại</option>
                <option value="resubmitted">Đã nộp lại chờ duyệt</option>
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          )}

          {activeTab === 'Approved' && (
            <div className="relative w-full sm:w-[140px] shrink-0">
              <select
                value={approvedTimeFilter}
                onChange={(e) => {
                  setApprovedTimeFilter(e.target.value as 'all' | 'today' | 'week' | 'month');
                  setPageIndex(1);
                }}
                className="appearance-none w-full h-9 rounded-md border border-slate-300 hover:border-slate-400 bg-white pl-2.5 pr-7 py-0 text-[12px] leading-9 font-normal text-slate-800 focus:border-[#1683ff] focus:ring-1 focus:ring-[#1683ff]/25 focus:outline-none cursor-pointer transition-colors shadow-2xs"
              >
                <option value="all">Duyệt: Tất cả</option>
                <option value="today">Hôm nay</option>
                <option value="week">Tuần này</option>
                <option value="month">Tháng này</option>
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          )}

          {activeTab === 'Rejected' && (
            <div className="relative w-full sm:w-[155px] shrink-0">
              <select
                value={rejectedReasonCategory}
                onChange={(e) => {
                  setRejectedReasonCategory(e.target.value);
                  setPageIndex(1);
                }}
                className="appearance-none w-full h-9 rounded-md border border-slate-300 hover:border-slate-400 bg-white pl-2.5 pr-7 py-0 text-[12px] leading-9 font-normal text-slate-800 focus:border-[#1683ff] focus:ring-1 focus:ring-[#1683ff]/25 focus:outline-none cursor-pointer transition-colors shadow-2xs"
              >
                <option value="all">Lý do: Tất cả</option>
                <option value="năm học">Không đúng năm học</option>
                <option value="hợp lệ">Không hợp lệ</option>
                <option value="mờ">Mờ / thiếu dấu mộc</option>
                <option value="danh mục">Ngoài danh mục</option>
              </select>
              <ChevronDown
                size={13}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          )}

          {/* Nút reset filter */}
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="h-9 px-2.5 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-md transition-colors cursor-pointer inline-flex items-center gap-1"
              title="Đặt lại tất cả bộ lọc"
            >
              <X size={12} />
              <span>Xóa lọc</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFiltersCount > 0 && (
        <div className="pt-0.5 flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="text-[11px] font-normal text-slate-500 mr-0.5">Đang lọc:</span>

          {debouncedSearch.trim() && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100/80 text-slate-600 font-normal text-[11px]">
              "{debouncedSearch}"
              <button
                type="button"
                onClick={() => setSearch('')}
                className="hover:text-rose-600 cursor-pointer"
              >
                <X size={11} />
              </button>
            </span>
          )}

          {selectedCampaignId && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50/80 text-blue-600 font-normal text-[11px] border border-blue-100">
              Chiến dịch: {campaigns.find((c) => c.id === selectedCampaignId)?.name || 'Đã chọn'}
              <button
                type="button"
                onClick={() => setSelectedCampaignId('')}
                className="hover:text-rose-600 cursor-pointer"
              >
                <X size={11} />
              </button>
            </span>
          )}

          {selectedStandardGroup !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50/80 text-blue-600 font-normal text-[11px] border border-blue-100">
              Tiêu chuẩn:{' '}
              {STANDARD_GROUPS[selectedStandardGroup]?.label || selectedStandardGroup}
              <button
                type="button"
                onClick={() => setSelectedStandardGroup('all')}
                className="hover:text-rose-600 cursor-pointer"
              >
                <X size={11} />
              </button>
            </span>
          )}

          {selectedFaculty !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50/80 text-blue-600 font-normal text-[11px] border border-blue-100">
              Khoa: {selectedFaculty}
              <button
                type="button"
                onClick={() => setSelectedFaculty('all')}
                className="hover:text-rose-600 cursor-pointer"
              >
                <X size={11} />
              </button>
            </span>
          )}

          {activeTab === 'Submitted' && submittedWaitingFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50/80 text-amber-700 font-normal text-[11px] border border-amber-200">
              Chờ:{' '}
              {submittedWaitingFilter === 'today'
                ? 'Hôm nay'
                : submittedWaitingFilter === 'over3'
                ? 'Quá 3 ngày'
                : 'Quá 7 ngày'}
              <button
                type="button"
                onClick={() => setSubmittedWaitingFilter('all')}
                className="hover:text-rose-600 cursor-pointer"
              >
                <X size={11} />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};
