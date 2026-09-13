import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import type { AdminStudentDetail, AdminStudentListItem } from '../../../types/admin/student';

type LockTarget = Pick<AdminStudentListItem, 'id' | 'fullName' | 'email' | 'studentCode' | 'isActive'>;

interface Props {
  isOpen: boolean;
  student: LockTarget | AdminStudentDetail | AdminStudentListItem | null;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
}

function getLocked(student: Props['student']): boolean {
  if (!student) return false;
  return !(student as { isActive?: boolean }).isActive;
}

export function StudentLockDialog({ isOpen, student, isLoading, onClose, onConfirm }: Props) {
  const [reason, setReason] = useState('');
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (isOpen) {
      setReason('');
      setErr(null);
    }
  }, [isOpen]);
  if (!isOpen || !student) return null;
  const locked = getLocked(student);
  const name = (student as AdminStudentListItem).fullName || (student as AdminStudentDetail).displayName || student.email;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (reason.trim() && reason.trim().length > 500) {
      setErr('Lý do không quá 500 ký tự.');
      return;
    }
    try {
      await onConfirm(reason.trim());
      onClose();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : locked ? 'Không thể mở khóa tài khoản.' : 'Không thể khóa tài khoản.');
    }
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-[3px]"
      role="dialog"
      aria-modal="true"
      aria-label="Khóa/mở khóa tài khoản"
    >
      <div className="w-full max-w-[400px] bg-white rounded-2xl border border-slate-100 shadow-[0_20px_60px_-15px_rgba(15,35,70,0.25)] px-5 py-5 relative">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-3.5 right-3.5 p-1.5 text-slate-300 hover:text-slate-500 rounded-full hover:bg-slate-100/80 transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X size={15} strokeWidth={1.8} />
        </button>
        <div className="flex flex-col items-center text-center">
          <h3 className="mt-3 text-[15px] font-semibold tracking-tight text-slate-800">
            {locked ? 'Mở khóa tài khoản?' : 'Khóa tài khoản sinh viên?'}
          </h3>
          <p className="mt-1.5 text-xs font-normal text-slate-500 leading-relaxed">
            {locked ? (
              <>
                Bạn sắp mở khóa tài khoản <b className="font-medium text-slate-700">{name}</b>{' '}
                . Tài khoản sẽ được phép đăng nhập trở lại.
              </>
            ) : (
              <>
                Bạn sắp khóa tài khoản <b className="font-medium text-slate-700">{name}</b>{' '}
                . Tài khoản sẽ bị đăng xuất và không thể đăng nhập
                cho đến khi được mở khóa.
              </>
            )}
          </p>
          {!locked && (
            <p className="mt-2.5 w-full text-[11px] font-normal text-amber-600/90 bg-amber-50/70 border border-amber-100 rounded-xl px-2.5 py-2 inline-flex items-start gap-1.5 text-left">
              <AlertTriangle size={13} strokeWidth={1.8} className="mt-px shrink-0 text-amber-400" />
              Hành động này sẽ thu hồi toàn bộ phiên đăng nhập hiện tại của sinh viên.
            </p>
          )}
        </div>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <div>
            <label className="text-[11px] font-normal text-slate-400">Lý do (không bắt buộc)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder={locked ? 'VD: Sinh viên đã bổ sung đầy đủ hồ sơ...' : 'VD: Vi phạm quy chế, cần xác minh...'}
              className="mt-1.5 w-full text-xs font-normal border border-slate-200/90 rounded-xl px-3 py-2 outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50 bg-slate-50/50 placeholder:text-slate-300 transition-[border-color,box-shadow] resize-none"
            />
          </div>
          {err && (
            <div className="px-3 py-2 rounded-xl bg-rose-50/80 border border-rose-100 text-xs font-normal text-rose-500">
              {err}
            </div>
          )}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 h-8 text-xs font-normal text-slate-500 bg-slate-100/70 rounded-xl hover:bg-slate-100 hover:text-slate-600 active:scale-[0.98] transition-[background-color,color] cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 h-8 text-xs font-normal text-white rounded-xl inline-flex items-center justify-center gap-1.5 active:scale-[0.98] transition-[background-color,box-shadow] cursor-pointer disabled:opacity-50 ${
                locked
                  ? 'bg-emerald-500/90 hover:bg-emerald-600 shadow-[0_6px_16px_-6px_rgba(16,185,129,0.5)]'
                  : 'bg-amber-500/90 hover:bg-amber-600 shadow-[0_6px_16px_-6px_rgba(245,158,11,0.5)]'
              }`}
            >
              {isLoading && <Loader2 size={13} className="animate-spin" />}
              <span>{locked ? 'Xác nhận mở khóa' : 'Xác nhận khóa'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
