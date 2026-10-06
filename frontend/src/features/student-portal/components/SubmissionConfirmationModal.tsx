import React from 'react';
import { Send, X, AlertTriangle } from 'lucide-react';

interface SubmissionConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
  agreementChecked: boolean;
  onAgreementChange: (checked: boolean) => void;
  applicationCode: string;
}

export const SubmissionConfirmationModal: React.FC<SubmissionConfirmationModalProps> = ({
  open,
  onClose,
  onConfirm,
  isSubmitting = false,
  agreementChecked,
  onAgreementChange,
  applicationCode,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 font-['Inter',_sans-serif]">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Xác nhận nộp hồ sơ chính thức</h3>
              <p className="text-xs text-slate-500">Mã hồ sơ: {applicationCode}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs">
              Sau khi nộp hồ sơ, toàn bộ minh chứng sẽ chuyển sang trạng thái{' '}
              <strong>Đã nộp</strong> và bị khóa chỉnh sửa để Hội đồng Thẩm định xem xét.
            </p>
          </div>

          <p>
            Vui lòng kiểm tra kỹ các tiêu chí đã kê khai, các tệp đính kèm và đường link minh chứng
            để đảm bảo không bị thiếu sót.
          </p>

          <label className="flex items-start gap-2.5 pt-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreementChecked}
              onChange={(e) => onAgreementChange(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-slate-700 font-medium">
              Tôi cam kết các thông tin và minh chứng kê khai hoàn toàn trung thực, chính xác và chịu
              trách nhiệm về tính xác thực của hồ sơ này.
            </span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            Kiểm tra lại
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!agreementChecked || isSubmitting}
            className={`inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold rounded-xl text-white shadow-md transition cursor-pointer ${
              agreementChecked && !isSubmitting
                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25 active:scale-95'
                : 'bg-slate-300 cursor-not-allowed shadow-none'
            }`}
          >
            <span>{isSubmitting ? 'Đang nộp hồ sơ...' : 'Đồng ý nộp chính thức'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
