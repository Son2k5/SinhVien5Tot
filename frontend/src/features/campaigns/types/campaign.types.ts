import axios from 'axios';
import { sanitizeApiError } from '../../../services/apiErrorSanitizer';

export const AwardLevel = {
  School: 'School',
  City: 'City',
  Central: 'Central',
} as const;
export type AwardLevel = (typeof AwardLevel)[keyof typeof AwardLevel];

export const AwardType = {
  Individual: 'Individual',
  Collective: 'Collective',
} as const;
export type AwardType = (typeof AwardType)[keyof typeof AwardType];

export const CampaignStatus = {
  Draft: 'Draft',
  Open: 'Open',
  Closed: 'Closed',
  Reviewing: 'Reviewing',
  Published: 'Published',
  Archived: 'Archived',
} as const;
export type CampaignStatus = (typeof CampaignStatus)[keyof typeof CampaignStatus];

export const AWARD_LEVEL_LABELS: Record<AwardLevel, string> = {
  [AwardLevel.School]: 'Cấp Trường',
  [AwardLevel.City]: 'Cấp Thành phố',
  [AwardLevel.Central]: 'Cấp Trung ương',
};

export const AWARD_TYPE_LABELS: Record<AwardType, string> = {
  [AwardType.Individual]: 'Cá nhân',
  [AwardType.Collective]: 'Tập thể',
};

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  [CampaignStatus.Draft]: 'Nháp',
  [CampaignStatus.Open]: 'Đang mở đăng ký',
  [CampaignStatus.Closed]: 'Đã đóng đăng ký',
  [CampaignStatus.Reviewing]: 'Đang xét duyệt',
  [CampaignStatus.Published]: 'Đã công bố kết quả',
  [CampaignStatus.Archived]: 'Đã lưu trữ',
};

export const CAMPAIGN_STATUS_CONFIG: Record<
  CampaignStatus,
  { bg: string; text: string; border: string; dot: string }
> = {
  [CampaignStatus.Draft]: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  [CampaignStatus.Open]: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
  },
  [CampaignStatus.Closed]: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
  [CampaignStatus.Reviewing]: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
  },
  [CampaignStatus.Published]: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
    dot: 'bg-emerald-600',
  },
  [CampaignStatus.Archived]: {
    bg: 'bg-slate-100',
    text: 'text-slate-500',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
  },
};

export interface CampaignResponse {
  id: string;
  name: string;
  schoolYear: string;
  level: AwardLevel;
  awardType: AwardType;
  status: CampaignStatus;
  standardSetId: string;
  standardSetName?: string | null;
  prerequisiteCampaignId?: string | null;
  prerequisiteCampaignName?: string | null;
  regOpenAt: string;
  regCloseAt: string;
  submitDeadline: string;
  reviewDeadline: string;
  description?: string | null;
  createdAt: string;
}

export interface CampaignDetailResponse {
  id: string;
  name: string;
  schoolYear: string;
  level: AwardLevel;
  awardType: AwardType;
  status: CampaignStatus;
  standardSetId: string;
  standardSetName?: string | null;
  prerequisiteCampaignId?: string | null;
  prerequisiteCampaignName?: string | null;
  collectiveEligibilityRuleJson: string;
  regOpenAt: string;
  regCloseAt: string;
  submitDeadline: string;
  reviewDeadline: string;
  description?: string | null;
  totalApplications: number;
  createdAt: string;
}

export interface CreateCampaignRequest {
  name: string;
  schoolYear: string;
  level: AwardLevel;
  awardType: AwardType;
  standardSetId: string;
  prerequisiteCampaignId?: string | null;
  regOpenAt: string;
  regCloseAt: string;
  submitDeadline: string;
  reviewDeadline: string;
  description?: string | null;
  collectiveEligibilityRuleJson: string;
}

export interface UpdateCampaignRequest {
  name: string;
  schoolYear: string;
  level: AwardLevel;
  awardType: AwardType;
  standardSetId: string;
  prerequisiteCampaignId?: string | null;
  regOpenAt: string;
  regCloseAt: string;
  submitDeadline: string;
  reviewDeadline: string;
  description?: string | null;
  collectiveEligibilityRuleJson: string;
}

export interface UpdateCampaignStatusRequest {
  status: CampaignStatus;
}

export interface CampaignFilterParams {
  level?: AwardLevel;
  status?: CampaignStatus;
  schoolYear?: string;
  pageIndex?: number;
  pageSize?: number;
}

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
}

export class CampaignApiError extends Error {
  readonly status?: number;
  readonly code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'CampaignApiError';
    this.status = status;
    this.code = code;
  }
}

export function parseCampaignApiError(err: unknown): CampaignApiError {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const data = err.response?.data as { code?: string; detail?: string; message?: string } | undefined;
    const code = data?.code;
    const rawMessage = data?.detail || data?.message;
    const message = rawMessage && typeof rawMessage === 'string' ? rawMessage : sanitizeApiError(err);
    return new CampaignApiError(message, status, code);
  }
  if (err instanceof CampaignApiError) return err;
  return new CampaignApiError(err instanceof Error ? err.message : 'Có lỗi khi thao tác chiến dịch.');
}
