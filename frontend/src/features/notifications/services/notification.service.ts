import { axiosClient } from '../../../api/axiosClient';
import { ENDPOINTS } from '../../../api/endpoints';
import type {
  ListNotificationsParams,
  NotificationListResponse,
  UnreadCountResponse,
} from '../types/notification.types';

export const notificationService = {
  async list(params: ListNotificationsParams, signal?: AbortSignal): Promise<NotificationListResponse> {
    const response = await axiosClient.get<NotificationListResponse>(ENDPOINTS.NOTIFICATIONS.BASE, {
      params: {
        cursor: params.cursor ?? undefined,
        pageSize: params.pageSize,
        unreadOnly: params.unreadOnly || undefined,
      },
      signal,
    });
    return response.data;
  },

  async unreadCount(signal?: AbortSignal): Promise<UnreadCountResponse> {
    const response = await axiosClient.get<UnreadCountResponse>(ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT, { signal });
    return response.data;
  },

  async markRead(id: string): Promise<void> {
    await axiosClient.post(ENDPOINTS.NOTIFICATIONS.READ(encodeURIComponent(id)));
  },

  async markAllRead(): Promise<void> {
    await axiosClient.post(ENDPOINTS.NOTIFICATIONS.READ_ALL);
  },
};

export default notificationService;
