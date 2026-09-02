import { useEffect, useState } from 'react';
import {
  CriterionOperator,
  StandardGroupCode,
  STANDARD_GROUP_CODE_LABELS,
  type CreateStandardRequest,
  type StandardResponse,
  type UpdateStandardRequest,
} from '../../../types/admin/standard';
import { sanitizeApiError } from '../../../services/apiErrorSanitizer';
import {
  AlertCircle,
  FolderTree,
  Loader2,
  X,
} from 'lucide-react';

export interface StandardGroupModalProps {
  isOpen: boolean;
  standardGroup?: StandardResponse | null;
  existingGroups?: StandardResponse[];
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: (
    data: CreateStandardRequest | UpdateStandardRequest,
  ) => Promise<void> | void;
}

const DEFAULT_GROUP_INFO: Record<StandardGroupCode, { title: string; desc: string }> = {
  [StandardGroupCode.Ethics]: {
    title: 'Đạo đức tốt',
    desc: 'Đánh giá về tư tưởng chính trị, đạo đức, lối sống và ý thức chấp hành pháp luật, nội quy nhà trường.',
  },
  [StandardGroupCode.Study]: {
    title: 'Học tập tốt',
    desc: 'Đánh giá về kết quả học tập, nghiên cứu khoa học và tinh thần học hỏi sáng tạo.',
  },
  [StandardGroupCode.Fitness]: {
    title: 'Thể lực tốt',
    desc: 'Đánh giá về rèn luyện thể chất, thể dục thể thao và chứng nhận thể lực.',
  },
  [StandardGroupCode.Volunteer]: {
    title: 'Tình nguyện tốt',
    desc: 'Đánh giá về việc tham gia các hoạt động tình nguyện vì cộng đồng, an sinh xã hội.',
  },
  [StandardGroupCode.Integration]: {
    title: 'Hội nhập tốt',
    desc: 'Đánh giá về trình độ ngoại ngữ, kỹ năng mềm và các hoạt động giao lưu quốc tế.',
  },
};

export function StandardGroupModal({
  isOpen,
  standardGroup,
  existingGroups = [],
  isLoading = false,
  onClose,
  onSubmit,
}: StandardGroupModalProps) {
  const isEdit = Boolean(standardGroup);

  const [groupCode, setGroupCode] = useState<StandardGroupCode>(StandardGroupCode.Ethics);
  const [title, setTitle] = useState('Đạo đức tốt');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState(1);

  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;

    if (standardGroup) {
      setGroupCode(standardGroup.groupCode ?? StandardGroupCode.Ethics);
      setTitle(standardGroup.title);
      setDescription(standardGroup.description ?? '');
      setDisplayOrder(standardGroup.displayOrder);
    } else {
      const usedCodes = new Set(existingGroups.map((g) => g.groupCode).filter(Boolean));
      const availableGroup =
        (Object.values(StandardGroupCode) as StandardGroupCode[]).find((c) => !usedCodes.has(c)) ??
        StandardGroupCode.Ethics;

      const info = DEFAULT_GROUP_INFO[availableGroup];
      setGroupCode(availableGroup);
      setTitle(info.title);
      setDescription(info.desc);
      setDisplayOrder(existingGroups.length + 1);
    }

    setFormError(null);
    setFieldErrors({});
  }, [isOpen, standardGroup, existingGroups]);

  const handleGroupCodeChange = (newGroup: StandardGroupCode) => {
    setGroupCode(newGroup);
    if (!isEdit) {
      const info = DEFAULT_GROUP_INFO[newGroup];
      setTitle(info.title);
      setDescription(info.desc);
    }
  };

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = 'Tên tiêu chuẩn không được để trống.';
    } else if (title.length > 500) {
      errors.title = 'Tên tiêu chuẩn không được vượt quá 500 ký tự.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validate()) {
      setFormError('Vui lòng kiểm tra lại thông tin.');
      return;
    }

    const payload: CreateStandardRequest = {
      groupCode,
      code: undefined, // Backend auto-generates unique code
      title: title.trim(),
      description: description.trim() || null,
      displayOrder: Number(displayOrder) || 1,
      operator: CriterionOperator.All,
      minimumSatisfied: null,
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
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <FolderTree size={18} className="text-blue-600" />
            <span>{isEdit ? 'Chỉnh sửa tiêu chuẩn lớn' : 'Thêm tiêu chuẩn lớn mới'}</span>
          </h3>
          <p className="text-xs text-slate-500">
            Thiết lập 1 trong 5 tiêu chuẩn chính của phong trào Sinh viên 5 tốt.
          </p>
        </div>

        {formError && (
          <div className="p-3 text-xs bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1.5">
              Chọn nhóm Tiêu chuẩn SV5T <span className="text-rose-500">*</span>
            </label>
            <select
              value={groupCode}
              onChange={(e) => handleGroupCodeChange(e.target.value as StandardGroupCode)}
              className="w-full h-9 px-3 text-xs font-medium border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:border-blue-500 outline-none cursor-pointer"
            >
              <option value={StandardGroupCode.Ethics}>{STANDARD_GROUP_CODE_LABELS[StandardGroupCode.Ethics]}</option>
              <option value={StandardGroupCode.Study}>{STANDARD_GROUP_CODE_LABELS[StandardGroupCode.Study]}</option>
              <option value={StandardGroupCode.Fitness}>{STANDARD_GROUP_CODE_LABELS[StandardGroupCode.Fitness]}</option>
              <option value={StandardGroupCode.Volunteer}>{STANDARD_GROUP_CODE_LABELS[StandardGroupCode.Volunteer]}</option>
              <option value={StandardGroupCode.Integration}>{STANDARD_GROUP_CODE_LABELS[StandardGroupCode.Integration]}</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">
              Tên Tiêu chuẩn lớn <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Đạo đức tốt, Học tập tốt..."
              className={`w-full h-9 px-3 text-xs font-medium border rounded-lg bg-slate-50 text-slate-800 focus:outline-none ${
                fieldErrors.title
                  ? 'border-rose-400'
                  : 'border-slate-200 focus:border-blue-500'
              }`}
            />
            {fieldErrors.title && (
              <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.title}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1">
              Mô tả định hướng
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Mô tả tóm tắt ý nghĩa và yêu cầu chung của tiêu chuẩn này..."
              className="w-full p-2.5 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:border-blue-500 outline-none resize-none font-normal"
            />
          </div>

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
              <span>{isEdit ? 'Lưu tiêu chuẩn' : 'Tạo tiêu chuẩn lớn'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
