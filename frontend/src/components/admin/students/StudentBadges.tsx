import {
  EVIDENCE_STATUS_LABELS,
  REVIEW_ACTION_LABELS,
  SUBMISSION_STATUS_LABELS,
  type EvidenceStatus,
  type ReviewAction,
  type SubmissionStatus,
} from '../../../types/admin/student';
import {
  BadgeCheck,
  BadgeX,
  CheckCircle2,
  Clock3,
  FileEdit,
  FileWarning,
  FileX2,
  Lock,
  Unlock,
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
    return verified ? (
      <span className={`${base} border-white/40 bg-white/20 text-white backdrop-blur`}>
        <BadgeCheck size={13} className="shrink-0" />
        Đã xác minh
      </span>
    ) : (
      <span className={`${base} border-white/40 bg-white/10 text-white/90 backdrop-blur`}>
        <BadgeX size={13} className="shrink-0" />
        Chưa xác minh
      </span>
    );
  }
  return verified ? (
    <span className={`${base} border-emerald-200/80 bg-emerald-50/90 text-emerald-700`}>
      <BadgeCheck size={13} className="shrink-0" />
      Đã xác minh
    </span>
  ) : (
    <span className={`${base} border-slate-200 bg-slate-100/80 text-slate-500`}>
      <BadgeX size={13} className="shrink-0" />
      Chưa xác minh
    </span>
  );
}

export function ActiveBadge({ active, onDark }: { active: boolean; onDark?: boolean }) {
  if (onDark) {
    return active ? (
      <span className={`${base} border-white/40 bg-white/20 text-white backdrop-blur`}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse shrink-0 ring-2 ring-white/40" />
        <Unlock size={12} className="shrink-0" />
        Đang hoạt động
      </span>
    ) : (
      <span className={`${base} border-white/40 bg-rose-500/25 text-white backdrop-blur`}>
        <Lock size={12} className="shrink-0" />
        Đã khóa
      </span>
    );
  }
  return active ? (
    <span className={`${base} border-sky-200/80 bg-sky-50/90 text-sky-700`}>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
      <Unlock size={12} className="shrink-0" />
      Đang hoạt động
    </span>
  ) : (
    <span className={`${base} border-rose-200 bg-rose-50 text-rose-700`}>
      <Lock size={12} className="shrink-0" />
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


