import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface DepartmentRankingItem {
  name: string;
  registered: number;
  awarded: number;
  rate: number;
  qualified: boolean;
}

interface DepartmentRankingsTableProps {
  rankings: DepartmentRankingItem[];
  sortKey: 'registered' | 'awarded' | 'rate';
  sortDesc: boolean;
  onSortBy: (key: 'registered' | 'awarded' | 'rate') => void;
}

const rankBadgeStyles = [
  'bg-amber-100 text-amber-800 border-amber-200', // Rank 1
  'bg-slate-100 text-slate-700 border-slate-200', // Rank 2
  'bg-orange-100 text-orange-800 border-orange-200', // Rank 3
];

export function DepartmentRankingsTable({
  rankings,
  sortKey,
  sortDesc,
  onSortBy,
}: DepartmentRankingsTableProps) {
  const navigate = useNavigate();

  return (
    <section className="p-4 sm:p-5 bg-white border border-slate-200 rounded-xl shadow-xs">
      <header className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-800 m-0">
          Xếp hạng khoa / liên chi hội
        </h2>
        <button
          type="button"
          onClick={() => navigate('/admin/reports')}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
        >
          <span>Xem báo cáo</span>
          <ArrowRight size={13} />
        </button>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
              <th className="py-2.5 px-3 w-12">#</th>
              <th className="py-2.5 px-3">Đơn vị</th>
              <th className="py-2.5 px-3">
                <button
                  type="button"
                  onClick={() => onSortBy('registered')}
                  className="inline-flex items-center gap-1 text-inherit hover:text-slate-700 font-semibold cursor-pointer"
                >
                  <span>Đăng ký</span>
                  {sortKey === 'registered' && (
                    sortDesc ? <ArrowDown size={12} /> : <ArrowUp size={12} />
                  )}
                </button>
              </th>
              <th className="py-2.5 px-3">
                <button
                  type="button"
                  onClick={() => onSortBy('awarded')}
                  className="inline-flex items-center gap-1 text-inherit hover:text-slate-700 font-semibold cursor-pointer"
                >
                  <span>Đạt chuẩn</span>
                  {sortKey === 'awarded' && (
                    sortDesc ? <ArrowDown size={12} /> : <ArrowUp size={12} />
                  )}
                </button>
              </th>
              <th className="py-2.5 px-3">
                <button
                  type="button"
                  onClick={() => onSortBy('rate')}
                  className="inline-flex items-center gap-1 text-inherit hover:text-slate-700 font-semibold cursor-pointer"
                >
                  <span>Tỷ lệ</span>
                  {sortKey === 'rate' && (
                    sortDesc ? <ArrowDown size={12} /> : <ArrowUp size={12} />
                  )}
                </button>
              </th>
              <th className="py-2.5 px-3">Chuẩn tập thể</th>
              <th className="py-2.5 px-3 text-right" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {rankings.map((row, index) => (
              <tr key={row.name} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3 px-3">
                  <span
                    className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center border ${
                      rankBadgeStyles[index] || 'bg-slate-50 text-slate-500 border-slate-100'
                    }`}
                  >
                    {index + 1}
                  </span>
                </td>
                <td className="py-3 px-3 font-semibold text-slate-900">{row.name}</td>
                <td className="py-3 px-3">{row.registered}</td>
                <td className="py-3 px-3">{row.awarded}</td>
                <td className="py-3 px-3 font-bold text-slate-900">{row.rate}%</td>
                <td className="py-3 px-3">
                  {row.qualified ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                      <CheckCircle2 size={14} />
                      <span>Đạt chuẩn</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-600 font-semibold text-[11px]">
                      <AlertTriangle size={14} />
                      <span>Chưa đạt</span>
                    </span>
                  )}
                </td>
                <td className="py-3 px-3 text-right">
                  <button
                    type="button"
                    aria-label={`Xem ${row.name}`}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
