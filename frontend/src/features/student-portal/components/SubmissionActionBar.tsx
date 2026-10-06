import React from 'react';
import { Send, Trash2 } from 'lucide-react';

interface SubmissionActionBarProps {
  completedCount: number;
  totalCriteria: number;
  isEditable: boolean;
  canSubmit: boolean;
  isSubmitting?: boolean;
  isClearing?: boolean;
  onClearAll: () => void;
  onSubmit: () => void;
}

export const SubmissionActionBar: React.FC<SubmissionActionBarProps> = ({
  completedCount,
  totalCriteria,
  isEditable,
  canSubmit,
  isSubmitting = false,
  isClearing = false,
  onClearAll,
  onSubmit,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 sm:px-8 py-3.5 shadow-lg shadow-slate-900/10">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Summary Count */}
        <div className="text-xs sm:text-sm text-slate-600 font-medium">
          Tiến độ: <strong className="text-slate-900 font-bold">{completedCount}</strong>/
          <span className="text-slate-500">{totalCriteria}</span> tiêu chí đã kê khai
        </div>

        {/* Right: Action Buttons */}
        <div className="flex items-center gap-3">
          {isEditable && (
            <button
              type="button"
              onClick={onClearAll}
              disabled={isClearing || isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-rose-200 text-rose-600 hover:bg-rose-50 transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Xóa trắng bản nháp</span>
            </button>
          )}

          {isEditable && (
            <button
              type="button"
              onClick={onSubmit}
              disabled={!canSubmit || isSubmitting}
              className={`inline-flex items-center gap-2 px-6 sm:px-8 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-md transition active:scale-95 cursor-pointer ${
                canSubmit && !isSubmitting
                  ? 'bg-[#0047AB] hover:bg-[#003882] shadow-blue-900/25'
                  : 'bg-slate-300 cursor-not-allowed shadow-none'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang nộp hồ sơ...' : 'Nộp hồ sơ xét duyệt'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
