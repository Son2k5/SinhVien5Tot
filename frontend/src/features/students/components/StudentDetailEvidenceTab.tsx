import { ClipboardCheck, FileText } from 'lucide-react';
import type {
  AdminStudentEvidenceGroup,
  AdminStudentEvidenceItem,
} from '../types/student.types';
import { EvidenceStatusBadge } from './StudentBadges';

const GROUP_TONE: Record<string, { bg: string; text: string; border: string; bar: string }> = {
  Ethics: { bg: '#eefbf6', text: '#0b7952', border: '#b9f0dc', bar: 'bg-emerald-500' },
  Study: { bg: '#edf6ff', text: '#1367bf', border: '#b8dcfe', bar: 'bg-blue-600' },
  Fitness: { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa', bar: 'bg-orange-500' },
  Volunteer: { bg: '#fdf2f8', text: '#be185d', border: '#fbcfe8', bar: 'bg-pink-500' },
  Integration: { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe', bar: 'bg-violet-500' },
};
const DEFAULT_GROUP_TONE = { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1', bar: 'bg-slate-400' };

interface StudentDetailEvidenceTabProps {
  evidenceGroups: AdminStudentEvidenceGroup[];
  onViewEvidence: (evidenceId: string) => void;
  onReviewEvidence: (item: AdminStudentEvidenceItem) => void;
}

export function StudentDetailEvidenceTab({
  evidenceGroups,
  onViewEvidence,
  onReviewEvidence,
}: StudentDetailEvidenceTabProps) {
  if (evidenceGroups.length === 0) {
    return (
      <div className="bg-white border border-slate-200/70 rounded-2xl p-10 text-center shadow-[0_10px_30px_-18px_rgba(15,42,82,0.25)]">
        <ClipboardCheck size={28} className="mx-auto text-sky-200" />
        <p className="mt-2 text-sm text-slate-500">Chưa có minh chứng.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {evidenceGroups.map((g) => {
        const pct = g.totalCount > 0 ? Math.round((g.approvedCount / g.totalCount) * 100) : 0;
        const tone = GROUP_TONE[g.groupCode ?? ''] ?? DEFAULT_GROUP_TONE;

        return (
          <section
            key={g.groupName}
            className="bg-white border border-slate-200/70 rounded-2xl shadow-[0_10px_30px_-18px_rgba(15,42,82,0.25)] overflow-hidden"
          >
            <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100 bg-gradient-to-r from-sky-50/60 to-transparent flex items-center justify-between gap-3">
              <span
                className="inline-flex items-center gap-2 px-2.5 h-[26px] rounded-full border text-[11px] font-semibold whitespace-nowrap"
                style={{ backgroundColor: tone.bg, color: tone.text, borderColor: tone.border }}
              >
                <ClipboardCheck size={13} />
                {g.groupName}
              </span>
              <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                {g.approvedCount}/{g.totalCount} • {pct}%
              </span>
            </div>

            <div className="px-4 sm:px-5 pt-3">
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${pct}%` }} />
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {g.items.map((e) => (
                <div
                  key={e.id}
                  className="px-4 sm:px-5 py-3 flex items-center gap-3 hover:bg-sky-50/50 transition-colors group"
                >
                  <span className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 flex items-center justify-center shrink-0 group-hover:bg-sky-50 group-hover:text-sky-600 group-hover:border-sky-100 transition-colors">
                    <FileText size={15} />
                  </span>
                  <div className="flex-1 min-w-0 font-inter">
                    <div className="text-[13px] font-normal text-slate-800 truncate" title={e.criterionTitle}>
                      {e.criterionTitle}
                    </div>
                  </div>
                  <EvidenceStatusBadge status={e.status} />
                  <button
                    type="button"
                    onClick={() => onViewEvidence(e.id)}
                    className="h-8 px-3 inline-flex items-center rounded-xl text-[12px] font-semibold text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 cursor-pointer transition-colors shrink-0"
                  >
                    Xem minh chứng
                  </button>
                  <button
                    type="button"
                    onClick={() => onReviewEvidence(e)}
                    className="h-8 px-3 inline-flex items-center rounded-xl text-[12px] font-semibold text-[#0b63d6] bg-sky-50 border border-sky-100 hover:bg-[#0b63d6] hover:text-white hover:border-[#0b63d6] cursor-pointer transition-[background-color,border-color,color] shrink-0"
                  >
                    Duyệt
                  </button>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
