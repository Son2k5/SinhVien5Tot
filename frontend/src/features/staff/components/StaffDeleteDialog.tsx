import { useId } from 'react';
import { AlertTriangle, Lock, RefreshCw, Trash2, X } from 'lucide-react';
import type { Staff } from '../types/staff.types';

export interface StaffDeleteDialogProps {
  isOpen: boolean;
  target: Staff | null;
  typedEmail: string;
  deleteErrorDetail: string | null;
  isDeleting: boolean;
  isLocking: boolean;
  onTypedEmailChange: (value: string) => void;
  onClose: () => void;
  onConfirmDelete: () => void;
  onLockInstead: () => void;
}

export function StaffDeleteDialog({
  isOpen,
  target,
  typedEmail,
  deleteErrorDetail,
  isDeleting,
  isLocking,
  onTypedEmailChange,
  onClose,
  onConfirmDelete,
  onLockInstead,
}: StaffDeleteDialogProps) {
  const deleteEmailInputId = useId();

  if (!isOpen || !target) return null;

  const isEmailMatching =
    typedEmail.trim().toLowerCase() === target.email.trim().toLowerCase();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <div className="w-full max-w-md bg-white border border-slate-200 shadow-2xl rounded-2xl p-6 space-y-4 relative animate-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Trash2 size={20} />
          </div>
          <div className="space-y-1 pr-4">
            <h3 id="delete-dialog-title" className="text-base font-bold text-slate-900">
              Xóa nhân sự vĩnh viễn
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Thao tác này sẽ xóa tài khoản{' '}
              <strong className="text-slate-800">{target.fullName || target.email}</strong>.
              Hành động này không thể hoàn tác.
            </p>
          </div>
        </div>

        {/* Error Detail (e.g. 409 staff_has_work_history) */}
        {deleteErrorDetail ? (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-900">
            <div className="flex items-start gap-2 font-semibold text-amber-800">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span>Không thể xóa nhân sự</span>
            </div>
            <p className="leading-relaxed text-amber-800">{deleteErrorDetail}</p>
            <div className="pt-1 flex items-center justify-end">
              <button
                type="button"
                onClick={onLockInstead}
                disabled={isLocking}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Lock size={12} />
                <span>Khoá tài khoản thay thế</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 pt-1">
            <label
              htmlFor={deleteEmailInputId}
              className="block text-xs font-medium text-slate-700 leading-relaxed"
            >
              Nhập lại email{' '}
              <span className="font-mono font-semibold text-rose-600 select-all">
                {target.email}
              </span>{' '}
              để xác nhận xóa:
            </label>
            <input
              id={deleteEmailInputId}
              type="text"
              value={typedEmail}
              onChange={(e) => onTypedEmailChange(e.target.value)}
              placeholder="Nhập email nhân sự..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono text-slate-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none"
              autoComplete="off"
            />
          </div>
        )}

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>

          {!deleteErrorDetail && (
            <button
              type="button"
              onClick={onConfirmDelete}
              disabled={isDeleting || !isEmailMatching}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
            >
              {isDeleting ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : (
                <Trash2 size={12} />
              )}
              <span>Xác nhận xóa</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default StaffDeleteDialog;
