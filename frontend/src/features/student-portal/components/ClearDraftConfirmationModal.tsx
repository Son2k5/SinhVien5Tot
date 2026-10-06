import React from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';

interface ClearDraftConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isClearing?: boolean;
}

export const ClearDraftConfirmationModal: React.FC<ClearDraftConfirmationModalProps> = ({
  open,
  onClose,
  onConfirm,
  isClearing = false,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 font-['Inter',_sans-serif]">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 text-rose-600 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900">Xóa trắng toàn bộ minh chứng nháp?</h4>
            <p className="text-xs text-slate-500">Hành động này không thể hoàn tác</p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Tất cả các đoạn mô tả, liên kết và tệp đính kèm đã tải lên trong toàn bộ hồ sơ này sẽ bị
          xóa sạch để bạn bắt đầu lại từ đầu.
        </p>

        <div className="flex items-center justify-end gap-2.5 mt-6 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isClearing}
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isClearing}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md shadow-rose-600/20 transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isClearing ? 'Đang xóa...' : 'Đồng ý xóa trắng'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
