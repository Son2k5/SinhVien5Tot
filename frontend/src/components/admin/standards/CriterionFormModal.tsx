import { useEffect, useMemo, useReducer } from 'react';
import {
  CriterionEvaluationType,
  CriterionOperator,
  CriterionType,
  type CreateCriterionRequest,
  type CriterionResponse,
  type UpdateCriterionRequest,
} from '../../../types/admin/standard';
import { sanitizeApiError } from '../../../services/apiErrorSanitizer';
import {
  AlertCircle,
  BookOpen,
  FolderTree,
  Layers,
  Loader2,
  Sliders,
  X,
} from 'lucide-react';

export interface CriterionFormModalProps {
  isOpen: boolean;
  standardSetId?: string;
  criterion?: CriterionResponse | null;
  parentCriterion?: CriterionResponse | null;
  existingCriteria?: CriterionResponse[];
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: (
    data: CreateCriterionRequest | UpdateCriterionRequest,
  ) => Promise<void> | void;
}

interface CriterionFormState {
  type: CriterionType;
  parentCriterionId: string;
  code: string;
  title: string;
  description: string;
  displayOrder: number;
  operator: CriterionOperator;
  minimumSatisfied: number | '';
  evaluationType: CriterionEvaluationType;
  reviewGuidance: string;
  requireAttachment: boolean;
  booleanLabel: string;
  numericFieldType: 'gpa' | 'drl' | 'count' | 'other';
  numericMinThreshold: number | '';
  numericUnit: string;
  numericOperator: string;
  accumulatedMetricName: string;
  accumulatedMinTotal: number | '';
  accumulatedUnit: string;
  formError: string | null;
  fieldErrors: Record<string, string>;
}

type CriterionFormAction =
  | {
      type: 'RESET';
      criterion?: CriterionResponse | null;
      parentCriterion?: CriterionResponse | null;
      existingCriteriaCount?: number;
    }
  | { type: 'SET_FIELD'; field: keyof CriterionFormState; value: unknown }
  | { type: 'SET_ERRORS'; fieldErrors: Record<string, string>; formError?: string | null }
  | { type: 'SET_FORM_ERROR'; formError: string | null };

function getInitialCriterionState(
  criterion?: CriterionResponse | null,
  parentCriterion?: CriterionResponse | null,
  existingCriteriaCount = 0,
): CriterionFormState {
  if (criterion) {
    let requireAttachment = true;
    let booleanLabel = 'Đạt chứng nhận hoàn thành chương trình / hoạt động';
    let numericFieldType: 'gpa' | 'drl' | 'count' | 'other' = 'drl';
    let numericMinThreshold: number | '' = 80;
    let numericUnit = 'điểm';
    let numericOperator = '>=';
    let accumulatedMetricName = 'Giờ hoạt động tình nguyện';
    let accumulatedMinTotal: number | '' = 30;
    let accumulatedUnit = 'giờ';

    try {
      const parsed = JSON.parse(criterion.definitionJson || '{}');
      if (criterion.evaluationType === CriterionEvaluationType.Manual) {
        requireAttachment = parsed.requireAttachment ?? true;
      } else if (criterion.evaluationType === CriterionEvaluationType.Boolean) {
        booleanLabel = parsed.label || 'Đạt chứng nhận hoàn thành chương trình / hoạt động';
      } else if (criterion.evaluationType === CriterionEvaluationType.NumericThreshold) {
        numericMinThreshold = parsed.minThreshold ?? 80;
        numericUnit = parsed.unit || 'điểm';
        numericOperator = parsed.operator || '>=';
        if (parsed.field === 'gpa') numericFieldType = 'gpa';
        else if (parsed.field === 'drl') numericFieldType = 'drl';
        else if (parsed.field === 'count') numericFieldType = 'count';
        else numericFieldType = 'other';
      } else if (criterion.evaluationType === CriterionEvaluationType.AccumulatedNumeric) {
        accumulatedMinTotal = parsed.minTotal ?? 30;
        accumulatedUnit = parsed.unit || 'giờ';
        accumulatedMetricName = parsed.label || 'Giờ hoạt động tình nguyện';
      }
    } catch {
      // Fallback to default
    }

    return {
      type: criterion.type,
      parentCriterionId: criterion.parentCriterionId ?? '',
      code: criterion.code,
      title: criterion.title,
      description: criterion.description ?? '',
      displayOrder: criterion.displayOrder,
      operator: criterion.operator ?? CriterionOperator.All,
      minimumSatisfied: criterion.minimumSatisfied ?? '',
      evaluationType: criterion.evaluationType ?? CriterionEvaluationType.Manual,
      reviewGuidance: criterion.reviewGuidance ?? '',
      requireAttachment,
      booleanLabel,
      numericFieldType,
      numericMinThreshold,
      numericUnit,
      numericOperator,
      accumulatedMetricName,
      accumulatedMinTotal,
      accumulatedUnit,
      formError: null,
      fieldErrors: {},
    };
  }

  return {
    type: parentCriterion ? CriterionType.Requirement : CriterionType.Group,
    parentCriterionId: parentCriterion?.id ?? '',
    code: '',
    title: '',
    description: '',
    displayOrder: existingCriteriaCount + 1,
    operator: CriterionOperator.All,
    minimumSatisfied: '',
    evaluationType: CriterionEvaluationType.Manual,
    reviewGuidance: '',
    requireAttachment: true,
    booleanLabel: 'Đạt chứng nhận hoàn thành chương trình / hoạt động',
    numericFieldType: 'drl',
    numericMinThreshold: 80,
    numericUnit: 'điểm',
    numericOperator: '>=',
    accumulatedMetricName: 'Giờ hoạt động tình nguyện',
    accumulatedMinTotal: 30,
    accumulatedUnit: 'giờ',
    formError: null,
    fieldErrors: {},
  };
}

function criterionFormReducer(
  state: CriterionFormState,
  action: CriterionFormAction,
): CriterionFormState {
  switch (action.type) {
    case 'RESET':
      return getInitialCriterionState(
        action.criterion,
        action.parentCriterion,
        action.existingCriteriaCount ?? 0,
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

export function CriterionFormModal({
  isOpen,
  criterion,
  parentCriterion,
  existingCriteria = [],
  isLoading = false,
  onClose,
  onSubmit,
}: CriterionFormModalProps) {
  const isEdit = Boolean(criterion);

  const [state, dispatch] = useReducer(
    criterionFormReducer,
    { criterion, parentCriterion, existingCriteriaCount: existingCriteria.length },
    (init) =>
      getInitialCriterionState(
        init.criterion,
        init.parentCriterion,
        init.existingCriteriaCount,
      ),
  );

  const {
    type,
    parentCriterionId,
    code,
    title,
    description,
    displayOrder,
    operator,
    minimumSatisfied,
    evaluationType,
    reviewGuidance,
    requireAttachment,
    booleanLabel,
    numericFieldType,
    numericMinThreshold,
    numericUnit,
    numericOperator,
    accumulatedMetricName,
    accumulatedMinTotal,
    accumulatedUnit,
    formError,
    fieldErrors,
  } = state;

  const setField = <K extends keyof CriterionFormState>(
    field: K,
    value: CriterionFormState[K],
  ) => {
    dispatch({ type: 'SET_FIELD', field, value });
  };

  useEffect(() => {
    if (!isOpen) return;
    dispatch({
      type: 'RESET',
      criterion,
      parentCriterion,
      existingCriteriaCount: existingCriteria.length,
    });
  }, [isOpen, criterion, parentCriterion, existingCriteria.length]);

  const groupCandidates = useMemo(() => {
    return existingCriteria.filter(
      (c) => c.type === CriterionType.Group && c.id !== criterion?.id,
    );
  }, [existingCriteria, criterion?.id]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!code.trim()) {
      errors.code = 'Mã tiêu chí không được để trống.';
    } else if (code.length > 50) {
      errors.code = 'Mã tiêu chí không được quá 50 ký tự.';
    }

    if (!title.trim()) {
      errors.title = 'Tên tiêu chí không được để trống.';
    } else if (title.length > 500) {
      errors.title = 'Tên tiêu chí không được quá 500 ký tự.';
    }

    if (type === CriterionType.Group) {
      if (operator === CriterionOperator.AtLeast) {
        if (typeof minimumSatisfied !== 'number' || minimumSatisfied <= 0) {
          errors.minimumSatisfied = 'Vui lòng nhập số lượng đạt tối thiểu hợp lệ (> 0).';
        }
      }
    } else {
      if (evaluationType === CriterionEvaluationType.NumericThreshold) {
        if (numericMinThreshold === '' || isNaN(Number(numericMinThreshold))) {
          errors.numericMinThreshold = 'Vui lòng nhập ngưỡng giá trị số hợp lệ.';
        }
      } else if (evaluationType === CriterionEvaluationType.AccumulatedNumeric) {
        if (accumulatedMinTotal === '' || isNaN(Number(accumulatedMinTotal)) || Number(accumulatedMinTotal) <= 0) {
          errors.accumulatedMinTotal = 'Vui lòng nhập tổng số lượng tối thiểu hợp lệ (> 0).';
        }
      }
    }

    dispatch({ type: 'SET_ERRORS', fieldErrors: errors });
    return Object.keys(errors).length === 0;
  };

  const buildDefinitionJson = (): string => {
    if (type === CriterionType.Group) return '{}';

    switch (evaluationType) {
      case CriterionEvaluationType.Manual:
        return JSON.stringify({
          mode: 'manual',
          requireAttachment,
          allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
        });

      case CriterionEvaluationType.Boolean:
        return JSON.stringify({
          mode: 'boolean',
          label: booleanLabel.trim(),
          requireProof: true,
        });

      case CriterionEvaluationType.NumericThreshold:
        return JSON.stringify({
          field: numericFieldType,
          minThreshold: Number(numericMinThreshold) || 0,
          operator: numericOperator,
          unit: numericUnit.trim() || 'điểm',
        });

      case CriterionEvaluationType.AccumulatedNumeric:
        return JSON.stringify({
          metric: accumulatedMetricName.trim(),
          minTotal: Number(accumulatedMinTotal) || 0,
          unit: accumulatedUnit.trim() || 'lần',
        });

      default:
        return '{}';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'SET_FORM_ERROR', formError: null });

    if (!validate()) {
      dispatch({
        type: 'SET_FORM_ERROR',
        formError: 'Vui lòng kiểm tra lại các thông tin đã nhập.',
      });
      return;
    }

    const payload: CreateCriterionRequest = {
      parentCriterionId: parentCriterionId ? parentCriterionId : null,
      type,
      code: code.trim(),
      title: title.trim(),
      description: description.trim() || null,
      displayOrder: Number(displayOrder) || 0,

      // Group
      operator: type === CriterionType.Group ? operator : CriterionOperator.All,
      minimumSatisfied:
        type === CriterionType.Group && operator === CriterionOperator.AtLeast && typeof minimumSatisfied === 'number'
          ? minimumSatisfied
          : null,

      // Requirement
      evaluationType: type === CriterionType.Requirement ? evaluationType : CriterionEvaluationType.Manual,
      reviewGuidance:
        type === CriterionType.Requirement ? reviewGuidance.trim() || null : null,
      definitionJson: buildDefinitionJson(),
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
    >
      <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 space-y-5 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Title */}
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <span>{isEdit ? 'Chỉnh sửa tiêu chuẩn / tiêu chí' : 'Thêm tiêu chuẩn / tiêu chí mới'}</span>
          </h3>
          <p className="text-xs text-slate-500">
            Cấu hình nội dung, nhóm tiêu chuẩn và phương thức đánh giá minh chứng.
          </p>
        </div>

        {/* Form Error Banner */}
        {formError && (
          <div className="p-3 text-xs bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-start gap-2 animate-in fade-in">
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-500" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Phân loại Type */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              Phân loại cấp bậc <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label
                onClick={() => setField('type', CriterionType.Group)}
                className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                  type === CriterionType.Group
                    ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-100'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                }`}
              >
                <input
                  type="radio"
                  name="criterionType"
                  checked={type === CriterionType.Group}
                  onChange={() => setField('type', CriterionType.Group)}
                  className="text-blue-600"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <FolderTree size={14} className="text-blue-600" />
                    <span>Nhóm tiêu chuẩn lớn</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Dành cho 5 tiêu chuẩn chính hoặc các nhóm chứa tiêu chí con
                  </p>
                </div>
              </label>

              <label
                onClick={() => setField('type', CriterionType.Requirement)}
                className={`flex items-center gap-2.5 p-3 rounded-xl border transition-all cursor-pointer ${
                  type === CriterionType.Requirement
                    ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-100'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
                }`}
              >
                <input
                  type="radio"
                  name="criterionType"
                  checked={type === CriterionType.Requirement}
                  onChange={() => setField('type', CriterionType.Requirement)}
                  className="text-blue-600"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <BookOpen size={14} className="text-blue-600" />
                    <span>Tiêu chí con cụ thể</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tiêu chí chi tiết để sinh viên nộp hồ sơ minh chứng
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Trực thuộc nhóm cha
            </label>
            <select
              value={parentCriterionId}
              onChange={(e) => setField('parentCriterionId', e.target.value)}
              className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
            >
              <option value="">-- Cấp cao nhất (Gốc) --</option>
              {groupCandidates.map((g) => (
                <option key={g.id} value={g.id}>
                  [{g.code}] {g.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Mã tiêu chí <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setField('code', e.target.value)}
                placeholder="Ví dụ: TC_DAODUC, TC1.1, TC1.2..."
                className={`w-full h-10 px-3.5 text-xs font-mono border rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 ${
                  fieldErrors.code
                    ? 'border-rose-400 focus:ring-rose-200'
                    : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                }`}
              />
              {fieldErrors.code && (
                <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.code}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Thứ tự sắp xếp
              </label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setField('displayOrder', Number(e.target.value))}
                className="w-full h-10 px-3.5 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Tên tiêu chuẩn / tiêu chí <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder="Ví dụ: Đạo đức tốt, Điểm rèn luyện từ 80 điểm trở lên..."
              className={`w-full h-10 px-3.5 text-xs border rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 ${
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
              Mô tả chi tiết / Diễn giải yêu cầu
            </label>
            <textarea
              value={description}
              onChange={(e) => setField('description', e.target.value)}
              rows={2}
              placeholder="Ghi chú thêm về căn cứ xét duyệt, điều kiện chi tiết..."
              className="w-full p-3 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
            />
          </div>

          {/* Dành cho loại Group: Cấu hình điều kiện đạt */}
          {type === CriterionType.Group && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <span className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                <Layers size={14} />
                Quy tắc xét đạt của nhóm
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Điều kiện công nhận
                  </label>
                  <select
                    value={operator}
                    onChange={(e) => setField('operator', e.target.value as CriterionOperator)}
                    className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl bg-white text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
                  >
                    <option value={CriterionOperator.All}>Bắt buộc đạt tất cả tiêu chí con</option>
                    <option value={CriterionOperator.Any}>Đạt ít nhất 1 tiêu chí bất kỳ</option>
                    <option value={CriterionOperator.AtLeast}>Đạt số lượng tối thiểu</option>
                  </select>
                </div>

                {operator === CriterionOperator.AtLeast && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Số lượng tiêu chí cần đạt tối thiểu <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={minimumSatisfied}
                      onChange={(e) => setField('minimumSatisfied', e.target.value ? Number(e.target.value) : '')}
                      placeholder="VD: 2"
                      className="w-full h-10 px-3.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                    {fieldErrors.minimumSatisfied && (
                      <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.minimumSatisfied}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dành cho loại Requirement: Cấu hình đánh giá thân thiện */}
          {type === CriterionType.Requirement && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3.5">
              <span className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                <Sliders size={14} />
                Phương thức đánh giá & Minh chứng
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Hình thức xét duyệt <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={evaluationType}
                    onChange={(e) => setField('evaluationType', e.target.value as CriterionEvaluationType)}
                    className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl bg-white text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
                  >
                    <option value={CriterionEvaluationType.Manual}>Cán bộ kiểm tra & duyệt thủ công</option>
                    <option value={CriterionEvaluationType.Boolean}>Xác nhận Đạt / Không đạt</option>
                    <option value={CriterionEvaluationType.NumericThreshold}>Kiểm tra theo ngưỡng điểm / số lượng</option>
                    <option value={CriterionEvaluationType.AccumulatedNumeric}>Tích lũy tổng điểm / giờ tham gia</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Hướng dẫn minh chứng cho sinh viên & cán bộ
                  </label>
                  <input
                    type="text"
                    value={reviewGuidance}
                    onChange={(e) => setField('reviewGuidance', e.target.value)}
                    placeholder="VD: Sinh viên nộp bảng điểm có dấu đỏ hoặc ảnh chụp giấy khen"
                    className="w-full h-10 px-3.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                </div>
              </div>

              {/* Chi tiết cho từng hình thức */}
              {evaluationType === CriterionEvaluationType.Manual && (
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={requireAttachment}
                      onChange={(e) => setField('requireAttachment', e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Bắt buộc sinh viên phải đính kèm tệp minh chứng (Ảnh / PDF) khi nộp</span>
                  </label>
                  <p className="text-[11px] text-slate-400 ml-5">
                    Cán bộ sẽ xem xét tệp đính kèm và đánh giá Đạt / Yêu cầu bổ sung / Từ chối.
                  </p>
                </div>
              )}

              {evaluationType === CriterionEvaluationType.Boolean && (
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    Nội dung xác nhận hoàn thành
                  </label>
                  <input
                    type="text"
                    value={booleanLabel}
                    onChange={(e) => setField('booleanLabel', e.target.value)}
                    placeholder="VD: Đạt giấy chứng nhận tham gia chiến dịch Mùa hè xanh"
                    className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-900 focus:border-blue-500 outline-none"
                  />
                </div>
              )}

              {evaluationType === CriterionEvaluationType.NumericThreshold && (
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">
                    Cấu hình ngưỡng giá trị đạt
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">Chỉ số so sánh</label>
                      <select
                        value={numericFieldType}
                        onChange={(e) => setField('numericFieldType', e.target.value as any)}
                        className="w-full h-9 px-2.5 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-900 outline-none"
                      >
                        <option value="drl">Điểm rèn luyện</option>
                        <option value="gpa">Điểm học tập (GPA)</option>
                        <option value="count">Số lượng bài viết / đề tài</option>
                        <option value="other">Chỉ số khác</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">Toán tử điều kiện</label>
                      <select
                        value={numericOperator}
                        onChange={(e) => setField('numericOperator', e.target.value)}
                        className="w-full h-9 px-2.5 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-900 outline-none"
                      >
                        <option value=">=">&gt;= (Lớn hơn hoặc bằng)</option>
                        <option value=">">&gt; (Lớn hơn)</option>
                        <option value="==">== (Bằng chính xác)</option>
                        <option value="<=">&lt;= (Nhỏ hơn hoặc bằng)</option>
                      </select>
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
                      <label className="text-[11px] text-slate-500 block mb-1">Tên chỉ số / Hoạt động</label>
                      <input
                        type="text"
                        value={accumulatedMetricName}
                        onChange={(e) => setField('accumulatedMetricName', e.target.value)}
                        placeholder="VD: Giờ tình nguyện"
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
          )}

          {/* Action Buttons */}
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
              <span>{isEdit ? 'Lưu thay đổi' : 'Thêm tiêu chuẩn'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
