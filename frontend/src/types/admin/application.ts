export interface StandardProgress {
  groupCode: 'Ethics' | 'Study' | 'Fitness' | 'Volunteer' | 'Integration' | string;
  requiredCount: number;
  approvedCount: number;
  complete: boolean;
}

export interface ApplicantSnapshot {
  userId?: string;
  email?: string;
  fullName?: string;
  studentCode?: string;
  avatarUrl?: string | null;
  school?: string;
  faculty?: string;
  major?: string;
  administrativeClass?: string;
  academicYear?: number;
  snapshotAt?: string;
  phoneNumber?: string;
  gender?: string;
  birthDate?: string;
  identityCardNumber?: string;
  ethnicity?: string;
  politicalStatus?: string;
}

export type ApplicationSubmissionStatus =
  | 'Draft'
  | 'Submitted'
  | 'UnderReview'
  | 'NeedsRevision'
  | 'Resubmitted'
  | 'Approved'
  | 'Rejected'
  | 'Withdrawn';

export interface ReviewApplicationItem {
  id: string;
  applicationCode: string;
  campaignId: string;
  campaignName: string;
  applicantSnapshotJson: string;
  status: ApplicationSubmissionStatus;
  submittedAt?: string | null;
  assignedReviewerId?: string | null;
  reviewerGeneralNote?: string | null;
  rejectionReason?: string | null;
  rowVersion: string;
  standards: StandardProgress[];
}

export interface ReviewApplicationFilterParams {
  campaignId?: string;
  status?: string;
  search?: string;
  pageIndex?: number;
  pageSize?: number;
}

export interface ReviewApplicationDecisionRequest {
  decision: 'Approved' | 'Rejected' | 'NeedsRevision';
  note?: string | null;
  rowVersion: string;
}

export type AdminEvidenceStatus =
  | 'Draft'
  | 'Submitted'
  | 'Approved'
  | 'Rejected'
  | 'NeedsRevision';

export interface AdminEvidenceItem {
  id: string;
  applicationId: string;
  applicationCode: string;
  criterionId: string;
  criterionCode: string;
  criterionTitle: string;
  campaignId: string;
  campaignName: string;
  dataJson: string;
  attachmentsJson: string;
  numericValue?: number | null;
  status: AdminEvidenceStatus;
  reviewerNote?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  rowVersion: string;
  createdAt: string;
  applicantSnapshotJson?: string | null;
  groupCode?: string | null;
}

export interface ReviewEvidenceRequest {
  decision: 'Approved' | 'Rejected' | 'NeedsRevision' | 'Submitted';
  note?: string | null;
  rowVersion: string;
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
  driveLink?: string;
  link?: string;
  achievedDate?: string;
  level?: string;
  [key: string]: unknown;
}

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  pageIndex: number;
  pageSize: number;
  totalPages: number;
}
