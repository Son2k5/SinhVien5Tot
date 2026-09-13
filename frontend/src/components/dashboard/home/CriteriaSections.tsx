import { ArrowUpRight, Check, TrendingUp } from 'lucide-react';
import type { CriterionProgress } from '../../../types/welcome';
import type { CriterionDefinition } from './homeDashboardConfig';
import { calculateAverageProgress } from './homeDashboardConfig';

interface CriteriaSectionProps {
  criteria: CriterionDefinition[];
  progressItems: CriterionProgress[];
  onSelect: (criterion: CriterionDefinition) => void;
}

const toneStyles: Record<string, { badge: string; text: string; bar: string; iconBg: string }> = {
  blue: { badge: 'bg-blue-50 text-blue-600 border-blue-100', text: 'text-blue-600', bar: 'bg-blue-500', iconBg: 'bg-blue-50 text-blue-600' },
  green: { badge: 'bg-emerald-50 text-emerald-600 border-emerald-100', text: 'text-emerald-600', bar: 'bg-emerald-500', iconBg: 'bg-emerald-50 text-emerald-600' },
  orange: { badge: 'bg-amber-50 text-amber-600 border-amber-100', text: 'text-amber-600', bar: 'bg-amber-500', iconBg: 'bg-amber-50 text-amber-600' },
  purple: { badge: 'bg-purple-50 text-purple-600 border-purple-100', text: 'text-purple-600', bar: 'bg-purple-500', iconBg: 'bg-purple-50 text-purple-600' },
  pink: { badge: 'bg-rose-50 text-rose-600 border-rose-100', text: 'text-rose-600', bar: 'bg-rose-500', iconBg: 'bg-rose-50 text-rose-600' },
};

export function FiveGoodJourneySection({ criteria, progressItems, onSelect }: CriteriaSectionProps) {
  const averageProgress = calculateAverageProgress(progressItems);
  const totalCompletedReqs = progressItems.reduce((total, item) => total + item.completedRequirements, 0);
  const totalReqs = progressItems.reduce((total, item) => total + item.totalRequirements, 0);

  return (
    <section className="space-y-4 sm:space-y-5 scroll-mt-24" aria-labelledby="journey-title">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold text-blue-600 tracking-wider uppercase">Tiến độ 5 tiêu chí</span>
          <h2 id="journey-title" className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Hành trình Sinh Viên 5 Tốt
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 font-normal">
          Chọn một tiêu chí để xem tiến độ và yêu cầu minh chứng chi tiết
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left: Overall Progress Overview Card */}
        <div className="lg:col-span-4 bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-600 tracking-wider uppercase">Bức tranh tổng thể</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>

            {/* Circular Gauge */}
            <div className="py-4 flex flex-col items-center justify-center">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-slate-100"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    className="stroke-blue-600 transition-[stroke-dashoffset] duration-700 ease-out"
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - averageProgress / 100)}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute text-center space-y-0.5">
                  <span className="text-3xl font-bold text-slate-900 tracking-tight">{averageProgress}%</span>
                  <span className="block text-[11px] text-slate-500 font-medium">Hoàn thành</span>
                </div>
              </div>
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-sm font-semibold text-slate-900">
                {averageProgress >= 80 ? 'Bạn sắp chạm tới mục tiêu!' : 'Bạn đang đi đúng hướng!'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Tiếp tục bổ sung minh chứng để hoàn thiện hồ sơ cho cả 5 tiêu chí.
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-center">
            <div className="space-y-0.5">
              <span className="text-lg font-bold text-slate-900">05</span>
              <span className="block text-[11px] text-slate-500 font-medium">Tiêu chí xét</span>
            </div>
            <div className="space-y-0.5 border-l border-slate-100">
              <span className="text-lg font-bold text-blue-600">{totalCompletedReqs}/{totalReqs}</span>
              <span className="block text-[11px] text-slate-500 font-medium">Yêu cầu đạt</span>
            </div>
          </div>
        </div>

        {/* Right: 5 Criteria Grid */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3.5" aria-label="Tiến độ từng tiêu chí">
          {criteria.map((criterion, idx) => {
            const CriterionIcon = criterion.icon;
            const progress = progressItems.find((item) => item.key === criterion.key);
            const style = toneStyles[criterion.tone] ?? toneStyles.blue;
            const pct = progress?.progress ?? 0;
            const isLastOdd = idx === criteria.length - 1 && criteria.length % 2 !== 0;

            return (
              <button
                key={criterion.key}
                type="button"
                onClick={() => onSelect(criterion)}
                className={`group bg-white border border-slate-200/90 hover:border-blue-300 rounded-2xl p-4.5 sm:p-5 text-left shadow-sm hover:shadow-md transition-all duration-150 flex flex-col justify-between space-y-4 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 ${
                  isLastOdd ? 'sm:col-span-2' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3 w-full">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${style.iconBg} transition-transform group-hover:scale-105`}>
                      <CriterionIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Tiêu chí {criterion.number}
                      </span>
                      <h4 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                        {criterion.title}
                      </h4>
                    </div>
                  </div>
                  <span className="w-7 h-7 rounded-lg bg-slate-50 group-hover:bg-blue-50 text-slate-400 group-hover:text-blue-600 flex items-center justify-center flex-shrink-0 transition-colors">
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                </div>

                <div className="space-y-2 w-full">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-bold ${style.text}`}>{pct}%</span>
                    <span className="text-slate-500 font-medium inline-flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                      {progress?.completedRequirements ?? 0}/{progress?.totalRequirements ?? 0} yêu cầu
                    </span>
                  </div>

                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${style.bar} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
