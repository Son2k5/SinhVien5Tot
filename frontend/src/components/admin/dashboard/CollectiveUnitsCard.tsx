import { Medal } from 'lucide-react';

export interface CollectiveUnitsData {
  qualifiedUnits: number;
  totalUnits: number;
}

interface CollectiveUnitsCardProps {
  collective: CollectiveUnitsData;
}

export function CollectiveUnitsCard({ collective }: CollectiveUnitsCardProps) {
  const percentage =
    collective.totalUnits === 0
      ? 0
      : Math.round((collective.qualifiedUnits * 100) / collective.totalUnits);

  return (
    <section className="p-4 sm:p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
      <header className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-800 m-0">Đơn vị đạt chuẩn</h2>
        <Medal size={18} className="text-amber-500" />
      </header>

      <div className="py-2 text-center">
        <div className="text-3xl font-semibold text-slate-800 tracking-tight">
          {collective.qualifiedUnits}
          <span className="text-base font-normal text-slate-400">
            {' '}/ {collective.totalUnits}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500 font-normal">
          Chi hội, Liên chi hội đã đạt chuẩn
        </p>

        <div className="mt-4 h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-[width] duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <span className="block mt-2 text-[11px] font-semibold text-slate-400">
          {percentage}% tổng số đơn vị
        </span>
      </div>
    </section>
  );
}
