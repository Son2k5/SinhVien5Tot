import axios from 'axios';
import type { LucideIcon } from 'lucide-react';
import { sanitizeApiError } from '../../../services/apiErrorSanitizer';

export interface AdminDashboardFilters {
  campaign: string;
  schoolYear: string;
  level: string;
  department: string;
  from: string;
  to: string;
}

export interface DashboardSummary {
  totalRegistered: number;
  totalSubmitted: number;
  totalPendingReview: number;
  totalAwarded: number;
  awardRate: number;
}

export interface StatusBreakdownItem {
  status: string;
  label: string;
  count: number;
  color: string;
}

export interface StandardGroupRateItem {
  groupCode: string;
  groupName: string;
  passRate: number;
  tone: string;
}

export interface LevelFunnelItem {
  level: string;
  label: string;
  submitted: number;
  approved: number;
}

export interface DepartmentRankingApiItem {
  departmentId: string;
  departmentName: string;
  registered: number;
  awarded: number;
  rate: number;
  collectiveQualified: boolean;
}

export interface DepartmentRankingItem {
  name: string;
  registered: number;
  awarded: number;
  rate: number;
  qualified: boolean;
}

export interface UrgentDashboardItem {
  applicationId: string;
  studentName: string;
  daysPending: number;
  deadlineAtUtc: string;
  urgencyLabel: string;
}

export interface RecentActivityItem {
  reviewerName: string;
  reviewerInitials: string;
  action: string;
  target: string;
  createdAtUtc: string;
}

export interface CollectiveSummary {
  totalUnits: number;
  qualifiedUnits: number;
}

export interface AdminDashboardSnapshot {
  summary: DashboardSummary;
  status: StatusBreakdownItem[];
  standardRates: StandardGroupRateItem[];
  funnel: LevelFunnelItem[];
  departmentRanking: DepartmentRankingApiItem[];
  urgent: UrgentDashboardItem[];
  activities: RecentActivityItem[];
  collective: CollectiveSummary;
}

export interface KpiCardItem {
  label: string;
  value: number;
  change: string;
  icon: LucideIcon;
  tone: string;
}

export interface TransformedFunnelItem {
  level: string;
  label: string;
  submitted: number;
  approved: number;
  width: number;
}

export interface TransformedStandardItem {
  code: string;
  name: string;
  passRate: number;
  tone: string;
}

export type SortKey = 'registered' | 'awarded' | 'rate';

export class AdminDashboardApiError extends Error {
  readonly status?: number;
  readonly code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = 'AdminDashboardApiError';
    this.status = status;
    this.code = code;
  }
}

export function parseAdminDashboardApiError(err: unknown): AdminDashboardApiError {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const data = err.response?.data as { code?: string; detail?: string; message?: string } | undefined;
    const code = data?.code;
    const rawMessage = data?.detail || data?.message;
    const message = rawMessage && typeof rawMessage === 'string' ? rawMessage : sanitizeApiError(err);
    return new AdminDashboardApiError(message, status, code);
  }
  if (err instanceof AdminDashboardApiError) return err;
  return new AdminDashboardApiError(err instanceof Error ? err.message : 'Có lỗi khi tải dữ liệu bảng điều khiển Admin.');
}
