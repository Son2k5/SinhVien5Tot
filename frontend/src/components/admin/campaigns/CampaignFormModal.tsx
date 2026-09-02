import { useEffect, useMemo, useReducer } from 'react';
import {
  AwardLevel,
  AwardType,
  AWARD_LEVEL_LABELS,
  AWARD_TYPE_LABELS,
  type CampaignDetailResponse,
  type CampaignResponse,
  type CreateCampaignRequest,
  type UpdateCampaignRequest,
} from '../../../types/admin/campaign';
import { useStandardSets } from '../../../hooks/admin/useStandards';
import { useCampaignsAll } from '../../../hooks/admin/useCampaigns';
import { StandardSetStatus } from '../../../types/admin/standard';
import { sanitizeApiError } from '../../../services/apiErrorSanitizer';
import {
  AlertCircle,
  Calendar,
  Info,
  Loader2,
  X,
} from 'lucide-react';

export interface CampaignFormModalProps {
  isOpen: boolean;
  campaign?: CampaignDetailResponse | CampaignResponse | null;
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCampaignRequest | UpdateCampaignRequest) => Promise<void> | void;
}

function toLocalDatetimeInput(isoString?: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - offset);
  return localDate.toISOString().slice(0, 16);
}

function toUtcIso(localDatetimeString: string): string {
  if (!localDatetimeString) return '';
  return new Date(localDatetimeString).toISOString();
}

interface CampaignFormState {
  name: string;
  schoolYear: string;
  level: AwardLevel;
  awardType: AwardType;
  standardSetId: string;
  prerequisiteCampaignId: string;
  regOpenAt: string;
  regCloseAt: string;
  submitDeadline: string;
  reviewDeadline: string;
  description: string;
  minSv5tPercentage: number | '';
  noViolatingMembers: boolean;
  strongYouthUnion: boolean;
  activeTab: 'info' | 'schedule' | 'rules';
  formError: string | null;
  fieldErrors: Record<string, string>;
}

type CampaignFormAction =
  | { type: 'RESET'; campaign?: CampaignDetailResponse | CampaignResponse | null }
  | { type: 'SET_FIELD'; field: keyof CampaignFormState; value: unknown }
  | { type: 'SET_ERRORS'; fieldErrors: Record<string, string>; formError?: string | null }
  | { type: 'SET_FORM_ERROR'; formError: string | null }
  | { type: 'SET_ACTIVE_TAB'; tab: 'info' | 'schedule' | 'rules' };

function getInitialCampaignState(campaign?: CampaignDetailResponse | CampaignResponse | null): CampaignFormState {
  if (campaign) {
    let minSv5t: number | '' = 10;
    let noViolating = true;
    let strongUnion = true;
    try {
      const rawJson =
        'collectiveEligibilityRuleJson' in campaign
          ? (campaign as CampaignDetailResponse).collectiveEligibilityRuleJson
          : '[]';
      const parsed = JSON.parse(rawJson || '[]');
      if (Array.isArray(parsed)) {
        const minRule = parsed.find((r: any) => r.rule === 'min_sv5t_percentage');
        if (minRule && typeof minRule.threshold === 'number') {
          minSv5t = minRule.threshold;
        }
        const noVio = parsed.find((r: any) => r.rule === 'no_violating_members');
        noViolating = noVio ? Boolean(noVio.required) : true;
        const union = parsed.find((r: any) => r.rule === 'strong_youth_union');
        strongUnion = union ? Boolean(union.required) : true;
      }
    } catch {
      minSv5t = 10;
      noViolating = true;
      strongUnion = true;
    }

    return {
      name: campaign.name,
      schoolYear: campaign.schoolYear,
      level: campaign.level,
      awardType: campaign.awardType,
      standardSetId: campaign.standardSetId,
      prerequisiteCampaignId: campaign.prerequisiteCampaignId ?? '',
      regOpenAt: toLocalDatetimeInput(campaign.regOpenAt),
      regCloseAt: toLocalDatetimeInput(campaign.regCloseAt),
      submitDeadline: toLocalDatetimeInput(campaign.submitDeadline),
      reviewDeadline: toLocalDatetimeInput(campaign.reviewDeadline),
      description: campaign.description ?? '',
      minSv5tPercentage: minSv5t,
      noViolatingMembers: noViolating,
      strongYouthUnion: strongUnion,
      activeTab: 'info',
      formError: null,
      fieldErrors: {},
    };
  }

  const now = new Date();
  const open = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0);
  const close = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate(), 17, 0);
  const submit = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate() + 7, 23, 59);
  const review = new Date(now.getFullYear(), now.getMonth() + 2, now.getDate(), 23, 59);

  return {
    name: '',
    schoolYear: '2025-2026',
    level: AwardLevel.School,
    awardType: AwardType.Individual,
    standardSetId: '',
    prerequisiteCampaignId: '',
    regOpenAt: toLocalDatetimeInput(open.toISOString()),
    regCloseAt: toLocalDatetimeInput(close.toISOString()),
    submitDeadline: toLocalDatetimeInput(submit.toISOString()),
    reviewDeadline: toLocalDatetimeInput(review.toISOString()),
    description: '',
    minSv5tPercentage: 10,
    noViolatingMembers: true,
    strongYouthUnion: true,
    activeTab: 'info',
    formError: null,
    fieldErrors: {},
  };
}

function campaignFormReducer(state: CampaignFormState, action: CampaignFormAction): CampaignFormState {
  switch (action.type) {
    case 'RESET':
      return getInitialCampaignState(action.campaign);
    case 'SET_FIELD': {
      const nextState = { ...state, [action.field]: action.value };
      if (action.field === 'level' && action.value === AwardLevel.School) {
        nextState.prerequisiteCampaignId = '';
      }
      return nextState;
    }
    case 'SET_ERRORS':
      return {
        ...state,
        fieldErrors: action.fieldErrors,
        ...(action.formError !== undefined ? { formError: action.formError } : {}),
      };
    case 'SET_FORM_ERROR':
      return { ...state, formError: action.formError };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.tab };
    default:
      return state;
  }
}

export function CampaignFormModal({
  isOpen,
  campaign,
  isLoading = false,
  onClose,
  onSubmit,
}: CampaignFormModalProps) {
  const isEdit = Boolean(campaign);

  // Load published standard sets & all campaigns (for prerequisite)
  const { data: standardSets = [] } = useStandardSets();
  const { data: allCampaigns = [] } = useCampaignsAll();

  // Form state via useReducer
  const [state, dispatch] = useReducer(
    campaignFormReducer,
    campaign,
    getInitialCampaignState,
  );

  const {
    name,
    schoolYear,
    level,
    awardType,
    standardSetId,
    prerequisiteCampaignId,
    regOpenAt,
    regCloseAt,
    submitDeadline,
    reviewDeadline,
    description,
    minSv5tPercentage,
    noViolatingMembers,
    strongYouthUnion,
    activeTab,
    formError,
    fieldErrors,
  } = state;

  const setField = <K extends keyof CampaignFormState>(field: K, value: CampaignFormState[K]) => {
    dispatch({ type: 'SET_FIELD', field, value });
  };

  // Reset or initialize values when modal opens
  useEffect(() => {
    if (!isOpen) return;
    dispatch({ type: 'RESET', campaign });
  }, [isOpen, campaign]);

  // Filter available standard sets (must be Published, matching Level and AwardType)
  const matchingStandardSets = useMemo(() => {
    return standardSets.filter(
      (s) =>
        s.status === StandardSetStatus.Published &&
        s.level === level &&
        s.awardType === awardType,
    );
  }, [standardSets, level, awardType]);

  // Automatically select standard set if only 1 matching exists and none selected
  useEffect(() => {
    if (matchingStandardSets.length > 0 && !matchingStandardSets.some((s) => s.id === standardSetId)) {
      setField('standardSetId', matchingStandardSets[0].id);
    } else if (matchingStandardSets.length === 0 && standardSetId !== '') {
      setField('standardSetId', '');
    }
  }, [matchingStandardSets, standardSetId]);

  // Filter candidate prerequisite campaigns
  const candidatePrerequisites = useMemo(() => {
    if (level === AwardLevel.School) return [];
    if (level === AwardLevel.City) {
      return allCampaigns.filter(
        (c) => c.level === AwardLevel.School && c.awardType === awardType && c.id !== campaign?.id,
      );
    }
    if (level === AwardLevel.Central) {
      return allCampaigns.filter(
        (c) => c.level === AwardLevel.City && c.awardType === awardType && c.id !== campaign?.id,
      );
    }
    return [];
  }, [allCampaigns, level, awardType, campaign?.id]);

  useEffect(() => {
    if (level === AwardLevel.School && prerequisiteCampaignId !== '') {
      setField('prerequisiteCampaignId', '');
    }
  }, [level, prerequisiteCampaignId]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = 'Tên đợt xét không được để trống.';
    } else if (name.length > 250) {
      errors.name = 'Tên đợt xét không được vượt quá 250 ký tự.';
    }

    if (!schoolYear.trim()) {
      errors.schoolYear = 'Năm học không được để trống.';
    } else if (schoolYear.length > 20) {
      errors.schoolYear = 'Năm học không được quá 20 ký tự.';
    }

    if (!standardSetId) {
      errors.standardSetId = 'Bắt buộc phải chọn bộ tiêu chuẩn đã công bố (Published) cùng cấp và loại danh hiệu.';
    }

    // Schedule validation
    const dOpen = new Date(regOpenAt).getTime();
    const dClose = new Date(regCloseAt).getTime();
    const dSubmit = new Date(submitDeadline).getTime();
    const dReview = new Date(reviewDeadline).getTime();

    if (!regOpenAt) errors.regOpenAt = 'Vui lòng chọn thời gian mở đăng ký.';
    if (!regCloseAt) errors.regCloseAt = 'Vui lòng chọn thời gian đóng đăng ký.';
    if (!submitDeadline) errors.submitDeadline = 'Vui lòng chọn hạn nộp minh chứng.';
    if (!reviewDeadline) errors.reviewDeadline = 'Vui lòng chọn hạn xét duyệt.';

    if (regOpenAt && regCloseAt && dOpen >= dClose) {
      errors.regCloseAt = 'Thời gian đóng đăng ký phải sau thời gian mở đăng ký.';
    }
    if (regCloseAt && submitDeadline && dClose > dSubmit) {
      errors.submitDeadline = 'Hạn nộp minh chứng phải sau hoặc bằng ngày đóng đăng ký.';
    }
    if (submitDeadline && reviewDeadline && dSubmit > dReview) {
      errors.reviewDeadline = 'Hạn xét duyệt phải sau hoặc bằng hạn nộp minh chứng.';
    }

    if (awardType === AwardType.Collective) {
      if (minSv5tPercentage === '' || isNaN(Number(minSv5tPercentage)) || Number(minSv5tPercentage) < 0 || Number(minSv5tPercentage) > 100) {
        errors.minSv5tPercentage = 'Tỷ lệ % tối thiểu phải từ 0 đến 100.';
      }
    }

    dispatch({ type: 'SET_ERRORS', fieldErrors: errors });
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'SET_FORM_ERROR', formError: null });

    if (!validate()) {
      dispatch({
        type: 'SET_FORM_ERROR',
        formError: 'Vui lòng kiểm tra và sửa các thông tin chưa hợp lệ theo biểu mẫu.',
      });
      return;
    }

    const collectiveRulesArray = awardType === AwardType.Collective
      ? [
          {
            rule: 'min_sv5t_percentage',
            threshold: Number(minSv5tPercentage) || 0,
            description: `Tối thiểu ${minSv5tPercentage}% sinh viên đạt SV5T cá nhân`,
          },
          ...(noViolatingMembers
            ? [{ rule: 'no_violating_members', required: true, description: 'Không có đoàn viên vi phạm kỷ luật' }]
            : []),
          ...(strongYouthUnion
            ? [{ rule: 'strong_youth_union', required: true, description: 'Đạt danh hiệu Chi đoàn / Chi hội vững mạnh' }]
            : []),
        ]
      : [];

    const payload: CreateCampaignRequest = {
      name: name.trim(),
      schoolYear: schoolYear.trim(),
      level,
      awardType,
      standardSetId,
      prerequisiteCampaignId: prerequisiteCampaignId ? prerequisiteCampaignId : null,
      regOpenAt: toUtcIso(regOpenAt),
      regCloseAt: toUtcIso(regCloseAt),
      submitDeadline: toUtcIso(submitDeadline),
      reviewDeadline: toUtcIso(reviewDeadline),
      description: description.trim() || null,
      collectiveEligibilityRuleJson: JSON.stringify(collectiveRulesArray),
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
            {isEdit ? 'Chỉnh sửa đợt xét' : 'Tạo đợt xét mới'}
          </h2>
          <p className="text-xs text-slate-500">
            Thiết lập thông tin đợt xét, bộ tiêu chuẩn và cấu hình lịch trình thời hạn.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-1 bg-slate-100/70 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setField('activeTab', 'info')}
            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'info'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            1. Thông tin chung
          </button>
          <button
            type="button"
            onClick={() => setField('activeTab', 'schedule')}
            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'schedule'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            2. Lịch trình & Thời hạn
          </button>
          {awardType === AwardType.Collective && (
            <button
              type="button"
              onClick={() => setField('activeTab', 'rules')}
              className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'rules'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              3. Quy tắc tập thể
            </button>
          )}
        </div>

        {formError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-700 font-medium">
            <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* TAB 1: THÔNG TIN CHUNG */}
          {activeTab === 'info' && (
            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tên đợt xét <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setField('name', e.target.value)}
                  placeholder="Ví dụ: Xét duyệt danh hiệu Sinh viên 5 tốt cấp Trường năm học 2025-2026"
                  className={`w-full h-10 px-3.5 text-xs border rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 ${
                    fieldErrors.name
                      ? 'border-rose-400 focus:ring-rose-200'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                  }`}
                />
                {fieldErrors.name && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Năm học <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={schoolYear}
                    onChange={(e) => setField('schoolYear', e.target.value)}
                    placeholder="2025-2026"
                    className="w-full h-10 px-3.5 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                  {fieldErrors.schoolYear && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.schoolYear}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Cấp xét duyệt <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setField('level', e.target.value as AwardLevel)}
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
                    onChange={(e) => setField('awardType', e.target.value as AwardType)}
                    className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
                  >
                    <option value={AwardType.Individual}>{AWARD_TYPE_LABELS[AwardType.Individual]}</option>
                    <option value={AwardType.Collective}>{AWARD_TYPE_LABELS[AwardType.Collective]}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Bộ tiêu chuẩn áp dụng <span className="text-rose-500">*</span>
                </label>
                <select
                  value={standardSetId}
                  onChange={(e) => setField('standardSetId', e.target.value)}
                  className={`w-full h-10 px-3 text-xs border rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 cursor-pointer ${
                    fieldErrors.standardSetId
                      ? 'border-rose-400 focus:ring-rose-200'
                      : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                  }`}
                >
                  <option value="">-- Chọn bộ tiêu chuẩn đã công bố --</option>
                  {matchingStandardSets.map((s) => (
                    <option key={s.id} value={s.id}>
                      Năm học {s.academicYear} · {AWARD_LEVEL_LABELS[s.level]} · {AWARD_TYPE_LABELS[s.awardType]}
                    </option>
                  ))}
                </select>
                {matchingStandardSets.length === 0 && (
                  <p className="text-xs text-amber-800 bg-amber-50 p-2 rounded-lg mt-1 border border-amber-200 flex items-center gap-1.5">
                    <Info size={14} className="shrink-0" />
                    Chưa có bộ tiêu chuẩn nào ở trạng thái Đã công bố (Published) phù hợp với Cấp và Loại danh hiệu đã chọn.
                  </p>
                )}
                {fieldErrors.standardSetId && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.standardSetId}</p>
                )}
              </div>

              {level !== AwardLevel.School && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Đợt xét tiên quyết (Prerequisite Campaign)
                  </label>
                  <select
                    value={prerequisiteCampaignId}
                    onChange={(e) => setField('prerequisiteCampaignId', e.target.value)}
                    className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer"
                  >
                    <option value="">-- Không bắt buộc / Không có --</option>
                    {candidatePrerequisites.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({AWARD_LEVEL_LABELS[c.level]} · Năm học {c.schoolYear})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {level === AwardLevel.City
                      ? 'Đợt xét cấp Thành phố yêu cầu sinh viên phải đạt ở đợt xét cấp Trường tương ứng.'
                      : 'Đợt xét cấp Trung ương yêu cầu sinh viên phải đạt ở đợt xét cấp Thành phố tương ứng.'}
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Mô tả / Kế hoạch triển khai
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setField('description', e.target.value)}
                  rows={2}
                  placeholder="Thông tin ghi chú về mục đích, đối tượng tham gia hoặc hướng dẫn chung..."
                  className="w-full p-3 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
                />
              </div>
            </div>
          )}

          {/* TAB 2: LỊCH TRÌNH & THỜI HẠN */}
          {activeTab === 'schedule' && (
            <div className="space-y-3.5">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-900 flex items-start gap-2">
                <Calendar size={16} className="shrink-0 mt-0.5 text-blue-600" />
                <div>
                  <strong>Quy tắc thứ tự thời gian hợp lệ:</strong>
                  <div className="mt-0.5 text-[11.5px] text-slate-600">
                    Mở đăng ký &lt; Đóng đăng ký &le; Hạn nộp minh chứng &le; Hạn xét duyệt
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Mở cổng đăng ký <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={regOpenAt}
                    onChange={(e) => setField('regOpenAt', e.target.value)}
                    className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                  {fieldErrors.regOpenAt && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.regOpenAt}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Đóng cổng đăng ký <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={regCloseAt}
                    onChange={(e) => setField('regCloseAt', e.target.value)}
                    className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                  {fieldErrors.regCloseAt && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.regCloseAt}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Hạn nộp minh chứng bổ sung <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={submitDeadline}
                    onChange={(e) => setField('submitDeadline', e.target.value)}
                    className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                  {fieldErrors.submitDeadline && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.submitDeadline}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Hạn chót xét duyệt hồ sơ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={reviewDeadline}
                    onChange={(e) => setField('reviewDeadline', e.target.value)}
                    className="w-full h-10 px-3 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                  {fieldErrors.reviewDeadline && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.reviewDeadline}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: QUY TẮC TẬP THỂ */}
          {activeTab === 'rules' && awardType === AwardType.Collective && (
            <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <h4 className="text-xs font-bold text-slate-800">
                  Điều kiện công nhận danh hiệu Tập thể
                </h4>
                <p className="text-[11.5px] text-slate-500 mt-0.5">
                  Thiết lập các điều kiện chuẩn để xét duyệt danh hiệu Tập thể Sinh viên 5 tốt.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Tỷ lệ sinh viên đạt SV5T cá nhân tối thiểu (%) <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-2 max-w-xs">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={minSv5tPercentage}
                      onChange={(e) => setField('minSv5tPercentage', e.target.value ? Number(e.target.value) : '')}
                      placeholder="VD: 10"
                      className="w-full h-10 px-3.5 text-xs border border-slate-200 rounded-xl bg-white text-slate-900 focus:border-blue-500 outline-none"
                    />
                    <span className="text-xs font-bold text-slate-600">%</span>
                  </div>
                  {fieldErrors.minSv5tPercentage && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">{fieldErrors.minSv5tPercentage}</p>
                  )}
                </div>

                <div className="space-y-2 pt-1 border-t border-slate-200/60">
                  <label className="flex items-center gap-2.5 p-2.5 bg-white rounded-xl border border-slate-200/80 cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={noViolatingMembers}
                      onChange={(e) => setField('noViolatingMembers', e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div className="text-xs text-slate-800">
                      <span className="font-semibold">Không có đoàn viên / hội viên vi phạm kỷ luật</span>
                      <p className="text-[11px] text-slate-500">100% đoàn viên không vi phạm pháp luật và nội quy nhà trường</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-2.5 bg-white rounded-xl border border-slate-200/80 cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={strongYouthUnion}
                      onChange={(e) => setField('strongYouthUnion', e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div className="text-xs text-slate-800">
                      <span className="font-semibold">Đạt danh hiệu Chi đoàn / Chi hội vững mạnh</span>
                      <p className="text-[11px] text-slate-500">Được Đoàn trường / Hội sinh viên đánh giá xếp loại vững mạnh trở lên</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="text-xs text-slate-400">
              <span className="text-rose-500">*</span> Các trường bắt buộc
            </div>
            <div className="flex items-center gap-2">
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
                <span>{isEdit ? 'Lưu thay đổi' : 'Tạo đợt xét'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
