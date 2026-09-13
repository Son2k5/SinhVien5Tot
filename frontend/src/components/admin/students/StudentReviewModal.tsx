import { useEffect, useState } from 'react';
import { AlertCircle, Loader2, X } from 'lucide-react';
import type { AdminStudentEvidenceItem } from '../../../types/admin/student';
import { EvidenceStatusBadge } from './StudentBadges';

interface Props {
  isOpen: boolean; evidence: AdminStudentEvidenceItem | null;
  isLoading?: boolean; onClose: () => void;
  onSubmit: (decision: 'Approved' | 'Rejected' | 'NeedsRevision', note: string) => Promise<void> | void;
}
export function StudentReviewModal({ isOpen, evidence, isLoading, onClose, onSubmit }: Props) {
  const [decision, setDecision] = useState<'Approved' | 'Rejected' | 'NeedsRevision'>('Approved');
  const [note, setNote] = useState(''); const [err, setErr] = useState<string | null>(null);
  useEffect(() => { if (isOpen) { setDecision('Approved'); setNote(evidence?.reviewerNote ?? ''); setErr(null); } }, [isOpen, evidence?.id, evidence?.reviewerNote]);
  if (!isOpen || !evidence) return null;
  const needNote = decision !== 'Approved';
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null);
    if (needNote && !note.trim()) { setErr('Bắt buộc nhập nhận xét khi từ chối hoặc yêu cầu bổ sung.'); return; }
    if (note.trim().length > 2000) { setErr('Nhận xét không quá 2000 ký tự.'); return; }
    try { await onSubmit(decision, note.trim()); onClose(); }
    catch (ex) { setErr(ex instanceof Error ? ex.message : 'Không thể xét duyệt.'); }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Xét duyệt minh chứng">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div><h3 className="text-sm font-bold text-slate-900">Xét duyệt minh chứng</h3>
          <p className="text-xs text-slate-500">{evidence.criterionCode} — {evidence.criterionTitle}</p></div>
          <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer"><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div className="flex items-center gap-2 text-xs">Trạng thái hiện tại: <EvidenceStatusBadge status={evidence.status} /></div>
          <div className="grid grid-cols-3 gap-2">
            {(['Approved', 'NeedsRevision', 'Rejected'] as const).map((d) => (
              <label key={d} className={`p-2.5 rounded-xl border text-center text-xs font-semibold cursor-pointer transition-colors ${decision === d ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100'}`}>
                <input type="radio" name="review-decision" className="hidden" checked={decision === d} onChange={() => setDecision(d)} />
                {d === 'Approved' ? 'Duyệt' : d === 'NeedsRevision' ? 'Bổ sung' : 'Từ chối'}
              </label>
            ))}
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700">Nhận xét {needNote && <span className="text-rose-500">*</span>}</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} maxLength={2000} placeholder="Ghi rõ lý do, hướng dẫn bổ sung..." className="mt-1 w-full text-xs border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-slate-50/60" />
          </div>
          {err && <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex gap-1.5"><AlertCircle size={14} className="shrink-0 mt-px" />{err}</div>}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} disabled={isLoading} className="px-3.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">Hủy</button>
            <button type="submit" disabled={isLoading} className="px-4 py-1.5 text-xs font-medium text-white rounded-lg bg-blue-600 hover:bg-blue-700 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50">{isLoading && <Loader2 size={13} className="animate-spin" />}Lưu kết quả</button>
          </div>
        </form>
      </div>
    </div>
  );
}
