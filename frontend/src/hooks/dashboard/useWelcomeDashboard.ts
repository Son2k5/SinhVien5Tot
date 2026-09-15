import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { welcomeService } from '../../services/welcomeService';
import { createMockWelcomeDashboard } from '../../mocks/welcomeContent';
import type { User } from '../../types/auth';

/**
 * Lấy dữ liệu Welcome Dashboard từ server.
 * Fallback về mock data khi chưa có dữ liệu thực.
 * Được dùng chung bởi HomePage và UserProfilePage (khử trùng lặp).
 */
export function useWelcomeDashboard(user: User) {
  const query = useQuery({
    queryKey: ['welcome-dashboard', user.id],
    queryFn: welcomeService.getDashboard,
  });

  const dashboard = useMemo(
    () => query.data ?? createMockWelcomeDashboard(user),
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
