import { useEffect, useRef } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, Circle, Clock, X } from 'lucide-react';
import type { CriterionProgress } from '../types/home-dashboard.types';
import type { CriterionDefinition } from './homeDashboardConfig';

interface CriterionDetailsDialogProps {
  criterion: CriterionDefinition;
  progress: CriterionProgress;
  onClose: () => void;
}

const toneStyles: Record<string, { iconBg: string; text: string; bar: string; boxBg: string; border: string }> = {
  blue: { iconBg: 'bg-blue-50 text-blue-600', text: 'text-blue-600', bar: 'bg-blue-500', boxBg: 'bg-blue-50/50', border: 'border-blue-100' },
  green: { iconBg: 'bg-emerald-50 text-emerald-600', text: 'text-emerald-600', bar: 'bg-emerald-500', boxBg: 'bg-emerald-50/50', border: 'border-emerald-100' },
  orange: { iconBg: 'bg-amber-50 text-amber-600', text: 'text-amber-600', bar: 'bg-amber-500', boxBg: 'bg-amber-50/50', border: 'border-amber-100' },
  purple: { iconBg: 'bg-purple-50 text-purple-600', text: 'text-purple-600', bar: 'bg-purple-500', boxBg: 'bg-purple-50/50', border: 'border-purple-100' },
  pink: { iconBg: 'bg-rose-50 text-rose-600', text: 'text-rose-600', bar: 'bg-rose-500', boxBg: 'bg-rose-50/50', border: 'border-rose-100' },
};

export function CriterionDetailsDialog({ criterion, progress, onClose }: CriterionDetailsDialogProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const CriterionIcon = criterion.icon;
  const style = toneStyles[criterion.tone] ?? toneStyles.blue;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const triggerElement = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
      triggerElement?.focus();
    };
  }, [onClose]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Tab') return;
    const container = dialogRef.current;
    if (!container) return;
    const focusable = container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Dialog Body */}
      <section
        ref={dialogRef}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="criterion-dialog-title"
        className="relative z-10 w-full max-w-3xl sm:max-w-4xl font-inter bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95 duration-150"
      >
        <button
          ref={closeButtonRef}
          type="button"
          className="absolute top-5 right-5 w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          onClick={onClose}
          aria-label="Đóng"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 pr-8">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${style.iconBg}`}>
            <CriterionIcon className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Tiêu chuẩn {criterion.number}
            </span>
            <h2 id="criterion-dialog-title" className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              {criterion.title}
            </h2>
          </div>
        </div>

        {/* Description */}
        {criterion.description ? (
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            {criterion.description}
          </p>
        ) : null}

        {/* Progress Box */}
        <div className={`p-4 sm:p-5 rounded-xl border ${style.border} ${style.boxBg} space-y-2.5`}>
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="font-semibold text-slate-800">Tiến độ hoàn thành</span>
            <span className={`font-bold ${style.text}`}>{progress.progress}%</span>
          </div>
          <div className="w-full h-2.5 bg-white/80 rounded-full overflow-hidden">
            <div
              className={`h-full ${style.bar} rounded-full transition-all duration-500`}
              style={{ width: `${progress.progress}%` }}
            />
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 font-normal">
            {progress.completedRequirements}/{progress.totalRequirements} tiêu chí đã hoàn thành{progress.status ? ` · ${progress.status}` : ''}
          </p>
        </div>

        {/* Requirements Checklist / Real Criteria Tree */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
              Danh sách tiêu chí xét duyệt {criterion.criteria?.length ? `(${criterion.criteria.length} tiêu chí)` : ''}
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {progress.completedRequirements}/{progress.totalRequirements} đã đạt
            </span>
          </div>

          {criterion.criteria && criterion.criteria.length > 0 ? (
            <div className="space-y-2.5 max-h-[360px] sm:max-h-[420px] overflow-y-auto pr-1">
              {criterion.criteria.map((item) => {
                const isApproved = item.isCompleted || item.evidenceStatus === 'Approved';
                const isSubmitted = item.evidenceStatus === 'Submitted';
                const isNeedsRevision = item.evidenceStatus === 'NeedsRevision';

                return (
                  <div
                    key={item.id || item.code}
                    className={`flex items-start gap-3.5 p-4 rounded-xl border text-xs sm:text-sm leading-relaxed transition-colors ${
                      isApproved
                        ? 'bg-emerald-50/60 border-emerald-200 text-slate-800'
                        : isSubmitted
                        ? 'bg-amber-50/60 border-amber-200 text-slate-800'
                        : isNeedsRevision
                        ? 'bg-rose-50/60 border-rose-200 text-slate-800'
                        : 'bg-slate-50 border-slate-200/80 text-slate-700'
                    }`}
                  >
                    {isApproved ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5 stroke-[2.5]" />
                    ) : isSubmitted ? (
                      <Clock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5 stroke-[2]" />
                    ) : isNeedsRevision ? (
                      <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5 stroke-[2]" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5 stroke-[1.5]" />
                    )}

                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <span className="font-semibold text-slate-900 leading-snug">{item.title}</span>
                        <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                          {item.isRequired && (
                            <span className="text-[10px] sm:text-[11px] font-semibold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                              Bắt buộc
                            </span>
                          )}
                          {isApproved ? (
                            <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                              Đã đạt
                            </span>
                          ) : isSubmitted ? (
                            <span className="text-[10px] sm:text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                              Chờ duyệt
                            </span>
                          ) : isNeedsRevision ? (
                            <span className="text-[10px] sm:text-[11px] font-semibold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                              Cần sửa
                            </span>
                          ) : (
                            <span className="text-[10px] sm:text-[11px] text-slate-400 font-normal">
                              Chưa nộp
                            </span>
                          )}
                        </div>
                      </div>
                      {item.description && (
                        <p className="text-xs text-slate-500 font-normal leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 px-4 text-center rounded-xl bg-slate-50 border border-slate-100 text-xs sm:text-sm text-slate-400 font-normal">
              Chưa có tiêu chí xét duyệt cho tiêu chuẩn này.
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors shadow-sm cursor-pointer"
          >
            <span>Đã hiểu</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
