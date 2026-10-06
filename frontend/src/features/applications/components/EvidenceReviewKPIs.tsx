import React from 'react';
import { Clock, FileCheck2, ShieldAlert, Users } from 'lucide-react';
import type { ReviewTab } from '../hooks/useEvidenceReviewWorkspace';
import { STATUS_CONFIG } from '../types/application.types';

interface EvidenceReviewKPIsProps {
  activeTab: ReviewTab;
  totalStudents: number;
  filteredEvidencesCount: number;
  warningCount: number;
  urgentCount: number;
}

export const EvidenceReviewKPIs: React.FC<EvidenceReviewKPIsProps> = ({
  activeTab,
  totalStudents,
  filteredEvidencesCount,
  warningCount,
  urgentCount,
}) => {
  const currentStatusConf = STATUS_CONFIG[activeTab] || STATUS_CONFIG.Submitted;

  const stats = [
    {
      icon: Users,
      label: 'Tổng sinh viên',
      value: totalStudents.toLocaleString('vi-VN'),
      color: 'text-blue-600 bg-blue-50',
    },
    {
      icon: FileCheck2,
      label: `Minh chứng ${currentStatusConf.label.toLowerCase()}`,
      value: filteredEvidencesCount.toLocaleString('vi-VN'),
      color: 'text-indigo-600 bg-indigo-50',
    },
    {
      icon: Clock,
      label: 'Cảnh báo chờ >3 ngày',
      value: warningCount.toLocaleString('vi-VN'),
      color: 'text-amber-600 bg-amber-50',
    },
    {
      icon: ShieldAlert,
      label: 'Quá hạn >7 ngày',
      value: urgentCount.toLocaleString('vi-VN'),
      color: 'text-rose-600 bg-rose-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
            <div className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
              {item.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
