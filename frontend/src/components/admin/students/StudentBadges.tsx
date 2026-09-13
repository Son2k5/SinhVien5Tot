import {
  EVIDENCE_STATUS_LABELS,
  REVIEW_ACTION_LABELS,
  SUBMISSION_STATUS_LABELS,
  type EvidenceStatus,
  type ReviewAction,
  type SubmissionStatus,
} from '../../../types/admin/student';
import {
  CheckCircle2,
  Clock3,
  FileEdit,
  FileWarning,
  FileX2,
  XCircle,
  History,
  Send,
  RotateCcw,
  Undo2,
} from 'lucide-react';

const base =
  "inline-flex items-center gap-1.5 h-[26px] px-2.5 rounded-full border text-[11px] font-medium whitespace-nowrap leading-none tracking-[-0.01em] shadow-[0_1px_2px_rgba(15,40,80,0.06)]";

export function VerifiedBadge({ verified, onDark }: { verified: boolean; onDark?: boolean }) {
  if (onDark) {
    return (
      <span className={`text-xs font-normal whitespace-nowrap ${verified ? 'text-white' : 'text-white/70'}`}>
        {verified ? 'Đã xác minh' : 'Chưa xác minh'}
      </span>
    );
  }
  return (
    <span
      className={`text-xs font-normal whitespace-nowrap ${
        verified ? 'text-slate-800' : 'text-slate-500'
      }`}
    >
      {verified ? 'Đã xác minh' : 'Chưa xác minh'}
    </span>
  );
}

export function ActiveBadge({ active, onDark }: { active: boolean; onDark?: boolean }) {
  if (onDark) {
    return active ? (
      <span className={`${base} border-emerald-400/40 bg-emerald-500/20 text-emerald-100 backdrop-blur`}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
        Đang hoạt động
      </span>
    ) : (
      <span className={`${base} border-rose-400/40 bg-rose-500/25 text-rose-100 backdrop-blur`}>
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
        Đã khóa
      </span>
    );
  }
  return active ? (
    <span className={`${base} border-emerald-200 bg-emerald-50 text-emerald-700`}>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
      Đang hoạt động
    </span>
  ) : (
    <span className={`${base} border-rose-200 bg-rose-50 text-rose-700`}>
      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
      Đã khóa
    </span>
  );
}

const EVIDENCE_STYLE: Record<EvidenceStatus, { cls: string; Icon: typeof Clock3 }> = {
  Draft: { cls: 'border-slate-200 bg-slate-50 text-slate-500', Icon: FileEdit },
  Submitted: { cls: 'border-blue-200 bg-blue-50 text-blue-700', Icon: Send },
  Approved: { cls: 'border-emerald-200 bg-emerald-50 text-emerald-700', Icon: CheckCircle2 },
  Rejected: { cls: 'border-rose-200 bg-rose-50 text-rose-700', Icon: XCircle },
  NeedsRevision: { cls: 'border-amber-200 bg-amber-50 text-amber-700', Icon: FileWarning },
};

export function EvidenceStatusBadge({ status }: { status: EvidenceStatus }) {
  const s = EVIDENCE_STYLE[status] ?? EVIDENCE_STYLE.Draft;
  const Icon = s.Icon;
  return (
    <span className={`${base} ${s.cls}`}>
      <Icon size={13} className="shrink-0" />
      {EVIDENCE_STATUS_LABELS[status] ?? status}
    </span>
  );
}

const SUBMISSION_STYLE: Record<SubmissionStatus, { cls: string; Icon: typeof Clock3 }> = {
  Draft: { cls: 'border-slate-200 bg-slate-50 text-slate-500', Icon: FileEdit },
  Submitted: { cls: 'border-blue-200 bg-blue-50 text-blue-700', Icon: Send },
  UnderReview: { cls: 'border-violet-200 bg-violet-50 text-violet-700', Icon: Clock3 },
  NeedsRevision: { cls: 'border-amber-200 bg-amber-50 text-amber-700', Icon: FileWarning },
  Resubmitted: { cls: 'border-cyan-200 bg-cyan-50 text-cyan-700', Icon: RotateCcw },
  Approved: { cls: 'border-emerald-200 bg-emerald-50 text-emerald-700', Icon: CheckCircle2 },
  Rejected: { cls: 'border-rose-200 bg-rose-50 text-rose-700', Icon: FileX2 },
  Withdrawn: { cls: 'border-slate-200 bg-slate-100 text-slate-500', Icon: Undo2 },
};

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  const s = SUBMISSION_STYLE[status] ?? SUBMISSION_STYLE.Draft;
  const Icon = s.Icon;
  return (
    <span className={`${base} ${s.cls}`}>
      <Icon size={13} className="shrink-0" />
      {SUBMISSION_STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function ReviewActionLabel({ action }: { action: ReviewAction }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-800">
      <History size={13} className="shrink-0 text-slate-400" />
      {REVIEW_ACTION_LABELS[action] ?? action}
    </span>
  );
}


