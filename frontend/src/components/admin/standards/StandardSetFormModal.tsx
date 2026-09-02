import { useEffect, useMemo, useState } from 'react';
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

export function StandardSetFormModal({
  isOpen,
  standardSet,
  existingSets = [],
  isLoading = false,
  onClose,
  onSubmit,
}: StandardSetFormModalProps) {
  const isEdit = Boolean(standardSet);

  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [level, setLevel] = useState<AwardLevel>(AwardLevel.School);
  const [awardType, setAwardType] = useState<AwardType>(AwardType.Individual);
  const [templateStandardSetId, setTemplateStandardSetId] = useState<string>('');

  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;

    if (standardSet) {
      setAcademicYear(standardSet.academicYear);
      setLevel(standardSet.level);
      setAwardType(standardSet.awardType);
      setTemplateStandardSetId('');
    } else {
      setAcademicYear('2025-2026');
      setLevel(AwardLevel.School);
      setAwardType(AwardType.Individual);
      setTemplateStandardSetId('');
    }

    setFormError(null);
    setFieldErrors({});
  }, [isOpen, standardSet]);

  const templateCandidates = useMemo(() => {
    return existingSets.filter(
      (s) => s.level === level && s.awardType === awardType && s.id !== standardSet?.id,
    );
  }, [existingSets, level, awardType, standardSet?.id]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!academicYear.trim()) {
      errors.academicYear = 'Năm học không được để trống.';
    } else if (academicYear.length > 20) {
      errors.academicYear = 'Năm học không được quá 20 ký tự.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validate()) {
      setFormError('Vui lòng kiểm tra lại các trường thông tin.');
      return;
    }

    const payload: CreateStandardSetRequest = {
      academicYear: academicYear.trim(),
      level,
      awardType,
      templateStandardSetId: templateStandardSetId ? templateStandardSetId : null,
    };

    try {
      await onSubmit(payload);
      onClose();
    } catch (err: unknown) {
      setFormError(sanitizeApiError(err));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-5 relative">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="space-y-1">
          <h2 className="text-base font-semibold text-slate-800">
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
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Năm học áp dụng <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
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
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Cấp xét duyệt <span className="text-rose-500">*</span>
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as AwardLevel)}
                className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
              >
                <option value={AwardLevel.School}>{AWARD_LEVEL_LABELS[AwardLevel.School]}</option>
                <option value={AwardLevel.City}>{AWARD_LEVEL_LABELS[AwardLevel.City]}</option>
                <option value={AwardLevel.Central}>{AWARD_LEVEL_LABELS[AwardLevel.Central]}</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Loại danh hiệu <span className="text-rose-500">*</span>
              </label>
              <select
                value={awardType}
                onChange={(e) => setAwardType(e.target.value as AwardType)}
                className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
              >
                <option value={AwardType.Individual}>{AWARD_TYPE_LABELS[AwardType.Individual]}</option>
                <option value={AwardType.Collective}>{AWARD_TYPE_LABELS[AwardType.Collective]}</option>
              </select>
            </div>
          </div>

          {!isEdit && (
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Nhân bản từ bộ tiêu chuẩn mẫu (Tuỳ chọn)
              </label>
              <select
                value={templateStandardSetId}
                onChange={(e) => setTemplateStandardSetId(e.target.value)}
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
