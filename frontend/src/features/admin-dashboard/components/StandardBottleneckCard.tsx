import { AlertTriangle } from 'lucide-react';

export interface StandardRateItem {
  name: string;
  rate: number;
  tone?: string;
}

interface StandardBottleneckCardProps {
  standards: StandardRateItem[];
}

const barToneColors: Record<string, string> = {
  emerald: 'bg-emerald-500',
  violet: 'bg-violet-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  blue: 'bg-blue-500',
};

export function StandardBottleneckCard({ standards }: StandardBottleneckCardProps) {
  return (
    <section className="p-4 sm:p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
      <header className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-800 m-0">Tỷ lệ đạt theo 5 nhóm</h2>
        <span className="text-xs text-slate-400 font-normal">Hôm nay</span>
      </header>

      <div className="space-y-3 pt-1">
        {standards.map((item) => (
          <div key={item.name} className="space-y-1">
            <div className="flex justify-between text-xs text-slate-600 font-medium">
              <span>{item.name}</span>
              <strong className="text-slate-900 font-bold">{item.rate}%</strong>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (item.tone && barToneColors[item.tone]) || 'bg-blue-500'
                }`}
                style={{ width: `${item.rate}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 flex items-center gap-2.5 text-xs text-amber-800 bg-amber-50 border border-amber-200/70 rounded-xl">
        <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
        <span>
          <strong>Hội nhập tốt</strong> đang là điểm nghẽn lớn nhất, thấp hơn trung bình 20%.
        </span>
      </div>
    </section>
  );
}
