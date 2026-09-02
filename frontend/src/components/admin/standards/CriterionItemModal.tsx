import { useEffect, useReducer } from 'react';
import {
  CriterionEvaluationType,
  CriterionOperator,
  CriterionType,
  type CreateCriterionRequest,
  type CriterionResponse,
  type StandardResponse,
  type UpdateCriterionRequest,
} from '../../../types/admin/standard';
import { sanitizeApiError } from '../../../services/apiErrorSanitizer';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Plus,
  Sliders,
  Sparkles,
  X,
} from 'lucide-react';

export type CriterionRequirementKind = 'mandatory' | 'optional';

export interface CriterionItemModalProps {
  isOpen: boolean;
  standardSetId?: string;
  criterion?: CriterionResponse | null;
  parentGroup?: StandardResponse | null;
  requirementKind?: CriterionRequirementKind;
  existingGroups?: StandardResponse[];
  allCriteria?: CriterionResponse[];
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: (
    data: CreateCriterionRequest | UpdateCriterionRequest,
    isOptionalSubGroupNeeded?: boolean,
    parentStandardId?: string,
  ) => Promise<void> | void;
}

interface CriterionItemFormState {
  selectedParentGroupId: string;
  kind: CriterionRequirementKind;
  title: string;
  description: string;
  displayOrder: number;
  evaluationType: CriterionEvaluationType;
  reviewGuidance: string;
  requireAttachment: boolean;
  booleanLabel: string;
  numericFieldType: 'drl' | 'gpa' | 'count' | 'other';
  numericMinThreshold: number | '';
  numericOperator: string;
  accumulatedMetricName: string;
  accumulatedMinTotal: number | '';
  accumulatedUnit: string;
  formError: string | null;
  fieldErrors: Record<string, string>;
}

type CriterionItemFormAction =
  | {
      type: 'RESET';
      criterion?: CriterionResponse | null;
      parentGroup?: StandardResponse | null;
      requirementKind?: CriterionRequirementKind;
      existingGroups?: StandardResponse[];
      allCriteria?: CriterionResponse[];
    }
  | { type: 'SET_FIELD'; field: keyof CriterionItemFormState; value: unknown }
  | { type: 'SET_ERRORS'; fieldErrors: Record<string, string>; formError?: string | null }
  | { type: 'SET_FORM_ERROR'; formError: string | null };

function getInitialCriterionItemState(
  criterion?: CriterionResponse | null,
  parentGroup?: StandardResponse | null,
  requirementKind: CriterionRequirementKind = 'mandatory',
  existingGroups: StandardResponse[] = [],
  allCriteria: CriterionResponse[] = [],
): CriterionItemFormState {
  if (criterion) {
    let selectedParentGroupId = '';
    let kind: CriterionRequirementKind = 'mandatory';
    const parent = allCriteria.find((c) => c.id === criterion.parentCriterionId);
    if (parent && parent.parentCriterionId) {
      selectedParentGroupId = parent.parentCriterionId;
      kind = 'optional';
    } else {
      selectedParentGroupId = criterion.parentCriterionId ?? '';
      kind = 'mandatory';
    }

    let requireAttachment = true;
    let booleanLabel = 'Đạt giấy chứng nhận / xác nhận tham gia';
    let numericFieldType: 'drl' | 'gpa' | 'count' | 'other' = 'drl';
    let numericMinThreshold: number | '' = 80;
    let numericOperator = '>=';
    let accumulatedMetricName = 'Giờ hoạt động tình nguyện';
    let accumulatedMinTotal: number | '' = 30;
    let accumulatedUnit = 'giờ';

    try {
      const parsed = JSON.parse(criterion.definitionJson || '{}');
      if (criterion.evaluationType === CriterionEvaluationType.Manual) {
        requireAttachment = parsed.requireAttachment ?? true;
      } else if (criterion.evaluationType === CriterionEvaluationType.Boolean) {
        booleanLabel = parsed.label || 'Đạt giấy chứng nhận / xác nhận tham gia';
      } else if (criterion.evaluationType === CriterionEvaluationType.NumericThreshold) {
        numericMinThreshold = parsed.minThreshold ?? 80;
        numericOperator = parsed.operator || '>=';
        numericFieldType = parsed.field === 'gpa' ? 'gpa' : parsed.field === 'count' ? 'count' : 'drl';
      } else if (criterion.evaluationType === CriterionEvaluationType.AccumulatedNumeric) {
        accumulatedMinTotal = parsed.minTotal ?? 30;
        accumulatedUnit = parsed.unit || 'giờ';
        accumulatedMetricName = parsed.metric || 'Giờ hoạt động tình nguyện';
      }
    } catch {
      // Fallback
    }

    return {
      selectedParentGroupId,
      kind,
      title: criterion.title,
      description: criterion.description ?? '',
      displayOrder: criterion.displayOrder,
      evaluationType: criterion.evaluationType ?? CriterionEvaluationType.Manual,
      reviewGuidance: criterion.reviewGuidance ?? '',
      requireAttachment,
      booleanLabel,
      numericFieldType,
      numericMinThreshold,
      numericOperator,
      accumulatedMetricName,
      accumulatedMinTotal,
      accumulatedUnit,
      formError: null,
      fieldErrors: {},
    };
  }

  const initParentId = parentGroup?.id ?? existingGroups[0]?.id ?? '';
  return {
    selectedParentGroupId: initParentId,
    kind: requirementKind,
    title: '',
    description: '',
    displayOrder: allCriteria.length + 1,
    evaluationType: CriterionEvaluationType.Manual,
    reviewGuidance: '',
    requireAttachment: true,
    booleanLabel: 'Đạt giấy chứng nhận / xác nhận tham gia',
    numericFieldType: 'drl',
    numericMinThreshold: 80,
    numericOperator: '>=',
    accumulatedMetricName: 'Giờ hoạt động tình nguyện',
    accumulatedMinTotal: 30,
    accumulatedUnit: 'giờ',
    formError: null,
    fieldErrors: {},
  };
}

function criterionItemFormReducer(
  state: CriterionItemFormState,
  action: CriterionItemFormAction,
): CriterionItemFormState {
  switch (action.type) {
    case 'RESET':
      return getInitialCriterionItemState(
        action.criterion,
        action.parentGroup,
        action.requirementKind,
        action.existingGroups,
        action.allCriteria,
      );
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_ERRORS':
      return {
        ...state,
        fieldErrors: action.fieldErrors,
        ...(action.formError !== undefined ? { formError: action.formError } : {}),
      };
    case 'SET_FORM_ERROR':
      return { ...state, formError: action.formError };
    default:
      return state;
  }
}

export function CriterionItemModal({
  isOpen,
  criterion,
  parentGroup,
  requirementKind = 'mandatory',
  existingGroups = [],
  allCriteria = [],
  isLoading = false,
  onClose,
  onSubmit,
}: CriterionItemModalProps) {
  const isEdit = Boolean(criterion);

  const [state, dispatch] = useReducer(
    criterionItemFormReducer,
    { criterion, parentGroup, requirementKind, existingGroups, allCriteria },
    (init) =>
      getInitialCriterionItemState(
        init.criterion,
        init.parentGroup,
        init.requirementKind,
        init.existingGroups,
        init.allCriteria,
      ),
  );

  const {
    selectedParentGroupId,
    kind,
    title,
    description,
    displayOrder,
    evaluationType,
    reviewGuidance,
    requireAttachment,
    booleanLabel,
    numericFieldType,
    numericMinThreshold,
    numericOperator,
    accumulatedMetricName,
    accumulatedMinTotal,
    accumulatedUnit,
    formError,
    fieldErrors,
  } = state;

  const setField = <K extends keyof CriterionItemFormState>(
    field: K,
    value: CriterionItemFormState[K],
  ) => {
    dispatch({ type: 'SET_FIELD', field, value });
  };

  useEffect(() => {
    if (!isOpen) return;
    dispatch({
      type: 'RESET',
      criterion,
      parentGroup,
      requirementKind,
      existingGroups,
      allCriteria,
    });
  }, [isOpen, criterion, parentGroup, requirementKind, existingGroups, allCriteria]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!selectedParentGroupId) {
      errors.selectedParentGroupId = 'Vui lòng chọn Tiêu chuẩn lớn trực thuộc.';
    }

    if (!title.trim()) {
      errors.title = 'Tên tiêu chí không được để trống.';
    } else if (title.length > 500) {
      errors.title = 'Tên tiêu chí không được vượt quá 500 ký tự.';
    }

    if (evaluationType === CriterionEvaluationType.NumericThreshold) {
      if (numericMinThreshold === '' || isNaN(Number(numericMinThreshold))) {
        errors.numericMinThreshold = 'Vui lòng nhập ngưỡng giá trị số hợp lệ.';
      }
    } else if (evaluationType === CriterionEvaluationType.AccumulatedNumeric) {
      if (accumulatedMinTotal === '' || isNaN(Number(accumulatedMinTotal)) || Number(accumulatedMinTotal) <= 0) {
        errors.accumulatedMinTotal = 'Vui lòng nhập tổng số lượng tích lũy hợp lệ lớn hơn 0.';
      }
    }

    dispatch({ type: 'SET_ERRORS', fieldErrors: errors });
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    let definitionJson = '{}';
    if (evaluationType === CriterionEvaluationType.Manual) {
      definitionJson = JSON.stringify({ requireAttachment });
    } else if (evaluationType === CriterionEvaluationType.Boolean) {
      definitionJson = JSON.stringify({ label: booleanLabel });
    } else if (evaluationType === CriterionEvaluationType.NumericThreshold) {
      definitionJson = JSON.stringify({
        field: numericFieldType,
        operator: numericOperator as CriterionOperator,
        minThreshold: Number(numericMinThreshold),
      });
    } else if (evaluationType === CriterionEvaluationType.AccumulatedNumeric) {
      definitionJson = JSON.stringify({
        metric: accumulatedMetricName,
        minTotal: Number(accumulatedMinTotal),
        unit: accumulatedUnit,
      });
    }

    try {
      if (isEdit && criterion) {
        const updateReq: UpdateCriterionRequest = {
          title: title.trim(),
          description: description.trim() || undefined,
          displayOrder,
          evaluationType,
          definitionJson,
          reviewGuidance: reviewGuidance.trim() || undefined,
        };
        await onSubmit(updateReq, false, selectedParentGroupId);
      } else {
        const isOptional = kind === 'optional';
        const createReq: CreateCriterionRequest = {
          title: title.trim(),
          description: description.trim() || undefined,
          type: CriterionType.Requirement,
          displayOrder,
          evaluationType,
          definitionJson,
          reviewGuidance: reviewGuidance.trim() || undefined,
          parentCriterionId: undefined, // Handled in parent onSubmit
        };
        await onSubmit(createReq, isOptional, selectedParentGroupId);
      }
      onClose();
    } catch (err: unknown) {
      dispatch({
        type: 'SET_FORM_ERROR',
        formError: sanitizeApiError(err, 'Lưu tiêu chí thất bại. Vui lòng thử lại.'),
      });
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl sm:max-w-4xl bg-white rounded-xl border border-slate-200 shadow-2xl p-5 sm:p-6 space-y-4 relative max-h-[90vh] overflow-y-auto custom-scrollbar overscroll-contain cursor-default"
      >
        {/* Header aligned perfectly with close button */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <Plus size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                {isEdit ? 'Chỉnh sửa tiêu chí' : 'Thêm tiêu chí mới'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cấu hình tiêu chí xét duyệt và hướng dẫn minh chứng cho sinh viên.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer shrink-0 -mr-1 -mt-1"
            title="Đóng modal"
          >
            <X size={18} />
          </button>
        </div>

        {formError && (
          <div className="p-3 text-xs bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tiêu chuẩn cha */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Thuộc Tiêu chuẩn lớn <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <select
                value={selectedParentGroupId}
                onChange={(e) => setField('selectedParentGroupId', e.target.value)}
                className="w-full h-10 pl-3.5 pr-9 text-xs font-semibold border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer appearance-none"
              >
                {existingGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
              <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
            {fieldErrors.selectedParentGroupId && (
              <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.selectedParentGroupId}</p>
            )}
          </div>

          {/* Chọn loại yêu cầu: BẮT BUỘC vs TỰ CHỌN */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              Quy cách yêu cầu của Tiêu chí <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                onClick={() => setField('kind', 'mandatory')}
                className={`flex items-start gap-3 p-3.5 rounded-lg border-2 transition-all cursor-pointer ${
                  kind === 'mandatory'
                    ? 'border-emerald-500 bg-emerald-50/60 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <input
                  type="radio"
                  name="requirementKind"
                  checked={kind === 'mandatory'}
                  onChange={() => setField('kind', 'mandatory')}
                  className="mt-0.5 text-emerald-600"
                />
                <div>
                  <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-600" />
                    <span>Tiêu chí BẮT BUỘC</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Sinh viên <strong>bắt buộc phải đạt</strong> tiêu chí này.
                  </p>
                </div>
              </label>

              <label
                onClick={() => setField('kind', 'optional')}
                className={`flex items-start gap-3 p-3.5 rounded-lg border-2 transition-all cursor-pointer ${
                  kind === 'optional'
                    ? 'border-amber-500 bg-amber-50/60 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                }`}
              >
                <input
                  type="radio"
                  name="requirementKind"
                  checked={kind === 'optional'}
                  onChange={() => setField('kind', 'optional')}
                  className="mt-0.5 text-amber-600"
                />
                <div>
                  <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-600" />
                    <span>Tiêu chí TỰ CHỌN</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Thuộc danh sách tự chọn (chỉ cần đạt <strong>ít nhất 1 mục</strong>).
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Tên nội dung Tiêu chí */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Tên nội dung Tiêu chí <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder="VD: Điểm học tập GPA đạt từ 3.2 trở lên, Đạt giải NCKH..."
              className={`w-full h-10 px-3.5 text-xs font-medium border rounded-lg bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 ${
                fieldErrors.title
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
              }`}
            />
            {fieldErrors.title && (
              <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.title}</p>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Diễn giải chi tiết (không bắt buộc)
            </label>
            <textarea
              value={description}
              onChange={(e) => setField('description', e.target.value)}
              rows={2}
              placeholder="Ghi chú quy định, căn cứ đối chiếu chi tiết..."
              className="w-full p-3 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:border-blue-500 outline-none resize-none"
            />
          </div>

          {/* Phương thức đánh giá & Minh chứng */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
              <Sliders size={14} />
              Cách thức đánh giá & Yêu cầu minh chứng
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Hình thức kiểm tra <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={evaluationType}
                    onChange={(e) => setField('evaluationType', e.target.value as CriterionEvaluationType)}
                    className="w-full h-10 pl-3.5 pr-9 text-xs border border-slate-200 rounded-lg bg-white text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer appearance-none"
                  >
                    <option value={CriterionEvaluationType.Manual}>Cán bộ xem & duyệt file minh chứng</option>
                    <option value={CriterionEvaluationType.Boolean}>Xác nhận hoàn thành (Đạt / Không đạt)</option>
                    <option value={CriterionEvaluationType.NumericThreshold}>Kiểm tra theo ngưỡng điểm số</option>
                    <option value={CriterionEvaluationType.AccumulatedNumeric}>Tích lũy tổng số giờ / số lần</option>
                  </select>
                  <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Ghi chú hướng dẫn cho sinh viên
                </label>
                <input
                  type="text"
                  value={reviewGuidance}
                  onChange={(e) => setField('reviewGuidance', e.target.value)}
                  placeholder="VD: Nộp ảnh chụp bảng điểm có dấu mộc đỏ..."
                  className="w-full h-10 px-3.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-900 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            {/* Chi tiết cho từng hình thức */}
            {evaluationType === CriterionEvaluationType.Manual && (
              <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1">
                <label className="flex items-center gap-2 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={requireAttachment}
                    onChange={(e) => setField('requireAttachment', e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Bắt buộc sinh viên phải đính kèm ảnh hoặc tệp PDF minh chứng</span>
                </label>
                <p className="text-[11px] text-slate-400 ml-5">
                  Hệ thống hỗ trợ xem trực tiếp ảnh (PNG, JPG) và file PDF trên màn hình duyệt.
                </p>
              </div>
            )}

            {evaluationType === CriterionEvaluationType.Boolean && (
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Tiêu đề chứng nhận cần hoàn thành
                </label>
                <input
                  type="text"
                  value={booleanLabel}
                  onChange={(e) => setField('booleanLabel', e.target.value)}
                  placeholder="VD: Đạt giấy chứng nhận tham gia chiến dịch tình nguyện Mùa hè xanh"
                  className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-900 outline-none"
                />
              </div>
            )}

            {evaluationType === CriterionEvaluationType.NumericThreshold && (
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">
                  Cấu hình ngưỡng điểm đạt
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Chỉ số so sánh</label>
                    <div className="relative">
                      <select
                        value={numericFieldType}
                        onChange={(e) => setField('numericFieldType', e.target.value as any)}
                        className="w-full h-9 pl-2.5 pr-7 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-900 outline-none appearance-none cursor-pointer"
                      >
                        <option value="drl">Điểm rèn luyện</option>
                        <option value="gpa">Điểm học tập (GPA)</option>
                        <option value="count">Số lượng đề tài / bài viết</option>
                        <option value="other">Chỉ số khác</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Điều kiện</label>
                    <div className="relative">
                      <select
                        value={numericOperator}
                        onChange={(e) => setField('numericOperator', e.target.value)}
                        className="w-full h-9 pl-2.5 pr-7 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-900 outline-none appearance-none cursor-pointer"
                      >
                        <option value=">=">&gt;= (Lớn hơn hoặc bằng)</option>
                        <option value=">">&gt; (Lớn hơn)</option>
                        <option value="==">== (Bằng chính xác)</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Ngưỡng tối thiểu</label>
                    <input
                      type="number"
                      step="any"
                      value={numericMinThreshold}
                      onChange={(e) => setField('numericMinThreshold', e.target.value ? Number(e.target.value) : '')}
                      placeholder="VD: 80 hoặc 3.2"
                      className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-900 outline-none"
                    />
                    {fieldErrors.numericMinThreshold && (
                      <p className="text-[10.5px] text-rose-600 mt-0.5">{fieldErrors.numericMinThreshold}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {evaluationType === CriterionEvaluationType.AccumulatedNumeric && (
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">
                  Cấu hình chỉ số tích lũy
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Tên hoạt động tích lũy</label>
                    <input
                      type="text"
                      value={accumulatedMetricName}
                      onChange={(e) => setField('accumulatedMetricName', e.target.value)}
                      placeholder="VD: Giờ hoạt động tình nguyện"
                      className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Tổng tích lũy tối thiểu</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={accumulatedMinTotal}
                        onChange={(e) => setField('accumulatedMinTotal', e.target.value ? Number(e.target.value) : '')}
                        placeholder="VD: 30"
                        className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-900 outline-none"
                      />
                      <input
                        type="text"
                        value={accumulatedUnit}
                        onChange={(e) => setField('accumulatedUnit', e.target.value)}
                        placeholder="giờ"
                        className="w-20 h-9 px-2.5 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-900 outline-none text-center"
                      />
                    </div>
                    {fieldErrors.accumulatedMinTotal && (
                      <p className="text-[10.5px] text-rose-600 mt-0.5">{fieldErrors.accumulatedMinTotal}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
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
              <span>{isEdit ? 'Lưu tiêu chí' : 'Thêm tiêu chí'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
