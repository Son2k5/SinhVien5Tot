import type { LucideIcon } from 'lucide-react';

export interface DashboardKpiItem {
  label: string;
  value: string | number;
  change: string;
  tone?: string;
  alert?: boolean;
  icon: LucideIcon;
}

interface DashboardKpiGridProps {
  kpis: DashboardKpiItem[];
}

const toneStyles: Record<
  string,
  { iconBg: string; iconColor: string; shadow: string }
> = {
  blue: {
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    shadow: 'hover:shadow-blue-500/10',
  },
  cyan: {
    iconBg: 'bg-cyan-50',
    iconColor: 'text-cyan-600',
    shadow: 'hover:shadow-cyan-500/10',
  },
  amber: {
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    shadow: 'hover:shadow-amber-500/10',
  },
  emerald: {
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    shadow: 'hover:shadow-emerald-500/10',
  },
  violet: {
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    shadow: 'hover:shadow-violet-500/10',
  },
};

export function DashboardKpiGrid({ kpis }: DashboardKpiGridProps) {
  return (
    <section
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3.5"
      aria-label="Chỉ số tổng quan"
    >
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const style = (kpi.tone && toneStyles[kpi.tone]) || toneStyles.blue;

        return (
          <article
            key={kpi.label}
            className={`p-4 sm:p-5 bg-white border rounded-2xl shadow-xs transition-all hover:shadow-md ${style.shadow} ${
              kpi.alert ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${style.iconBg} ${style.iconColor}`}
              >
                <Icon size={20} />
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  kpi.alert
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                {kpi.change}
              </span>
            </div>

            <div className="mt-3">
              <span className="block text-2xl font-bold text-slate-900 tracking-tight">
                {typeof kpi.value === 'number'
                  ? kpi.value.toLocaleString('vi-VN')
                  : kpi.value}
              </span>
              <p className="mt-1 text-xs text-slate-500 font-medium">{kpi.label}</p>
            </div>
          </article>
        );
      })}
    </section>
  );
}
