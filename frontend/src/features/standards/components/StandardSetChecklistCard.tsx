import {
  Archive,
  Award,
  Check,
  CheckCircle2,
  CheckSquare,
  FileEdit,
  GraduationCap,
  Info,
  AlertTriangle,
} from 'lucide-react';
import {
  AWARD_LEVEL_LABELS,
  AWARD_TYPE_LABELS,
} from '../../campaigns/types/campaign.types';
import {
  StandardSetStatus,
  type StandardSetResponse,
  type StandardGroupCode,
  type StandardResponse,
} from '../types/standard.types';

interface StandardSetChecklistCardProps {
  standardSet: StandardSetResponse;
  standards: StandardResponse[];
  isIndividual: boolean;
  groupStatus: {
    checklist: Array<{ code: StandardGroupCode; label: string; isComplete: boolean }>;
    completeCount: number;
    isAllReady: boolean;
  } | null;
}

export function StandardSetChecklistCard({
  standardSet,
  standards,
  isIndividual,
  groupStatus,
}: StandardSetChecklistCardProps) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-[290px_1fr] gap-3">
      {/* Card trái: Thông tin tiêu chuẩn */}
      <div className="bg-gradient-to-br from-blue-50/60 via-white to-white rounded-xl border border-blue-100/90 shadow-[0_2px_10px_rgba(37,99,235,0.04)] p-3 sm:p-3.5">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0">
              <Info className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-[13px] font-semibold text-slate-900 tracking-tight">Thông tin tiêu chuẩn</h2>
          </div>
          <div>
            {standardSet.status === StandardSetStatus.Draft && (
              <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                <FileEdit className="w-3 h-3" />
                Bản nháp
              </span>
            )}
            {standardSet.status === StandardSetStatus.Published && (
              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                <CheckCircle2 className="w-3 h-3" />
                Đã công bố
              </span>
            )}
            {standardSet.status === StandardSetStatus.Archived && (
              <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                <Archive className="w-3 h-3" />
                Đã lưu trữ
              </span>
            )}
          </div>
        </div>

        <hr className="border-blue-50 my-2" />

        <dl className="space-y-1.5">
          {Boolean(standardSet.name?.trim()) && (
            <div className="flex items-center justify-between gap-2">
              <dt className="flex items-center gap-1.5 text-xs text-slate-500">
                <FileEdit className="w-3.5 h-3.5 text-blue-500/80 shrink-0" />
                Tên
              </dt>
              <dd className="text-xs font-medium text-slate-800 truncate max-w-[170px]" title={standardSet.name}>
                {standardSet.name}
              </dd>
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <dt className="flex items-center gap-1.5 text-xs text-slate-500">
              <GraduationCap className="w-3.5 h-3.5 text-blue-500/80" />
              Cấp độ
            </dt>
            <dd className="text-xs font-medium text-slate-800">{AWARD_LEVEL_LABELS[standardSet.level]}</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="flex items-center gap-1.5 text-xs text-slate-500">
              <Award className="w-3.5 h-3.5 text-blue-500/80" />
              Danh hiệu
            </dt>
            <dd className="text-xs font-medium text-slate-800">{AWARD_TYPE_LABELS[standardSet.awardType]}</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="flex items-center gap-1.5 text-xs text-slate-500">
              <CheckSquare className="w-3.5 h-3.5 text-blue-500/80" />
              Tiêu chuẩn lớn
            </dt>
            <dd className="text-xs font-medium text-blue-700">
              {standards.length}{isIndividual ? '/5' : ''} tiêu chuẩn
            </dd>
          </div>
        </dl>
      </div>

      {/* Card phải: 5 Tiêu chuẩn */}
      {isIndividual && groupStatus ? (
        <div className="bg-gradient-to-br from-sky-50/40 via-white to-white rounded-xl border border-slate-200/90 shadow-[0_2px_10px_rgba(14,165,233,0.03)] p-3 sm:p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <h2 className="text-[13px] font-semibold text-slate-900 tracking-tight">5 Tiêu chuẩn Sinh viên 5 tốt</h2>
            </div>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                groupStatus.isAllReady
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-amber-200 bg-amber-50 text-amber-700'
              }`}
            >
              {groupStatus.isAllReady ? (
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5" />
              )}
              Đã có {groupStatus.completeCount}/5 tiêu chuẩn
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {groupStatus.checklist.map((item) => (
              <div
                key={item.code}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-center transition hover:shadow-xs ${
                  item.isComplete
                    ? 'border-emerald-200/90 bg-emerald-50/90 text-emerald-700 shadow-2xs'
                    : 'border-slate-200 bg-slate-50 text-slate-500'
                }`}
              >
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full ${
                    item.isComplete ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200/70 text-slate-400'
                  }`}
                >
                  {item.isComplete ? (
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 stroke-[2]" />
                  )}
                </div>
                <span className={`text-xs font-medium leading-tight ${item.isComplete ? 'text-emerald-700' : 'text-slate-600'}`}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.05)] p-3 sm:p-3.5 flex flex-col justify-center items-center text-center text-slate-500">
          <span className="text-xs">Bộ tiêu chuẩn Tập thể với {standards.length} nhóm tiêu chuẩn đang áp dụng.</span>
        </div>
      )}
    </section>
  );
}
