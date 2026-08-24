import { apiClient } from '../apiClient';

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

export interface StatusBreakdownItem { status: string; label: string; count: number; color: string; }
export interface StandardGroupRateItem { groupCode: string; groupName: string; passRate: number; tone: string; }
export interface LevelFunnelItem { level: string; label: string; submitted: number; approved: number; }
export interface DepartmentRankingItem { departmentId: string; departmentName: string; registered: number; awarded: number; rate: number; collectiveQualified: boolean; }
export interface UrgentDashboardItem { applicationId: string; studentName: string; daysPending: number; deadlineAtUtc: string; urgencyLabel: string; }
export interface RecentActivityItem { reviewerName: string; reviewerInitials: string; action: string; target: string; createdAtUtc: string; }
export interface CollectiveSummary { totalUnits: number; qualifiedUnits: number; }

function queryParams(filters: AdminDashboardFilters) {
  return {
    campaignId: filters.campaign,
    schoolYear: filters.schoolYear,
    level: filters.level,
    departmentId: filters.department,
    from: filters.from,
    to: filters.to,
  };
}

export const adminDashboardService = {
  async getSnapshot(filters: AdminDashboardFilters) {
    const params = queryParams(filters);
    const [summary, status, standardRates, funnel, departmentRanking, urgent, activities, collective] = await Promise.all([
      apiClient.get<DashboardSummary>('/admin/dashboard/summary', { params }),
      apiClient.get<StatusBreakdownItem[]>('/admin/dashboard/status-breakdown', { params }),
      apiClient.get<StandardGroupRateItem[]>('/admin/dashboard/standard-group-rate', { params }),
      apiClient.get<LevelFunnelItem[]>('/admin/dashboard/level-funnel', { params }),
      apiClient.get<DepartmentRankingItem[]>('/admin/dashboard/department-ranking', { params: { ...params, limit: 10 } }),
      apiClient.get<UrgentDashboardItem[]>('/admin/dashboard/urgent-items', { params: { ...params, overdueDays: 1, limit: 20 } }),
      apiClient.get<RecentActivityItem[]>('/admin/dashboard/recent-activity', { params: { ...params, limit: 20 } }),
      apiClient.get<CollectiveSummary>('/admin/dashboard/collective-summary', { params }),
    ]);
    return {
      summary: summary.data,
      status: status.data,
      standardRates: standardRates.data,
      funnel: funnel.data,
      departmentRanking: departmentRanking.data,
      urgent: urgent.data,
      activities: activities.data,
      collective: collective.data,
    };
  },
};
