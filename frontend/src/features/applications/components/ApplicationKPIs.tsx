import { FileText, Clock, CheckCircle2 } from 'lucide-react';

interface ApplicationKPIsProps {
  total?: number;
  submitted?: number;
  approvedAll5?: number;
  totalCount?: number;
  submittedCount?: number;
  approvedAll5Count?: number;
}

export function ApplicationKPIs({
  total,
  submitted,
  approvedAll5,
  totalCount,
  submittedCount,
  approvedAll5Count,
}: ApplicationKPIsProps) {
  const finalTotal = totalCount ?? total ?? 0;
  const finalSubmitted = submittedCount ?? submitted ?? 0;
  const finalApprovedAll5 = approvedAll5Count ?? approvedAll5 ?? 0;

  const cards = [
    {
      icon: FileText,
      label: 'Tổng hồ sơ',
      value: finalTotal.toLocaleString('vi-VN'),
      color: 'text-blue-600 bg-blue-50',
    },
    {
      icon: Clock,
      label: 'Chờ thẩm định',
      value: String(finalSubmitted),
      color: 'text-amber-600 bg-amber-50',
    },
    {
      icon: CheckCircle2,
      label: 'Đạt đủ 5/5 tiêu chuẩn',
      value: String(finalApprovedAll5),
      color: 'text-emerald-600 bg-emerald-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {cards.map((item) => (
        <div
          key={item.label}
          className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3.5 shadow-xs hover:border-slate-300 transition-colors"
        >
          <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center shrink-0`}>
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
