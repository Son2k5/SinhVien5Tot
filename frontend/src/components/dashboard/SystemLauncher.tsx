import type { RefObject } from 'react';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  Award,
  Bell,
  Bookmark,
  ChartNoAxesColumnIncreasing,
  ChevronRight,
  FileCheck2,
  Flag,
  GraduationCap,
  HeartHandshake,
  Home,
  Landmark,
  LogOut,
  Newspaper,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  UserRound,
  X,
} from 'lucide-react';
import type { SystemFeature } from '../../types/welcome';

interface SystemLauncherProps {
  open: boolean;
  searchValue: string;
  featureGroups: Record<string, SystemFeature[]>;
  filteredCount: number;
  searchInputRef: RefObject<HTMLInputElement | null>;
  onSearchChange: (value: string) => void;
  onClose: () => void;
  onLogout: () => void;
}

const iconMap: Record<string, LucideIcon> = {
  home: Home,
  newspaper: Newspaper,
  award: Award,
  'file-check': FileCheck2,
  flag: Flag,
  chart: ChartNoAxesColumnIncreasing,
  users: Users,
  bookmark: Bookmark,
  sparkles: Sparkles,
  bell: Bell,
  'shield-check': ShieldCheck,
  landmark: Landmark,
  'graduation-cap': GraduationCap,
  'heart-handshake': HeartHandshake,
  'user-round': UserRound,
};

function getIcon(name: string): LucideIcon {
  return iconMap[name] ?? Sparkles;
}

export function SystemLauncher({
  open,
  searchValue,
  featureGroups,
  filteredCount,
  searchInputRef,
  onSearchChange,
  onClose,
  onLogout,
}: SystemLauncherProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-sm transition-opacity duration-200 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        aria-label="Danh sách chức năng hệ thống"
        aria-hidden={!open}
        className={`fixed top-0 bottom-0 left-0 z-50 w-full max-w-md bg-white border-r border-slate-200 shadow-2xl flex flex-col transition-transform duration-200 ease-out ${
          open ? 'translate-x-0 pointer-events-auto' : '-translate-x-full pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Chức năng hệ thống</h2>
          </div>
          <button
            type="button"
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            onClick={onClose}
            aria-label="Đóng"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 sm:p-5 border-b border-slate-100">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="search"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm kiếm nhanh chức năng..."
              aria-label="Tìm chức năng"
              className="w-full h-10 pl-10 pr-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 font-medium placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-[border-color,box-shadow,background-color]"
            />
          </div>
        </div>

        {/* Feature Groups */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6">
          {filteredCount === 0 ? (
            <div className="py-12 text-center">
              <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800">Không tìm thấy chức năng</p>
              <p className="text-xs text-slate-500 mt-0.5">Thử tìm bằng một từ khóa khác nhé.</p>
            </div>
          ) : (
            Object.entries(featureGroups).map(([group, features]) => (
              <div key={group} className="space-y-2.5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                  {group}
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {features.map((feature) => {
                    const FeatureIcon = getIcon(feature.icon);
                    return feature.isAvailable ? (
                      <Link
                        key={feature.key}
                        to={feature.route}
                        onClick={onClose}
                        className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-blue-50/40 hover:border-blue-200/80 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div className="w-9 h-9 rounded-lg bg-white border border-slate-200/80 group-hover:border-blue-200 text-blue-600 flex items-center justify-center flex-shrink-0 transition-colors">
                            <FeatureIcon className="w-4.5 h-4.5" />
                          </div>
                          <div className="truncate">
                            <h4 className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 truncate transition-colors">
                              {feature.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 truncate font-normal">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-[color,transform] flex-shrink-0" />
                      </Link>
                    ) : (
                      <div
                        key={feature.key}
                        className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/30 opacity-60 cursor-not-allowed"
                      >
                        <div className="flex items-center gap-3 min-w-0 pr-2">
                          <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-400 flex items-center justify-center flex-shrink-0">
                            <FeatureIcon className="w-4.5 h-4.5" />
                          </div>
                          <div className="truncate">
                            <h4 className="text-xs font-semibold text-slate-700 truncate">
                              {feature.title}
                            </h4>
                            <p className="text-[11px] text-slate-400 truncate font-normal">
                              {feature.description}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full flex-shrink-0">
                          {feature.badge || 'Sắp mở'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50/40">
          <button
            type="button"
            onClick={onLogout}
            className="w-full h-10 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-100 flex items-center justify-center gap-2 text-xs font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất tài khoản</span>
          </button>
        </div>
      </aside>
    </>
  );
}
