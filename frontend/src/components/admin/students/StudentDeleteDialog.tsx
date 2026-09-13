import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import type { AdminStudentListItem } from '../../../types/admin/student';

interface Props {
  isOpen: boolean; student: AdminStudentListItem | null;
  isLoading?: boolean; onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
}
export function StudentDeleteDialog({ isOpen, student, isLoading, onClose, onConfirm }: Props) {
  const [reason, setReason] = useState(''); const [err, setErr] = useState<string | null>(null);
  useEffect(() => { if (isOpen) { setReason(''); setErr(null); } }, [isOpen, student?.id]);
  if (!isOpen || !student) return null;
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null);
    if (reason.trim() && reason.trim().length > 500) { setErr('Lý do không quá 500 ký tự.'); return; }
    try { await onConfirm(reason.trim()); onClose(); }
    catch (ex) { setErr(ex instanceof Error ? ex.message : 'Không thể xóa sinh viên.'); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Xác nhận xóa sinh viên">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-4 relative">
        <button type="button" onClick={onClose} disabled={isLoading} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer" aria-label="Đóng"><X size={18} /></button>
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0"><AlertTriangle size={20} /></div>
          <div className="space-y-1 pr-4">
            <h3 className="text-base font-bold text-slate-900">Bạn chắc chắn muốn xóa?</h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">Bạn sắp xóa mềm tài khoản <b className="text-slate-800">{student.fullName || student.email}</b> ({student.studentCode || '—'}). Tài khoản sẽ bị vô hiệu hoá và ẩn khỏi danh sách mặc định.</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700">Lý do xóa (không bắt buộc)</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={500} placeholder="VD: Sinh viên thôi học, trùng tài khoản..." className="mt-1 w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 bg-slate-50/60" />
          </div>
          {err && <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">{err}</div>}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} disabled={isLoading} className="px-3.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">Hủy bỏ</button>
            <button type="submit" disabled={isLoading} className="px-3.5 py-1.5 text-xs font-medium text-white rounded-lg bg-rose-600 hover:bg-rose-700 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50">{isLoading && <Loader2 size={13} className="animate-spin" />}<span>Xác nhận xóa</span></button>
          </div>
        </form>
      </div>
    </div>
  );
}
