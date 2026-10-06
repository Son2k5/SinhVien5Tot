import { axiosClient } from '../../../api/axiosClient';
import {
  type AdminDashboardFilters,
  type AdminDashboardSnapshot,
  type CollectiveSummary,
  type DashboardSummary,
  type DepartmentRankingApiItem,
  type LevelFunnelItem,
  type RecentActivityItem,
  type StandardGroupRateItem,
  type StatusBreakdownItem,
  type UrgentDashboardItem,
  parseAdminDashboardApiError,
} from '../types/admin-dashboard.types';

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
  async getSnapshot(filters: AdminDashboardFilters): Promise<AdminDashboardSnapshot> {
    try {
      const params = queryParams(filters);
      const [
        summary,
        status,
        standardRates,
        funnel,
        departmentRanking,
        urgent,
        activities,
        collective,
      ] = await Promise.all([
        axiosClient.get<DashboardSummary>('/admin/dashboard/summary', { params }),
        axiosClient.get<StatusBreakdownItem[]>('/admin/dashboard/status-breakdown', { params }),
        axiosClient.get<StandardGroupRateItem[]>('/admin/dashboard/standard-group-rate', { params }),
        axiosClient.get<LevelFunnelItem[]>('/admin/dashboard/level-funnel', { params }),
        axiosClient.get<DepartmentRankingApiItem[]>('/admin/dashboard/department-ranking', {
          params: { ...params, limit: 10 },
        }),
        axiosClient.get<UrgentDashboardItem[]>('/admin/dashboard/urgent-items', {
          params: { ...params, overdueDays: 1, limit: 20 },
        }),
        axiosClient.get<RecentActivityItem[]>('/admin/dashboard/recent-activity', {
          params: { ...params, limit: 20 },
        }),
        axiosClient.get<CollectiveSummary>('/admin/dashboard/collective-summary', { params }),
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
    } catch (error: unknown) {
      throw parseAdminDashboardApiError(error);
    }
  },
};

export default adminDashboardService;
