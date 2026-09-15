export const AwardLevel = {
  School: 1,
  City: 2,
  Central: 3,
} as const;
export type AwardLevel = (typeof AwardLevel)[keyof typeof AwardLevel];

export const AwardType = {
  Individual: 1,
  Collective: 2,
} as const;
export type AwardType = (typeof AwardType)[keyof typeof AwardType];

export const SubmissionStatus = {
  Draft: 1,
  Submitted: 2,
  UnderReview: 3,
  NeedsRevision: 4,
  Resubmitted: 5,
  Approved: 6,
  Rejected: 7,
  Withdrawn: 8,
} as const;
export type SubmissionStatus = (typeof SubmissionStatus)[keyof typeof SubmissionStatus];

export const EvidenceStatus = {
  Draft: 1,
  Submitted: 2,
  Approved: 3,
  Rejected: 4,
  NeedsRevision: 5,
} as const;
export type EvidenceStatus = (typeof EvidenceStatus)[keyof typeof EvidenceStatus];

export const StandardGroupCode = {
  Ethics: 1,
  Study: 2,
  Fitness: 3,
  Volunteer: 4,
  Integration: 5,
} as const;
export type StandardGroupCode = (typeof StandardGroupCode)[keyof typeof StandardGroupCode];

export interface StudentCampaignListItemResponse {
  id: string;
  name: string;
  schoolYear: string;
  level: AwardLevel;
  awardType: AwardType;
  status: number;
  description?: string | null;
  regOpenAt: string;
  regCloseAt: string;
  submitDeadline: string;
  reviewDeadline?: string | null;
  canRegister: boolean;
  standardSetId: string;
  standardSetName?: string | null;
}

export interface StudentStandardSetBriefResponse {
  id: string;
  name: string;
  academicYear: string;
  level: AwardLevel;
  awardType: AwardType;
  version: number;
}

export interface StudentCriterionItemResponse {
  id: string;
  standardId: string;
  code: string;
  title: string;
  description?: string | null;
  groupCode: string; // "Ethics" | "Study" | "Fitness" | "Volunteer" | "Integration" or numeric string
  isRequired: boolean;
  sortOrder: number;
  existingEvidenceCount: number;
  existingEvidenceStatus?: string | null;
}

export interface StudentCampaignDetailResponse {
  id: string;
  name: string;
  schoolYear: string;
  level: AwardLevel;
  awardType: AwardType;
  status: number;
  description?: string | null;
  regOpenAt: string;
  regCloseAt: string;
  submitDeadline: string;
  reviewDeadline?: string | null;
  canRegister: boolean;
  standardSetId: string;
  standardSet?: StudentStandardSetBriefResponse | null;
  criteria: StudentCriterionItemResponse[];
}

export interface StudentApplicationSummaryResponse {
  id: string;
  applicationCode: string;
  campaignId: string;
  campaignName: string;
  schoolYear: string;
  status: SubmissionStatus;
  createdAt: string;
  submittedAt?: string | null;
  updatedAt?: string | null;
  totalEvidences: number;
  approvedEvidences: number;
  pendingEvidences: number;
}

export interface StudentEvidenceItemResponse {
  id: string;
  criterionId: string;
  criterionCode: string;
  criterionTitle: string;
  groupCode: string;
  status: EvidenceStatus;
  dataJson?: string | null;
  attachmentsJson?: string | null;
  reviewerNote?: string | null;
  reviewedAt?: string | null;
  rowVersion: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentApplicationDetailResponse {
  id: string;
  applicationCode: string;
  campaignId: string;
  campaignName: string;
  schoolYear: string;
  submitDeadline: string;
  status: SubmissionStatus;
  snapshotJson?: string | null;
  createdAt: string;
  submittedAt?: string | null;
  updatedAt?: string | null;
  rowVersion: string;
  evidences: StudentEvidenceItemResponse[];
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
}
