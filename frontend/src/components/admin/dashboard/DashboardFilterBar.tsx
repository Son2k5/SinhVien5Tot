import { CalendarDays, SlidersHorizontal } from 'lucide-react';
import type { AdminDashboardFilters } from '../../../services/admin/adminDashboardService';

interface DashboardFilterBarProps {
  filters: AdminDashboardFilters;
  onUpdateFilter: (key: keyof AdminDashboardFilters, value: string) => void;
}

export function DashboardFilterBar({
  filters,
  onUpdateFilter,
}: DashboardFilterBarProps) {
  return (
    <section
      className="p-4 sm:p-5 border border-slate-200/80 rounded-2xl bg-white/90 shadow-xs backdrop-blur-xs print:hidden"
      aria-label="Bộ lọc báo cáo"
    >
      <div className="mb-3 flex items-center gap-2 text-slate-700 text-xs font-bold">
        <SlidersHorizontal size={15} className="text-blue-600" />
        <span>Bộ lọc dữ liệu</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <label className="space-y-1 min-w-0">
          <span className="text-[11px] font-semibold text-slate-500 pl-0.5">Chiến dịch</span>
          <select
            value={filters.campaign}
            onChange={(e) => onUpdateFilter('campaign', e.target.value)}
            className="w-full h-9 px-3 text-xs text-slate-700 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors font-medium cursor-pointer"
          >
            <option value="sv5t-2025">SV5T 2025–2026</option>
            <option value="sv5t-2024">SV5T 2024–2025</option>
          </select>
        </label>

        <label className="space-y-1 min-w-0">
          <span className="text-[11px] font-semibold text-slate-500 pl-0.5">Năm học</span>
          <select
            value={filters.schoolYear}
            onChange={(e) => onUpdateFilter('schoolYear', e.target.value)}
            className="w-full h-9 px-3 text-xs text-slate-700 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors font-medium cursor-pointer"
          >
            <option value="2025-2026">2025-2026</option>
            <option value="2024-2025">2024-2025</option>
          </select>
        </label>

        <label className="space-y-1 min-w-0">
          <span className="text-[11px] font-semibold text-slate-500 pl-0.5">Cấp xét duyệt</span>
          <select
            value={filters.level}
            onChange={(e) => onUpdateFilter('level', e.target.value)}
            className="w-full h-9 px-3 text-xs text-slate-700 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors font-medium cursor-pointer"
          >
            <option value="school">Cấp Trường</option>
            <option value="city">Cấp Thành phố</option>
            <option value="central">Cấp Trung ương</option>
          </select>
        </label>

        <label className="space-y-1 min-w-0">
          <span className="text-[11px] font-semibold text-slate-500 pl-0.5">Khoa / Đơn vị</span>
          <select
            value={filters.department}
            onChange={(e) => onUpdateFilter('department', e.target.value)}
            className="w-full h-9 px-3 text-xs text-slate-700 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors font-medium cursor-pointer"
          >
            <option value="all">Tất cả đơn vị</option>
            <option value="it">Công nghệ thông tin</option>
            <option value="economics">Kinh tế</option>
          </select>
        </label>

        <label className="space-y-1 min-w-0">
          <span className="text-[11px] font-semibold text-slate-500 pl-0.5">Từ ngày</span>
          <div className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-[border-color,box-shadow]">
            <CalendarDays size={14} className="text-slate-400 flex-shrink-0" />
            <input
              type="date"
              value={filters.from}
              onChange={(e) => onUpdateFilter('from', e.target.value)}
              className="w-full text-xs text-slate-700 bg-transparent border-none outline-none font-medium"
            />
          </div>
        </label>

        <label className="space-y-1 min-w-0">
          <span className="text-[11px] font-semibold text-slate-500 pl-0.5">Đến ngày</span>
          <div className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-[border-color,box-shadow]">
            <CalendarDays size={14} className="text-slate-400 flex-shrink-0" />
            <input
              type="date"
              value={filters.to}
              onChange={(e) => onUpdateFilter('to', e.target.value)}
              className="w-full text-xs text-slate-700 bg-transparent border-none outline-none font-medium"
            />
          </div>
        </label>
      </div>
    </section>
  );
}
