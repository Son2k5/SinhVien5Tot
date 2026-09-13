/** Student DTOs - sync with AdminStudentDtos.cs */
export interface PagedResponse<T> {
  items: T[]; totalCount: number; pageIndex: number; pageSize: number; totalPages: number;
}
export const EvidenceStatus = {
  Draft: 'Draft', Submitted: 'Submitted', Approved: 'Approved',
  Rejected: 'Rejected', NeedsRevision: 'NeedsRevision',
} as const;
export type EvidenceStatus = (typeof EvidenceStatus)[keyof typeof EvidenceStatus];
export const SubmissionStatus = {
  Draft: 'Draft', Submitted: 'Submitted', UnderReview: 'UnderReview',
  NeedsRevision: 'NeedsRevision', Resubmitted: 'Resubmitted',
  Approved: 'Approved', Rejected: 'Rejected', Withdrawn: 'Withdrawn',
} as const;
export type SubmissionStatus = (typeof SubmissionStatus)[keyof typeof SubmissionStatus];
export const ReviewAction = {
  ApplicationCreated: 'ApplicationCreated', ApplicationSubmitted: 'ApplicationSubmitted',
  ReviewerAssigned: 'ReviewerAssigned', ReviewStarted: 'ReviewStarted',
  EvidenceApproved: 'EvidenceApproved', EvidenceRejected: 'EvidenceRejected',
  EvidenceRevisionRequested: 'EvidenceRevisionRequested', ApplicationApproved: 'ApplicationApproved',
  ApplicationRejected: 'ApplicationRejected', ApplicationRevisionRequested: 'ApplicationRevisionRequested',
  ApplicationResubmitted: 'ApplicationResubmitted', RecommendedForNextLevel: 'RecommendedForNextLevel',
} as const;
export type ReviewAction = (typeof ReviewAction)[keyof typeof ReviewAction];
export const EVIDENCE_STATUS_LABELS: Record<EvidenceStatus, string> = {
  Draft: 'Nháp', Submitted: 'Đã nộp', Approved: 'Đã duyệt',
  Rejected: 'Từ chối', NeedsRevision: 'Cần bổ sung',
};
export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  Draft: 'Nháp', Submitted: 'Đã nộp', UnderReview: 'Đang xét duyệt',
  NeedsRevision: 'Cần bổ sung', Resubmitted: 'Đã nộp lại',
  Approved: 'Đã duyệt', Rejected: 'Từ chối', Withdrawn: 'Đã rút',
};
export const REVIEW_ACTION_LABELS: Record<ReviewAction, string> = {
  ApplicationCreated: 'Tạo hồ sơ', ApplicationSubmitted: 'Nộp hồ sơ',
  ReviewerAssigned: 'Phân công xét duyệt', ReviewStarted: 'Bắt đầu xét duyệt',
  EvidenceApproved: 'Duyệt minh chứng', EvidenceRejected: 'Từ chối minh chứng',
  EvidenceRevisionRequested: 'Yêu cầu bổ sung minh chứng', ApplicationApproved: 'Duyệt hồ sơ',
  ApplicationRejected: 'Từ chối hồ sơ', ApplicationRevisionRequested: 'Yêu cầu bổ sung hồ sơ',
  ApplicationResubmitted: 'Sinh viên nộp lại', RecommendedForNextLevel: 'Đề xuất cấp cao hơn',
};
export interface AdminStudentListItem {
  id: string; email: string; displayName?: string | null;
  isVerified: boolean; isActive: boolean; fullName: string;
  studentCode: string; faculty: string; major?: string | null;
  administrativeClass: string; academicYear: number; school: string; createdAt: string;
}
export interface StudentFilterParams {
  search?: string; school?: string; faculty?: string; major?: string; administrativeClass?: string;
  cohort?: number; schoolYear?: string; isActive?: boolean; isVerified?: boolean;
  includeDeleted?: boolean; sortBy?: string; sortDir?: string;
  pageIndex?: number; pageSize?: number;
}
export interface AdminStudentAddress {
  addressType: string; provinceOrCity: string; district: string; streetAddress: string;
}
export interface AdminStudentProfile {
  fullName: string; birthDate: string; gender: string; identityCardNumber: string;
  ethnicity: string; school: string; major?: string | null; academicYear: number;
  studentCode: string; administrativeClass: string; faculty: string;
  currentPosition: string; contactEmail: string; phoneNumber: string;
  unionPosition?: string | null; politicalStatus: string;
  addresses?: AdminStudentAddress[] | null;
}
export interface AdminStudentApplicationSummary {
  id: string; applicationCode: string; campaignId: string; campaignName: string;
  schoolYear: string; status: SubmissionStatus; submittedAt?: string | null;
  evidenceCount: number; createdAt: string;
}
export interface AdminStudentEvidenceItem {
  id: string; applicationId: string; applicationCode: string; criterionId: string;
  criterionCode: string; criterionTitle: string; groupCode?: string | null;
  groupName: string; campaignId: string; campaignName: string; status: EvidenceStatus;
  reviewerNote?: string | null; reviewedBy?: string | null; reviewedAt?: string | null;
  rowVersion: string; createdAt: string;
}
export interface AdminStudentEvidenceGroup {
  groupCode?: string | null; groupName: string; totalCount: number;
  approvedCount: number; items: AdminStudentEvidenceItem[];
}
export interface AdminStudentReviewLog {
  id: string; applicationId: string; evidenceId?: string | null;
  action: ReviewAction; note?: string | null; actorId: string;
  actorName?: string | null; createdAt: string;
}
export interface AdminStudentDetail {
  id: string; email: string; displayName?: string | null; role: string;
  avatarUrl?: string | null; isVerified: boolean; isActive: boolean; isDeleted: boolean;
  deletedAt?: string | null; deleteReason?: string | null; createdAt: string;
  updatedAt?: string | null;
  profile?: AdminStudentProfile | null; applications: AdminStudentApplicationSummary[];
  evidenceGroups: AdminStudentEvidenceGroup[]; reviewLogs: AdminStudentReviewLog[];
}
export interface DeleteStudentRequest { confirm: boolean; reason?: string | null; }
export interface BatchDeleteStudentsRequest {
  ids: string[];
  confirm?: boolean;
  reason?: string | null;
}
export interface BatchDeleteStudentsResponse {
  deletedCount: number;
}
export interface LockStudentRequest { reason?: string | null; }
export interface UnlockStudentRequest { reason?: string | null; }
export interface ReviewStudentEvidenceRequest {
  evidenceId: string; decision: 'Approved' | 'Rejected' | 'NeedsRevision';
  note?: string | null; rowVersion: string;
}
