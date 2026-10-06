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
export type SubmissionStatus =
  | (typeof SubmissionStatus)[keyof typeof SubmissionStatus]
  | 'Draft'
  | 'Submitted'
  | 'UnderReview'
  | 'NeedsRevision'
  | 'Resubmitted'
  | 'Approved'
  | 'Rejected'
  | 'Withdrawn'
  | string;

export function normalizeSubmissionStatus(status?: number | string | null): number {
  if (status === null || status === undefined) return SubmissionStatus.Draft;
  if (typeof status === 'number') return status;
  const s = String(status).toLowerCase();
  switch (s) {
    case 'draft':
      return SubmissionStatus.Draft;
    case 'submitted':
      return SubmissionStatus.Submitted;
    case 'underreview':
      return SubmissionStatus.UnderReview;
    case 'needsrevision':
      return SubmissionStatus.NeedsRevision;
    case 'resubmitted':
      return SubmissionStatus.Resubmitted;
    case 'approved':
      return SubmissionStatus.Approved;
    case 'rejected':
      return SubmissionStatus.Rejected;
    case 'withdrawn':
      return SubmissionStatus.Withdrawn;
    default:
      return Number(status) || SubmissionStatus.Draft;
  }
}

export function isDraftStatus(status?: number | string | null): boolean {
  return normalizeSubmissionStatus(status) === SubmissionStatus.Draft;
}

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
  reviewerGeneralNote?: string | null;
  rejectionReason?: string | null;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
}

export interface GetOpenCampaignsParams {
  level?: number;
  schoolYear?: string;
  awardType?: number;
  pageIndex?: number;
  pageSize?: number;
}

export interface GetMyApplicationsParams {
  status?: number;
  pageIndex?: number;
  pageSize?: number;
}

export interface EvidenceAttachment {
  url?: string;
  fileUrl?: string;
  secure_url?: string;
  fileName?: string;
  name?: string;
  publicId?: string;
  bytes?: number;
  size?: number;
  format?: string;
  fileType?: string;
}

export interface EvidenceParsedData {
  description?: string;
  notes?: string;
  driveLink?: string;
  link?: string;
  url?: string;
  achievedDate?: string;
  [key: string]: unknown;
}

export class StudentPortalApiError extends Error {
  public statusCode?: number;
  public rawError: unknown;

  constructor(message: string, statusCode?: number, rawError?: unknown) {
    super(message);
    this.name = 'StudentPortalApiError';
    this.statusCode = statusCode;
    this.rawError = rawError;
  }
}

export function parseStudentPortalApiError(error: unknown): string {
  if (error instanceof StudentPortalApiError) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null) {
    const err = error as { response?: { data?: { message?: string; title?: string; detail?: string } }; message?: string };
    if (err.response?.data?.message) return err.response.data.message;
    if (err.response?.data?.title) return err.response.data.title;
    if (err.response?.data?.detail) return err.response.data.detail;
    if (err.message) return err.message;
  }
  return 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';
}
