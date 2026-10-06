import React from 'react';
import { CheckCircle2, RefreshCw } from 'lucide-react';

interface ApplicationDetailFooterProps {
  completedStandardsCount: number;
  isEligibleForApproval: boolean;
  onRefresh: () => void;
  onClose: () => void;
}

export const ApplicationDetailFooter: React.FC<ApplicationDetailFooterProps> = ({
  completedStandardsCount,
  isEligibleForApproval,
  onRefresh,
  onClose,
}) => {
  return (
    <div className="px-6 py-3.5 border-t border-slate-200 bg-white flex items-center justify-between gap-3 shrink-0 rounded-none">
      <div className="flex items-center gap-2 text-xs text-slate-600 font-inter">
        <span>Tiến độ tiêu chuẩn:</span>
        <strong className="text-slate-900 font-semibold">{completedStandardsCount} / 5</strong>
        <span className="text-slate-400">nhóm đạt</span>
        {isEligibleForApproval ? (
          <span className="text-emerald-600 font-bold ml-1 flex items-center gap-1">
            <CheckCircle2 size={13} />
            (Đủ điều kiện công nhận SV5T)
          </span>
        ) : (
          <span className="text-amber-600 font-medium ml-1">(Chưa đủ 5 nhóm)</span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          <RefreshCw size={12} />
          <span>Tải lại</span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          Đóng
        </button>
      </div>
    </div>
  );
};
