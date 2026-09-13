import { useMemo } from 'react';
import {
  CriterionType,
  type CriterionResponse,
  type StandardResponse,
} from '../../../types/admin/standard';
import {
  CriterionEvaluationTypeBadge,
  StandardGroupBadge,
} from '../common/AdminStatusBadge';
import {
  CheckCircle2,
  Edit2,
  FolderTree,
  Plus,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react';

export interface CriterionTreeProps {
  standards?: StandardResponse[] | null;
  isEditable?: boolean;
  onAddGroup?: () => void;
  onQuickInitAllGroups?: () => void;
  onEditGroup?: (standard: StandardResponse) => void;
  onDeleteGroup?: (standard: StandardResponse) => void;
  onAddCriterion?: (
    standard: StandardResponse,
    kind: 'mandatory' | 'optional',
  ) => void;
  onEditCriterion?: (
    standard: StandardResponse,
    criterion: CriterionResponse,
  ) => void;
  onDeleteCriterion?: (
    standard: StandardResponse,
    criterion: CriterionResponse,
  ) => void;
}

const EMPTY_STANDARDS: StandardResponse[] = [];

export function CriterionTree({
  standards = EMPTY_STANDARDS,
  isEditable = false,
  onAddGroup,
  onQuickInitAllGroups,
  onEditGroup,
  onDeleteGroup,
  onAddCriterion,
  onEditCriterion,
  onDeleteCriterion,
}: CriterionTreeProps) {
  const sortedStandards = useMemo(() => {
    return (standards ?? EMPTY_STANDARDS).toSorted((a, b) => a.displayOrder - b.displayOrder);
  }, [standards]);

  if (sortedStandards.length === 0) {
    return (
      <div className="py-14 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-6 space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <FolderTree size={28} />
        </div>
        <div className="max-w-md mx-auto space-y-1">
          <h4 className="text-base font-bold text-slate-800">
            Chưa có Tiêu chuẩn lớn nào
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Bộ tiêu chuẩn cần đủ 5 tiêu chuẩn chính (Đạo đức tốt, Học tập tốt, Thể lực tốt, Tình nguyện tốt, Hội nhập tốt). Bạn có thể khởi tạo nhanh chỉ với 1 click!
          </p>
        </div>

        {isEditable && (
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
            {onQuickInitAllGroups && (
              <button
                type="button"
                onClick={onQuickInitAllGroups}
                className="px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Zap size={14} />
                <span>Khởi tạo 5 tiêu chuẩn SV5T</span>
              </button>
            )}

            {onAddGroup && (
              <button
                type="button"
                onClick={onAddGroup}
                className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Plus size={14} />
                <span>Thêm tiêu chuẩn lớn</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedStandards.map((std, groupIdx) => {
        const criteriaList = std.criteria ?? [];

        // Direct mandatory criteria (no parent within standard or type Requirement at root)
        const mandatoryCriteria = criteriaList
          .filter((c) => c.type === CriterionType.Requirement && !c.parentCriterionId)
          .sort((a, b) => a.displayOrder - b.displayOrder);

        // Sub-groups or criteria with parent (optional categories)
        const optionalSubGroups = criteriaList.filter((c) => c.type === CriterionType.Group);
        const optionalCriteria = criteriaList
          .filter((c) => Boolean(c.parentCriterionId) || optionalSubGroups.some((sub) => sub.id === c.parentCriterionId))
          .sort((a, b) => a.displayOrder - b.displayOrder);

        return (
          <div
            key={std.id}
            className="bg-white rounded-xl border border-slate-200 hover:border-blue-300/80 shadow-[0_2px_8px_rgba(15,23,42,0.04)] hover:shadow-[0_4px_16px_rgba(37,99,235,0.06)] transition-[border-color,box-shadow] overflow-hidden"
          >
            {/* Header of Major Standard */}
            <div className="p-3.5 sm:p-4 bg-gradient-to-r from-blue-100/70 via-sky-50/90 to-blue-50/60 border-b border-blue-200/90 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-8 min-w-[32px] px-2.5 rounded-full bg-white text-blue-700 border border-blue-300 font-semibold flex items-center justify-center text-xs shadow-2xs shrink-0">
                  <span className="text-[11px] text-blue-400 font-medium mr-0.5">#</span>
                  <span className="text-[13px] font-semibold text-blue-700">{groupIdx + 1}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-800">
                      {std.title}
                    </h3>
                    {std.groupCode && <StandardGroupBadge groupCode={std.groupCode} />}
                  </div>
                  {std.description && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {std.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions for Major Standard */}
              {isEditable && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onAddCriterion?.(std, 'mandatory')}
                    className="h-7 px-2.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md inline-flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>Thêm bắt buộc</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onAddCriterion?.(std, 'optional')}
                    className="h-7 px-2.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md inline-flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>Thêm tự chọn</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onEditGroup?.(std)}
                    className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-white/80 rounded-lg border border-slate-200/80 transition-colors cursor-pointer"
                    title="Chỉnh sửa tiêu chuẩn lớn"
                  >
                    <Edit2 size={13} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteGroup?.(std)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200/80 transition-colors cursor-pointer"
                    title="Xóa tiêu chuẩn lớn"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>

            {/* Criteria Body */}
            <div className="p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              {/* SECTION 1: TIÊU CHÍ BẮT BUỘC */}
              <div className="space-y-3 p-4 rounded-xl bg-emerald-50/40 border border-emerald-100/90 shadow-2xs flex flex-col">
                <div className="flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-emerald-600" />
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Tiêu chí bắt buộc ({mandatoryCriteria.length})
                    </h4>
                  </div>
                  <span className="text-[11px] text-emerald-700 bg-white/90 border border-emerald-200/90 font-medium px-2 py-0.5 rounded-full">
                    Phải đạt tất cả
                  </span>
                </div>

                {mandatoryCriteria.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-emerald-200/60 rounded-xl bg-white/70">
                    Chưa có tiêu chí bắt buộc nào.
                    {isEditable && (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => onAddCriterion?.(std, 'mandatory')}
                          className="text-xs font-medium text-emerald-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Plus size={13} /> Thêm tiêu chí bắt buộc đầu tiên
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar overscroll-contain">
                    {mandatoryCriteria.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 sm:p-3.5 bg-white rounded-xl border border-slate-200/80 hover:border-emerald-200 shadow-2xs space-y-2 transition-[border-color,box-shadow]"
                      >
                        <div>
                          <p className="text-[13px] sm:text-sm font-medium text-slate-800 leading-snug">
                            {item.title}
                          </p>
                          {item.description && (
                            <p className="text-xs text-slate-500 leading-relaxed font-normal mt-1">
                              {item.description}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-100">
                          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                            <CriterionEvaluationTypeBadge evaluationType={item.evaluationType} />
                            {item.reviewGuidance && (
                              <span
                                className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 truncate max-w-[200px] font-normal"
                                title={item.reviewGuidance}
                              >
                                {item.reviewGuidance}
                              </span>
                            )}
                          </div>

                          {isEditable && (
                            <div className="flex items-center gap-1 shrink-0 ml-auto">
                              <button
                                type="button"
                                onClick={() => onEditCriterion?.(std, item)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                title="Sửa tiêu chí"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteCriterion?.(std, item)}
                                className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                title="Xóa tiêu chí"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 2: TIÊU CHÍ TỰ CHỌN */}
              <div className="space-y-3 p-4 rounded-xl bg-amber-50/40 border border-amber-100/90 shadow-2xs flex flex-col">
                <div className="flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-1.5">
                    <Sparkles size={15} className="text-amber-600" />
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Tiêu chí tự chọn ({optionalCriteria.length})
                    </h4>
                  </div>
                  <span className="text-[11px] text-amber-700 bg-white/90 border border-amber-200/90 font-medium px-2 py-0.5 rounded-full">
                    Đạt ít nhất 1 mục
                  </span>
                </div>

                {optionalCriteria.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-amber-200/60 rounded-xl bg-white/70">
                    Chưa có tiêu chí tự chọn nào.
                    {isEditable && (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => onAddCriterion?.(std, 'optional')}
                          className="text-xs font-medium text-amber-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Plus size={13} /> Thêm tiêu chí tự chọn
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar overscroll-contain">
                    {optionalCriteria.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 sm:p-3.5 bg-white rounded-xl border border-slate-200/80 hover:border-amber-200 shadow-2xs space-y-2 transition-[border-color,box-shadow]"
                      >
                        <div>
                          <p className="text-[13px] sm:text-sm font-medium text-slate-800 leading-snug">
                            {item.title}
                          </p>
                          {item.description && (
                            <p className="text-xs text-slate-500 leading-relaxed font-normal mt-1">
                              {item.description}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-100">
                          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                            <CriterionEvaluationTypeBadge evaluationType={item.evaluationType} />
                            {item.reviewGuidance && (
                              <span
                                className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 truncate max-w-[200px] font-normal"
                                title={item.reviewGuidance}
                              >
                                {item.reviewGuidance}
                              </span>
                            )}
                          </div>

                          {isEditable && (
                            <div className="flex items-center gap-1 shrink-0 ml-auto">
                              <button
                                type="button"
                                onClick={() => onEditCriterion?.(std, item)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                title="Sửa tiêu chí"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteCriterion?.(std, item)}
                                className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                title="Xóa tiêu chí"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
