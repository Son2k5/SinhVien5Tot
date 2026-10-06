import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, Loader2, X } from 'lucide-react';
import type { AdminEvidenceItem } from '../types/application.types';

interface EvidenceReviewQuickModalProps {
  isOpen: boolean;
  evidence: AdminEvidenceItem | null;
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: (decision: 'Approved' | 'Rejected' | 'NeedsRevision', note: string) => Promise<void> | void;
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  Approved: { label: 'Đạt', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  NeedsRevision: { label: 'Cần bổ sung', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  Rejected: { label: 'Từ chối', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
  Submitted: { label: 'Đã nộp', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  Draft: { label: 'Bản nháp', cls: 'bg-slate-50 text-slate-600 border-slate-200' },
};

export const EvidenceReviewQuickModal: React.FC<EvidenceReviewQuickModalProps> = ({
  isOpen,
  evidence,
  isLoading = false,
  onClose,
  onSubmit,
}) => {
  const [decision, setDecision] = useState<'Approved' | 'Rejected' | 'NeedsRevision'>('Approved');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && evidence) {
      const initialDecision =
        evidence.status === 'Approved'
          ? 'Approved'
          : evidence.status === 'NeedsRevision'
          ? 'NeedsRevision'
          : evidence.status === 'Rejected'
          ? 'Rejected'
          : 'Approved';
      setDecision(initialDecision);
      setNote(evidence.reviewerNote || '');
      setError(null);
    }
  }, [isOpen, evidence]);

  if (!isOpen || !evidence) return null;

  const needNote = decision !== 'Approved';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (needNote && !note.trim()) {
      setError('Bắt buộc phải nhập nhận xét / hướng dẫn khi từ chối hoặc yêu cầu bổ sung.');
      return;
    }

    if (note.trim().length > 2000) {
      setError('Nhận xét không được vượt quá 2000 ký tự.');
      return;
    }

    try {
      await onSubmit(decision, note.trim());
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể lưu kết quả đánh giá.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150 antialiased"
      style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
      role="dialog"
      aria-modal="true"
      aria-label="Đánh giá minh chứng"
    >
      <div
        className="w-full max-w-lg bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150"
        style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-gradient-to-r from-blue-50/50 to-white">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-slate-900">Đánh giá minh chứng tiêu chí</h3>
            <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 font-medium" title={evidence.criterionTitle}>
              {evidence.criterionTitle}
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <span
              className={`text-xs px-2.5 py-0.5 font-semibold border ${
                STATUS_BADGE[evidence.status]?.cls || 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              {STATUS_BADGE[evidence.status]?.label || evidence.status}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Decision Radio Grid */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">
              Kết quả đánh giá:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label
                className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${
                  decision === 'Approved'
                    ? 'border-emerald-500 bg-emerald-50/80 text-emerald-800 font-bold shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 font-medium'
                }`}
              >
                <input
                  type="radio"
                  name="evidence-decision"
                  className="hidden"
                  checked={decision === 'Approved'}
                  onChange={() => setDecision('Approved')}
                />
                <CheckCircle2
                  size={20}
                  className={`mb-1 ${decision === 'Approved' ? 'text-emerald-600' : 'text-slate-400'}`}
                />
                <span className="text-xs">Đạt tiêu chí</span>
              </label>

              <label
                className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${
                  decision === 'NeedsRevision'
                    ? 'border-amber-500 bg-amber-50/80 text-amber-800 font-bold shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 font-medium'
                }`}
              >
                <input
                  type="radio"
                  name="evidence-decision"
                  className="hidden"
                  checked={decision === 'NeedsRevision'}
                  onChange={() => setDecision('NeedsRevision')}
                />
                <Clock
                  size={20}
                  className={`mb-1 ${decision === 'NeedsRevision' ? 'text-amber-600' : 'text-slate-400'}`}
                />
                <span className="text-xs">Cần bổ sung</span>
              </label>

              <label
                className={`flex flex-col items-center justify-center p-3 rounded-xl border cursor-pointer transition-all ${
                  decision === 'Rejected'
                    ? 'border-rose-500 bg-rose-50/80 text-rose-800 font-bold shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 font-medium'
                }`}
              >
                <input
                  type="radio"
                  name="evidence-decision"
                  className="hidden"
                  checked={decision === 'Rejected'}
                  onChange={() => setDecision('Rejected')}
                />
                <AlertCircle
                  size={20}
                  className={`mb-1 ${decision === 'Rejected' ? 'text-rose-600' : 'text-slate-400'}`}
                />
                <span className="text-xs">Từ chối</span>
              </label>
            </div>
          </div>

          {/* Reviewer Note / Feedback */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>
                Nhận xét & Hướng dẫn sinh viên {needNote && <span className="text-rose-500">*</span>}
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                {note.length}/2000 ký tự
              </span>
            </div>
            <textarea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                decision === 'Approved'
                  ? 'Ghi chú thêm nếu có (ví dụ: Minh chứng rất rõ ràng, hợp lệ)...'
                  : 'Ghi rõ lý do chưa đạt hoặc hướng dẫn sinh viên loại giấy tờ / minh chứng cần nộp lại...'
              }
              className="w-full text-xs rounded-xl border border-slate-200 p-3 bg-slate-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Quick template snippets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Mẫu gợi ý:</span>
            {[
              'Minh chứng rõ ràng, hợp lệ.',
              'Vui lòng tải lại ảnh chụp rõ dấu mộc.',
              'Cần bổ sung chứng nhận cấp trường trở lên.',
              'Bảng điểm chưa có xác nhận từ phòng Đào tạo.',
            ].map((tpl) => (
              <button
                key={tpl}
                type="button"
                onClick={() => setNote((prev) => (prev ? `${prev}\n${tpl}` : tpl))}
                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer"
              >
                {tpl}
              </button>
            ))}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={isLoading}
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] rounded-xl shadow-xs inline-flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading && <Loader2 size={13} className="animate-spin" />}
              <span>Lưu kết quả đánh giá</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
