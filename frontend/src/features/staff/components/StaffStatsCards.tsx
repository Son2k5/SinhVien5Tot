import { UserCheck, Users, UserX } from 'lucide-react';

export interface StaffStatsCardsProps {
  total: number;
  activeCount: number;
  lockedCount: number;
}

export function StaffStatsCards({ total, activeCount, lockedCount }: StaffStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3.5 shadow-2xs">
        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <Users size={20} />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-slate-500 font-medium">Tổng số nhân sự</div>
          <div className="text-xl font-bold tracking-tight text-slate-800 font-mono">
            {total.toLocaleString('vi-VN')}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3.5 shadow-2xs">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <UserCheck size={20} />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-slate-500 font-medium">Đang hoạt động</div>
          <div className="text-xl font-bold tracking-tight text-slate-800 font-mono">
            {activeCount.toLocaleString('vi-VN')}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3.5 shadow-2xs">
        <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
          <UserX size={20} />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-slate-500 font-medium">Đã khóa</div>
          <div className="text-xl font-bold tracking-tight text-slate-800 font-mono">
            {lockedCount.toLocaleString('vi-VN')}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StaffStatsCards;
