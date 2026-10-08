import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { homeDashboardService } from '../services/home-dashboard.service';
import type { WelcomeDashboard } from '../types/home-dashboard.types';
import type { User } from '../../auth/types/auth.types';

export const homeDashboardQueryKeys = {
  all: ['welcome-dashboard'] as const,
  user: (userId: string) => [...homeDashboardQueryKeys.all, userId] as const,
};

const createEmptyDashboard = (user: User): WelcomeDashboard => ({
  user: {
    id: user.id,
    displayName: user.name || user.email.split('@')[0],
    email: user.email,
    avatarUrl: user.avatarUrl,
    faculty: '',
  },
  features: [],
  notifications: [],
  news: [],
  criteriaProgress: [],
  standards: [],
  youthGallery: [],
  updatedAtUtc: new Date().toISOString(),
});

/**
 * Lấy dữ liệu Welcome Dashboard thực từ backend API.
 * Không dùng mock data - trường nào chưa có dữ liệu sẽ để trống.
 */
export function useWelcomeDashboard(user: User) {
  const query = useQuery({
    queryKey: homeDashboardQueryKeys.user(user.id),
    queryFn: homeDashboardService.getDashboard,
  });

  const dashboard = useMemo(
    () => query.data ?? createEmptyDashboard(user),
    [query.data, user],
  );

  const displayName =
    dashboard.user.displayName || user.name || user.email.split('@')[0];
  const avatarUrl = dashboard.user.avatarUrl || user.avatarUrl;
  const notifications = dashboard.notifications;
  const features = useMemo(() => {
    return (dashboard.features ?? []).map((feature) => {
      if (feature.key === 'campaigns') {
        return {
          ...feature,
          title: 'Chiến dịch',
          description: 'Chọn cấp xét & nộp hồ sơ danh hiệu',
          route: '/dashboard/campaigns',
          isAvailable: true,
          badge: undefined,
        };
      }
      if (feature.key === 'evidence') {
        return {
          ...feature,
          title: 'Hồ sơ đã nộp',
          description: 'Quản lý hồ sơ đã nộp & xem feedback của Mentor',
          route: '/dashboard/applications',
          isAvailable: true,
          badge: undefined,
        };
      }
      return feature;
    });
  }, [dashboard.features]);

  return {
    dashboard,
    displayName,
    avatarUrl,
    notifications,
    features,
    // React Query states
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export default useWelcomeDashboard;
