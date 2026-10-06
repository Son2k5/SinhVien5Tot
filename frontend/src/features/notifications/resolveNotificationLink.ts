import type { NotificationResponse } from './types/notification.types';
import type { AppRole } from '../../utils/authorization';

type LinkSource = Pick<NotificationResponse, 'targetType' | 'targetId' | 'applicationId'>;

function isStaff(role: AppRole): boolean {
  return role === 'Admin' || role === 'Mentor';
}

export function notificationsPagePath(role: AppRole): string {
  return isStaff(role) ? '/admin/notifications' : '/dashboard/notifications';
}

export function resolveNotificationLink(notification: LinkSource, role: AppRole): string {
  const id = encodeURIComponent(notification.targetId);
  const applicationId = notification.applicationId
    ? encodeURIComponent(notification.applicationId)
    : null;

  if (isStaff(role)) {
    switch (notification.targetType) {
      case 'Article':
        return `/news/${id}`;
      case 'Campaign':
        return `/admin/campaigns/${id}`;
      case 'Application':
        return `/admin/applications?id=${applicationId ?? id}`;
      case 'Evidence':
        return applicationId ? `/admin/applications?id=${applicationId}` : '/admin/evidence';
      default:
        return '/admin/notifications';
    }
  }

  switch (notification.targetType) {
    case 'Article':
      return `/news/${id}`;
    case 'Campaign':
      return '/dashboard/campaigns';
    case 'Application':
      return `/dashboard/applications/${applicationId ?? id}`;
    case 'Evidence':
      return applicationId ? `/dashboard/applications/${applicationId}` : '/dashboard/applications';
    default:
      return '/dashboard/notifications';
  }
}
