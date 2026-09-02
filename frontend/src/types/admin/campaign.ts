/**
 * Campaign Module Types & DTOs
 * Synchronized with backend SV5T.Application.Admin.Dtos & SV5T.Domain.Campaigns
 */

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
