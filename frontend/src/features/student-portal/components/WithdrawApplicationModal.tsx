import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { StudentApplicationSummaryResponse } from '../types/student-portal.types';

interface WithdrawApplicationModalProps {
  application: StudentApplicationSummaryResponse | null;
  withdrawReason: string;
  onReasonChange: (reason: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  isWithdrawing?: boolean;
}

export const WithdrawApplicationModal: React.FC<WithdrawApplicationModalProps> = ({
  application,
  withdrawReason,
  onReasonChange,
  onClose,
  onConfirm,
  isWithdrawing = false,
}) => {
  if (!application) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 font-['Inter',_sans-serif]">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center gap-3 text-amber-600 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Xác nhận rút hồ sơ</h3>
            <p className="text-xs text-slate-500">Chiến dịch: {application.campaignName}</p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
          Hồ sơ của bạn sẽ chuyển về trạng thái <strong>Bản nháp</strong> và bạn có thể chỉnh sửa lại
          các minh chứng trước khi nộp lại.
        </p>

        <div className="space-y-1.5 mb-5">
          <label className="text-xs font-semibold text-slate-700">
            Lý do rút hồ sơ (không bắt buộc):
          </label>
          <textarea
            rows={3}
            value={withdrawReason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="Nhập lý do cần chỉnh sửa hoặc bổ sung minh chứng..."
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isWithdrawing}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isWithdrawing}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#0052cc] hover:bg-[#0747a6] text-white shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <span>{isWithdrawing ? 'Đang rút hồ sơ...' : 'Đồng ý rút hồ sơ'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
