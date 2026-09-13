import { useEffect, useReducer } from 'react';
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

const EMPTY_GROUPS: StandardResponse[] = [];

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

interface StandardGroupState {
  groupCode: StandardGroupCode;
  title: string;
  description: string;
  formError: string | null;
  fieldErrors: Record<string, string>;
}

type StandardGroupAction =
  | { type: 'RESET'; standardGroup?: StandardResponse | null; existingGroups: StandardResponse[] }
  | { type: 'SET_FIELD'; field: keyof StandardGroupState; value: unknown }
  | { type: 'CHANGE_GROUP_CODE'; groupCode: StandardGroupCode; isEdit: boolean }
  | { type: 'SET_ERRORS'; fieldErrors: Record<string, string>; formError?: string | null }
  | { type: 'SET_FORM_ERROR'; formError: string | null };

function getInitialGroupState(
  standardGroup?: StandardResponse | null,
  existingGroups: StandardResponse[] = EMPTY_GROUPS,
): StandardGroupState {
  if (standardGroup) {
    return {
      groupCode: standardGroup.groupCode ?? StandardGroupCode.Ethics,
      title: standardGroup.title,
      description: standardGroup.description ?? '',
      formError: null,
      fieldErrors: {},
    };
  }
  const usedCodes = new Set(
    existingGroups.flatMap((g) => (g.groupCode ? [g.groupCode] : [])),
  );
  const availableGroup =
    (Object.values(StandardGroupCode) as StandardGroupCode[]).find((c) => !usedCodes.has(c)) ??
    StandardGroupCode.Ethics;

  const info = DEFAULT_GROUP_INFO[availableGroup];
  return {
    groupCode: availableGroup,
    title: info.title,
    description: info.desc,
    formError: null,
    fieldErrors: {},
  };
}

function standardGroupReducer(
  state: StandardGroupState,
  action: StandardGroupAction,
): StandardGroupState {
  switch (action.type) {
    case 'RESET':
      return getInitialGroupState(action.standardGroup, action.existingGroups);
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'CHANGE_GROUP_CODE': {
      if (action.isEdit) {
        return { ...state, groupCode: action.groupCode };
      }
      const info = DEFAULT_GROUP_INFO[action.groupCode];
      return {
        ...state,
        groupCode: action.groupCode,
        title: info.title,
        description: info.desc,
      };
    }
    case 'SET_ERRORS':
      return {
        ...state,
        fieldErrors: action.fieldErrors,
        formError: action.formError ?? state.formError,
      };
    case 'SET_FORM_ERROR':
      return { ...state, formError: action.formError };
    default:
      return state;
  }
}

export function StandardGroupModal({
  isOpen,
  standardGroup,
  existingGroups = EMPTY_GROUPS,
  isLoading = false,
  onClose,
  onSubmit,
}: StandardGroupModalProps) {
  const isEdit = Boolean(standardGroup);

  const [state, dispatch] = useReducer(
    standardGroupReducer,
    { standardGroup, existingGroups },
    (init) => getInitialGroupState(init.standardGroup, init.existingGroups),
  );

  const { groupCode, title, description, formError, fieldErrors } = state;

  useEffect(() => {
    if (!isOpen) return;
    dispatch({ type: 'RESET', standardGroup, existingGroups });
  }, [isOpen, standardGroup, existingGroups]);

  const handleGroupCodeChange = (newGroup: StandardGroupCode) => {
    dispatch({ type: 'CHANGE_GROUP_CODE', groupCode: newGroup, isEdit });
  };

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = 'Tên tiêu chuẩn không được để trống.';
    } else if (title.length > 500) {
      errors.title = 'Tên tiêu chuẩn không được vượt quá 500 ký tự.';
    }

    dispatch({ type: 'SET_ERRORS', fieldErrors: errors });
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'SET_FORM_ERROR', formError: null });

    if (!validate()) {
      dispatch({ type: 'SET_FORM_ERROR', formError: 'Vui lòng kiểm tra lại thông tin.' });
      return;
    }

    const payload: CreateStandardRequest = {
      groupCode,
      code: undefined, // Backend auto-generates unique code
      title: title.trim(),
      description: description.trim() || null,
      displayOrder: standardGroup?.displayOrder ?? existingGroups.length + 1,
      operator: CriterionOperator.All,
      minimumSatisfied: null,
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
      aria-labelledby="standard-group-modal-title"
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
          <h3 id="standard-group-modal-title" className="text-base font-semibold text-slate-800 flex items-center gap-2">
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
            <label htmlFor="standard-group-code-select" className="text-xs font-medium text-slate-700 block mb-1.5">
              Chọn nhóm Tiêu chuẩn SV5T <span className="text-rose-500">*</span>
            </label>
            <select
              id="standard-group-code-select"
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
            <label htmlFor="standard-group-title-input" className="text-xs font-medium text-slate-700 block mb-1">
              Tên Tiêu chuẩn lớn <span className="text-rose-500">*</span>
            </label>
            <input
              id="standard-group-title-input"
              type="text"
              value={title}
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'title', value: e.target.value })}
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
            <label htmlFor="standard-group-desc-input" className="text-xs font-medium text-slate-700 block mb-1">
              Mô tả định hướng
            </label>
            <textarea
              id="standard-group-desc-input"
              value={description}
              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'description', value: e.target.value })}
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
