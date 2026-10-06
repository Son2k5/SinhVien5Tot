import { RefreshCw, Search, Shield, X } from 'lucide-react';
import type { StaffStatus } from '../types/staff.types';

export interface StaffFilterBarProps {
  searchInput: string;
  roleParam: string;
  statusParam: StaffStatus | '';
  isPending: boolean;
  onSearchChange: (value: string) => void;
  onRoleChange: (role: string) => void;
  onStatusChange: (status: string) => void;
  onRefresh: () => void;
  onResetFilters: () => void;
}

export function StaffFilterBar({
  searchInput,
  roleParam,
  statusParam,
  isPending,
  onSearchChange,
  onRoleChange,
  onStatusChange,
  onRefresh,
  onResetFilters,
}: StaffFilterBarProps) {
  const isFiltering = Boolean(roleParam || statusParam || searchInput.trim());

  return (
    <div className="p-4 bg-gradient-to-b from-slate-50/60 to-white border-b border-slate-100 space-y-3">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Box */}
        <div className="relative w-full lg:w-80 shrink-0">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo họ tên, email..."
            className="w-full h-9 rounded-xl border border-slate-200 hover:border-slate-300 bg-white pl-9 pr-8 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          {searchInput && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
              title="Xóa tìm kiếm"
              aria-label="Xóa tìm kiếm"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filter Chips: Role & Status & Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Role Chips */}
          <div className="inline-flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/80">
            <button
              type="button"
              onClick={() => onRoleChange('')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                !roleParam
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả vai trò
            </button>
            <button
              type="button"
              onClick={() => onRoleChange('Mentor')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1 ${
                roleParam === 'Mentor'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Shield size={12} />
              <span>Mentor</span>
            </button>
          </div>

          {/* Status Chips */}
          <div className="inline-flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200/80">
            <button
              type="button"
              onClick={() => onStatusChange('')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                !statusParam
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả trạng thái
            </button>
            <button
              type="button"
              onClick={() => onStatusChange('Active')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1 ${
                statusParam === 'Active'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Hoạt động</span>
            </button>
            <button
              type="button"
              onClick={() => onStatusChange('Locked')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1 ${
                statusParam === 'Locked'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Đã khoá</span>
            </button>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isPending}
            className="h-9 w-9 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-slate-600 hover:text-blue-600 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
            title="Làm mới dữ liệu"
            aria-label="Làm mới dữ liệu"
          >
            <RefreshCw size={14} className={isPending ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Active Filter summary */}
      {isFiltering && (
        <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
          <span>Đang lọc:</span>
          {searchInput.trim() && (
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Từ khóa: "{searchInput.trim()}"
            </span>
          )}
          {roleParam && (
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Vai trò: {roleParam}
            </span>
          )}
          {statusParam && (
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Trạng thái: {statusParam === 'Active' ? 'Hoạt động' : 'Đã khoá'}
            </span>
          )}
          <button
            type="button"
            onClick={onResetFilters}
            className="text-blue-600 hover:underline cursor-pointer ml-1 text-xs"
          >
            Xóa tất cả bộ lọc
          </button>
        </div>
      )}
    </div>
  );
}

export default StaffFilterBar;
