import { GraduationCap, UserX, Users } from 'lucide-react';

interface StudentStatsCardsProps {
  total: number;
  activeCount: number;
  inactiveCount: number;
}

export function StudentStatsCards({
  total,
  activeCount,
  inactiveCount,
}: StudentStatsCardsProps) {
  const cards = [
    {
      icon: Users,
      label: 'Tổng sinh viên',
      value: total.toLocaleString('vi-VN'),
      color: 'text-blue-600 bg-blue-50',
    },
    {
      icon: GraduationCap,
      label: 'Đang hoạt động',
      value: String(activeCount),
      color: 'text-violet-600 bg-violet-50',
    },
    {
      icon: UserX,
      label: 'Vô hiệu hoá',
      value: String(inactiveCount),
      color: 'text-amber-600 bg-amber-50',
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
            <div className="text-xl font-bold tracking-tight text-slate-900 leading-tight">{item.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
