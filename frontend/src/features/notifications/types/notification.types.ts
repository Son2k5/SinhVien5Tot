export type NotificationType =
  | 'ArticlePublished'
  | 'CampaignPublished'
  | 'ApplicationSubmitted'
  | 'EvidenceReviewed'
  | 'ApplicationDecided'
  | 'ApplicationWithdrawn';

export type NotificationTargetType = 'Article' | 'Campaign' | 'Application' | 'Evidence';

export interface NotificationResponse {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  targetType: NotificationTargetType;
  targetId: string;
  applicationId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  items: NotificationResponse[];
  nextCursor: string | null;
}

export interface UnreadCountResponse {
  count: number;
}

export interface ListNotificationsParams {
  cursor?: string | null;
  pageSize?: number;
  unreadOnly?: boolean;
}
