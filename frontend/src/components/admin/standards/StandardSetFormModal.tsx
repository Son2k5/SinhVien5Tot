import { useEffect, useMemo, useReducer } from 'react';
import {
  AwardLevel,
  AwardType,
  AWARD_LEVEL_LABELS,
  AWARD_TYPE_LABELS,
} from '../../../types/admin/campaign';
import {
  StandardSetStatus,
  type CreateStandardSetRequest,
  type StandardSetResponse,
  type UpdateStandardSetRequest,
} from '../../../types/admin/standard';
import { sanitizeApiError } from '../../../services/apiErrorSanitizer';
import {
  AlertCircle,
  Copy,
  Loader2,
  X,
} from 'lucide-react';

export interface StandardSetFormModalProps {
  isOpen: boolean;
  standardSet?: StandardSetResponse | null;
  existingSets?: StandardSetResponse[];
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: (
    data: CreateStandardSetRequest | UpdateStandardSetRequest,
  ) => Promise<void> | void;
}

const EMPTY_SETS: StandardSetResponse[] = [];

interface StandardSetFormState {
  name: string;
  academicYear: string;
  level: AwardLevel;
  awardType: AwardType;
  templateStandardSetId: string;
  formError: string | null;
  fieldErrors: Record<string, string>;
}

type StandardSetFormAction =
  | { type: 'RESET'; standardSet?: StandardSetResponse | null }
  | { type: 'SET_FIELD'; field: keyof StandardSetFormState; value: unknown }
  | { type: 'SET_ERRORS'; fieldErrors: Record<string, string> }
  | { type: 'SET_FORM_ERROR'; formError: string | null };

function getInitialStandardSetState(
  standardSet?: StandardSetResponse | null,
): StandardSetFormState {
  if (standardSet) {
    return {
      name: standardSet.name || '',
      academicYear: standardSet.academicYear,
      level: standardSet.level,
      awardType: standardSet.awardType,
      templateStandardSetId: '',
      formError: null,
      fieldErrors: {},
    };
  }
  return {
    name: '',
    academicYear: '2025-2026',
    level: AwardLevel.School,
    awardType: AwardType.Individual,
    templateStandardSetId: '',
    formError: null,
    fieldErrors: {},
  };
}

function standardSetFormReducer(
  state: StandardSetFormState,
  action: StandardSetFormAction,
): StandardSetFormState {
  switch (action.type) {
    case 'RESET':
      return getInitialStandardSetState(action.standardSet);
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_ERRORS':
      return {
        ...state,
        fieldErrors: action.fieldErrors,
      };
    case 'SET_FORM_ERROR':
      return { ...state, formError: action.formError };
    default:
      return state;
  }
}

export function StandardSetFormModal({
  isOpen,
  standardSet,
  existingSets = EMPTY_SETS,
  isLoading = false,
  onClose,
  onSubmit,
}: StandardSetFormModalProps) {
  const isEdit = Boolean(standardSet);

  const [state, dispatch] = useReducer(
    standardSetFormReducer,
    standardSet,
    getInitialStandardSetState,
  );

  const { name, academicYear, level, awardType, templateStandardSetId, formError, fieldErrors } = state;

  useEffect(() => {
    if (!isOpen) return;
    dispatch({ type: 'RESET', standardSet });
  }, [isOpen, standardSet]);

  const templateCandidates = useMemo(() => {
    return existingSets.filter(
      (s) => s.level === level && s.awardType === awardType && s.id !== standardSet?.id,
    );
  }, [existingSets, level, awardType, standardSet?.id]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      errors.name = 'Tên bộ tiêu chuẩn không được để trống.';
    } else if (name.length > 255) {
      errors.name = 'Tên bộ tiêu chuẩn không được quá 255 ký tự.';
    } else {
      const duplicate = existingSets.some(
        (s) => s.name.trim().toLowerCase() === trimmedName.toLowerCase() && s.id !== standardSet?.id,
      );
      if (duplicate) {
        errors.name = 'Tên bộ tiêu chuẩn đã tồn tại. Vui lòng chọn tên khác.';
      }
    }

    if (!academicYear.trim()) {
      errors.academicYear = 'Năm học không được để trống.';
    } else if (academicYear.length > 20) {
      errors.academicYear = 'Năm học không được quá 20 ký tự.';
    }

    dispatch({
      type: 'SET_ERRORS',
      fieldErrors: errors,
    });
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'SET_FORM_ERROR', formError: null });

    if (!validate()) {
      dispatch({ type: 'SET_FORM_ERROR', formError: 'Vui lòng kiểm tra lại các trường thông tin.' });
      return;
    }

    const payload: CreateStandardSetRequest = {
      name: name.trim(),
      academicYear: academicYear.trim(),
      level,
      awardType,
      templateStandardSetId: templateStandardSetId ? templateStandardSetId : null,
    };

    try {
      await onSubmit(payload);
      onClose();
    } catch (err: unknown) {
      dispatch({ type: 'SET_FORM_ERROR', formError: sanitizeApiError(err) });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="standard-set-modal-title"
    >
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-5 relative">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X size={18} />
        </button>

        <div className="space-y-1">
          <h2 id="standard-set-modal-title" className="text-base font-semibold text-slate-800">
            {isEdit
              ? `Bộ tiêu chuẩn ${standardSet?.academicYear}`
              : 'Thiết lập khung tiêu chuẩn SV5T'}
          </h2>
          <p className="text-xs text-slate-500">
            Định nghĩa năm học, cấp xét duyệt và các tiêu chí đánh giá Sinh viên 5 tốt.
          </p>
        </div>

        {formError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-700 font-medium">
            <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="standard-set-name-input" className="text-xs font-bold text-slate-700 block mb-1">
              Tên bộ tiêu chuẩn <span className="text-rose-500">*</span>
            </label>
            <input
              id="standard-set-name-input"
              type="text"
              value={name}
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'name', value: e.target.value })}
              placeholder="Ví dụ: Bộ tiêu chuẩn Sinh viên 5 Tốt cấp Trường 2025-2026"
              className={`w-full h-10 px-3.5 text-xs border rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 ${
                fieldErrors.name
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
              }`}
            />
            {fieldErrors.name && (
              <p className="text-[11px] text-rose-600 mt-1 font-medium">
                {fieldErrors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="standard-set-year-input" className="text-xs font-bold text-slate-700 block mb-1">
              Năm học áp dụng <span className="text-rose-500">*</span>
            </label>
            <input
              id="standard-set-year-input"
              type="text"
              value={academicYear}
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'academicYear', value: e.target.value })}
              placeholder="Ví dụ: 2025-2026"
              className={`w-full h-10 px-3.5 text-xs border rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 ${
                fieldErrors.academicYear
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
              }`}
            />
            {fieldErrors.academicYear && (
              <p className="text-[11px] text-rose-600 mt-1 font-medium">
                {fieldErrors.academicYear}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="standard-set-level-select" className="text-xs font-bold text-slate-700 block mb-1">
                Cấp xét duyệt <span className="text-rose-500">*</span>
              </label>
              <select
                id="standard-set-level-select"
                value={level}
                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'level', value: e.target.value as AwardLevel })}
                className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
              >
                <option value={AwardLevel.School}>{AWARD_LEVEL_LABELS[AwardLevel.School]}</option>
                <option value={AwardLevel.City}>{AWARD_LEVEL_LABELS[AwardLevel.City]}</option>
                <option value={AwardLevel.Central}>{AWARD_LEVEL_LABELS[AwardLevel.Central]}</option>
              </select>
            </div>

            <div>
              <label htmlFor="standard-set-award-type-select" className="text-xs font-bold text-slate-700 block mb-1">
                Loại danh hiệu <span className="text-rose-500">*</span>
              </label>
              <select
                id="standard-set-award-type-select"
                value={awardType}
                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'awardType', value: e.target.value as AwardType })}
                className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
              >
                <option value={AwardType.Individual}>{AWARD_TYPE_LABELS[AwardType.Individual]}</option>
                <option value={AwardType.Collective}>{AWARD_TYPE_LABELS[AwardType.Collective]}</option>
              </select>
            </div>
          </div>

          {!isEdit && (
            <div>
              <label htmlFor="standard-set-template-select" className="text-xs font-bold text-slate-700 block mb-1">
                Nhân bản từ bộ tiêu chuẩn mẫu (Tuỳ chọn)
              </label>
              <select
                id="standard-set-template-select"
                value={templateStandardSetId}
                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'templateStandardSetId', value: e.target.value })}
                className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
              >
                <option value="">-- Tạo bộ khung rỗng mới (Tự cấu hình tiêu chí) --</option>
                {templateCandidates.map((s) => (
                  <option key={s.id} value={s.id}>
                    Năm học {s.academicYear} · {AWARD_LEVEL_LABELS[s.level]} ({s.status === StandardSetStatus.Published ? 'Đã công bố' : 'Bản nháp'})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <Copy size={13} className="text-blue-600 flex-shrink-0" />
                <span>Nhân bản sẽ sao chép nguyên vẹn toàn bộ cây 5 nhóm tiêu chuẩn và các tiêu chí con từ bộ mẫu.</span>
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-1.5 text-xs font-medium text-white rounded-lg bg-blue-600 hover:bg-blue-700 inline-flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
            >
              {isLoading && <Loader2 size={13} className="animate-spin" />}
              <span>{isEdit ? 'Lưu cập nhật' : 'Khởi tạo bộ tiêu chuẩn'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
