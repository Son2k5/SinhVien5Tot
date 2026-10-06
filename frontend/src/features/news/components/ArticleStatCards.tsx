import { FileText, Globe, Edit3, Archive } from 'lucide-react';

interface ArticleStatCardsProps {
  total: number;
  publishedCount: number;
  draftCount: number;
  archivedCount: number;
}

export function ArticleStatCards({
  total,
  publishedCount,
  draftCount,
  archivedCount,
}: ArticleStatCardsProps) {
  const stats = [
    {
      icon: FileText,
      label: 'Tổng bài viết',
      value: total.toLocaleString('vi-VN'),
      color: 'text-blue-600 bg-blue-50',
    },
    {
      icon: Globe,
      label: 'Đã xuất bản (trang này)',
      value: String(publishedCount),
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      icon: Edit3,
      label: 'Bản nháp (trang này)',
      value: String(draftCount),
      color: 'text-slate-600 bg-slate-100',
    },
    {
      icon: Archive,
      label: 'Lưu trữ (trang này)',
      value: String(archivedCount),
      color: 'text-amber-600 bg-amber-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-inter">
      {stats.map((item) => (
        <div
          key={item.label}
          className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3.5 shadow-xs hover:border-slate-300 transition-colors"
        >
          <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center shrink-0`}>
            <item.icon size={20} />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-slate-600 font-medium truncate">{item.label}</div>
            <div className="text-xl font-bold tracking-tight text-slate-900 leading-tight">{item.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
