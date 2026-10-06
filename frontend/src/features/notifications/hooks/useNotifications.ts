import axios from 'axios';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import { notificationService } from '../services/notification.service';
import type {
  NotificationListResponse,
  UnreadCountResponse,
} from '../types/notification.types';

export const NOTIFICATION_PAGE_SIZE = 20;

export const NOTIFICATION_QUERY_KEYS = {
  all: ['notifications'] as const,
  lists: ['notifications', 'list'] as const,
  list: (unreadOnly: boolean) => ['notifications', 'list', { unreadOnly }] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
};

type ListCache = InfiniteData<NotificationListResponse, string | null>;
type ListSnapshot = Array<[QueryKey, ListCache | undefined]>;

interface OptimisticContext {
  previousCount: UnreadCountResponse | undefined;
  previousLists: ListSnapshot;
}

const UNREAD_POLL_MS = 60_000;
const RATE_LIMITED_POLL_MS = 5 * 60_000;

function isRateLimited(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 429;
}

function patchListsRead(queryClient: QueryClient, shouldMark: (id: string) => boolean): void {
  queryClient.setQueriesData<ListCache>({ queryKey: NOTIFICATION_QUERY_KEYS.lists }, (data) => {
    if (!data) return data;
    return {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        items: page.items.map((item) =>
          !item.isRead && shouldMark(item.id) ? { ...item, isRead: true } : item,
        ),
      })),
    };
  });
}

async function snapshot(queryClient: QueryClient): Promise<OptimisticContext> {
  await queryClient.cancelQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
  return {
    previousCount: queryClient.getQueryData<UnreadCountResponse>(NOTIFICATION_QUERY_KEYS.unreadCount),
    previousLists: queryClient.getQueriesData<ListCache>({ queryKey: NOTIFICATION_QUERY_KEYS.lists }),
  };
}

function rollback(queryClient: QueryClient, context: OptimisticContext | undefined): void {
  if (!context) return;
  queryClient.setQueryData(NOTIFICATION_QUERY_KEYS.unreadCount, context.previousCount);
  for (const [key, data] of context.previousLists) {
    queryClient.setQueryData(key, data);
  }
}

export function useUnreadCount(enabled = true) {
  return useQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.unreadCount,
    queryFn: ({ signal }) => notificationService.unreadCount(signal),
    enabled,
    staleTime: 30_000,
    refetchInterval: (query) =>
      isRateLimited(query.state.error) ? RATE_LIMITED_POLL_MS : UNREAD_POLL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: false,
  });
}

export function useNotificationList(unreadOnly: boolean) {
  return useInfiniteQuery({
    queryKey: NOTIFICATION_QUERY_KEYS.list(unreadOnly),
    queryFn: ({ pageParam, signal }) =>
      notificationService.list(
        { cursor: pageParam, pageSize: NOTIFICATION_PAGE_SIZE, unreadOnly },
        signal,
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
    retry: (failureCount, error) => !isRateLimited(error) && failureCount < 1,
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, string, OptimisticContext>({
    mutationFn: (id) => notificationService.markRead(id),
    onMutate: async (id) => {
      const context = await snapshot(queryClient);
      queryClient.setQueryData<UnreadCountResponse>(NOTIFICATION_QUERY_KEYS.unreadCount, (current) =>
        current ? { count: Math.max(0, current.count - 1) } : current,
      );
      patchListsRead(queryClient, (itemId) => itemId === id);
      return context;
    },
    onError: (_error, _id, context) => rollback(queryClient, context),
    onSettled: () => queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all }),
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, void, OptimisticContext>({
    mutationFn: () => notificationService.markAllRead(),
    onMutate: async () => {
      const context = await snapshot(queryClient);
      queryClient.setQueryData<UnreadCountResponse>(NOTIFICATION_QUERY_KEYS.unreadCount, { count: 0 });
      patchListsRead(queryClient, () => true);
      return context;
    },
    onError: (_error, _vars, context) => rollback(queryClient, context),
    onSettled: () => queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all }),
  });
}
