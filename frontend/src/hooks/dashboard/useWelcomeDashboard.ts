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
  const features = dashboard.features;

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
