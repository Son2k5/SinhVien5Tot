import { ArrowRight, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface StatusDonutItem {
  key: string;
  label: string;
  value: number;
  color: string;
}

interface StatusDonutChartProps {
  items: StatusDonutItem[];
}

export function StatusDonutChart({ items }: StatusDonutChartProps) {
  const navigate = useNavigate();
  const total = items.reduce((sum, item) => sum + item.value, 0);

  let cursor = 0;
  const gradient = items
    .map((item) => {
      const start = cursor;
      cursor += total > 0 ? (item.value / total) * 360 : 0;
      return `${item.color} ${start}deg ${cursor}deg`;
    })
    .join(',');

  return (
    <section className="p-4 sm:p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
      <header className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-800 m-0">Trạng thái xét duyệt</h2>
        <button
          type="button"
          onClick={() => navigate('/admin/applications')}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
        >
          <span>Xem hồ sơ</span>
          <ArrowRight size={13} />
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-[160px_minmax(0,1fr)] items-center gap-6 pt-2">
        {/* Donut circle */}
        <div
          className="w-36 h-36 mx-auto grid place-items-center rounded-full shadow-inner relative flex-shrink-0"
          style={{ background: `conic-gradient(${gradient || '#e2e8f0 0deg 360deg'})` }}
          aria-label={`Tổng ${total} hồ sơ`}
        >
          <div className="w-24 h-24 rounded-full bg-white shadow-md flex flex-col items-center justify-center text-center">
            <span className="text-lg font-bold text-slate-900 leading-none">
              {total.toLocaleString('vi-VN')}
            </span>
            <span className="text-[10px] font-medium text-slate-400 mt-1">Tổng hồ sơ</span>
          </div>
        </div>

        {/* Legend buttons */}
        <div className="space-y-1.5">
          {items.map((item) => (
            <button
              type="button"
              key={item.key}
              onClick={() => navigate(`/admin/applications?status=${item.key}`)}
              className="w-full flex items-center justify-between p-2 rounded-xl text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ background: item.color }}
                />
                <span className="truncate">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">
                  {item.value.toLocaleString('vi-VN')}
                </span>
                <ChevronRight size={14} className="text-slate-400" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
