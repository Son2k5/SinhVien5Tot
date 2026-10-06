import { BookOpenCheck, CheckCircle2, Edit2, FolderTree } from 'lucide-react';

export interface StandardSetStatsCardsProps {
  totalCount: number;
  publishedCount: number;
  draftCount: number;
  individualCount: number;
}

export function StandardSetStatsCards({
  totalCount,
  publishedCount,
  draftCount,
  individualCount,
}: StandardSetStatsCardsProps) {
  const stats = [
    {
      icon: FolderTree,
      label: 'Tổng bộ tiêu chuẩn',
      value: totalCount.toLocaleString('vi-VN'),
      color: 'text-blue-600 bg-blue-50',
    },
    {
      icon: CheckCircle2,
      label: 'Đã công bố',
      value: publishedCount.toLocaleString('vi-VN'),
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      icon: Edit2,
      label: 'Bản nháp',
      value: draftCount.toLocaleString('vi-VN'),
      color: 'text-amber-600 bg-amber-50',
    },
    {
      icon: BookOpenCheck,
      label: 'Danh hiệu Cá nhân',
      value: individualCount.toLocaleString('vi-VN'),
      color: 'text-violet-600 bg-violet-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((item) => (
        <div
          key={item.label}
          className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3.5 shadow-xs hover:border-slate-300 transition-colors"
        >
          <div
            className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center shrink-0`}
          >
            <item.icon size={20} />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-slate-600 font-medium truncate">{item.label}</div>
            <div className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
              {item.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
