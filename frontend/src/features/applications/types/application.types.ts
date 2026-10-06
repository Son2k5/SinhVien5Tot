import type React from 'react';
import {
  ShieldCheck,
  BookOpen,
  Zap,
  HeartHandshake,
  Scale,
} from 'lucide-react';

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

export interface StudentEvidenceGroup {
  key: string;
  applicationId: string;
  applicationCode: string;
  campaignId: string;
  campaignName: string;
  snapshot: ApplicantSnapshot;
  evidences: AdminEvidenceItem[];
  totalEvidences: number;
  maxDaysWaiting: number;
  isOver7Days: boolean;
  isOver3Days: boolean;
  standardGroups: string[];
  latestSubmissionAt: string;
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

export const APPLICATION_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; dot: string; border: string; description?: string }
> = {
  Draft: { label: 'Bản nháp', bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-400', border: 'border-slate-200', description: 'Các hồ sơ đang soạn thảo' },
  Submitted: { label: 'Đã nộp', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', border: 'border-blue-200', description: 'Các hồ sơ đã nộp cần thẩm định' },
  UnderReview: { label: 'Đang thẩm định', bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500', border: 'border-purple-200', description: 'Các hồ sơ đang được thẩm định' },
  NeedsRevision: { label: 'Cần bổ sung', bg: 'bg-amber-50', text: 'text-amber-800', dot: 'bg-amber-500', border: 'border-amber-200', description: 'Các minh chứng yêu cầu sinh viên bổ sung' },
  Resubmitted: { label: 'Đã nộp lại', bg: 'bg-cyan-50', text: 'text-cyan-800', dot: 'bg-cyan-500', border: 'border-cyan-200', description: 'Các minh chứng sinh viên đã nộp lại' },
  Approved: { label: 'Đã duyệt', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200', description: 'Các minh chứng đã được phê duyệt' },
  Rejected: { label: 'Từ chối', bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500', border: 'border-rose-200', description: 'Các minh chứng không hợp lệ' },
  Withdrawn: { label: 'Đã rút', bg: 'bg-slate-50', text: 'text-slate-500', dot: 'bg-slate-400', border: 'border-slate-200', description: 'Các hồ sơ đã rút' },
};

export const STANDARD_GROUP_ICONS: Record<
  string,
  { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; color: string; bg: string; border: string }
> = {
  Ethics: { label: 'Đạo đức tốt', icon: ShieldCheck, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  Study: { label: 'Học tập tốt', icon: BookOpen, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  Fitness: { label: 'Thể lực tốt', icon: Zap, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  Volunteer: { label: 'Tình nguyện tốt', icon: HeartHandshake, color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
  Integration: { label: 'Hội nhập tốt', icon: Scale, color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
};

export const STATUS_CONFIG = APPLICATION_STATUS_CONFIG;
export const STANDARD_GROUPS = STANDARD_GROUP_ICONS;

export const normalizeApplicationStatus = (status: string | null): string => {
  if (!status) return '';
  const s = status.toLowerCase();
  const statuses: Record<string, string> = {
    pending: 'Submitted',
    submitted: 'Submitted',
    resubmitted: 'Resubmitted',
    needsrevision: 'NeedsRevision',
    underreview: 'UnderReview',
    approved: 'Approved',
    rejected: 'Rejected',
    withdrawn: 'Withdrawn',
  };
  return statuses[s] ?? '';
};

export function parseApplicantSnapshot(jsonStr?: string | null): ApplicantSnapshot {
  if (!jsonStr) return {};
  try {
    return JSON.parse(jsonStr) as ApplicantSnapshot;
  } catch {
    return {};
  }
}
