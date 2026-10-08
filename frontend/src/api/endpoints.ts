/**
 * Centralized API endpoints for SV5T system.
 * All endpoint paths are defined here to avoid magic strings.
 */
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/users/me',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_OTP: '/auth/verify-otp',
    SESSION_STATUS: '/auth/session-status',
  },
  STAFF: {
    BASE: '/admin/staff',
    BY_ID: (id: string) => `/admin/staff/${id}`,
    LOCK: (id: string) => `/admin/staff/${id}/lock`,
    UNLOCK: (id: string) => `/admin/staff/${id}/unlock`,
    SEND_INVITATION: (id: string) => `/admin/staff/${id}/send-invitation`,
  },
  STAFF_ME: {
    PROFILE: '/staff/me',
    CHANGE_PASSWORD: '/staff/me/change-password',
    AVATAR: '/staff/me/avatar',
    SESSIONS: '/staff/me/sessions',
    SESSION_BY_ID: (id: string) => `/staff/me/sessions/${id}`,
    AUDIT_LOGS: '/staff/me/audit-logs',
  },
  NOTIFICATIONS: {
    BASE: '/notifications',
    BY_ID: (id: string) => `/notifications/${id}`,
    READ: (id: string) => `/notifications/${id}/read`,
    READ_ALL: '/notifications/read-all',
    UNREAD_COUNT: '/notifications/unread-count',
  },
  NEWS: {
    ARTICLES: '/articles',
    ARTICLE_BY_ID: (id: string) => `/articles/${id}`,
    ADMIN_ARTICLES: '/admin/articles',
    ADMIN_ARTICLE_BY_ID: (id: string) => `/admin/articles/${id}`,
    ADMIN_ARTICLE_STATUS: (id: string, action: 'publish' | 'unpublish' | 'archive' | 'restore') => `/admin/articles/${id}/${action}`,
    UPLOAD_IMAGE: '/admin/articles/images',
  },
  CHAT: {
    CONVERSATIONS: '/chat/conversations',
    CONVERSATION_BY_ID: (id: string) => `/chat/conversations/${id}`,
    MESSAGES: (conversationId: string) => `/chat/conversations/${conversationId}/messages`,
    SUPPORT: '/chat/support',
    READ: (conversationId: string) => `/chat/conversations/${conversationId}/read`,
    UNREAD_TOTAL: '/chat/unread-total',
    SEARCH: '/chat/search',
    SUGGESTED_CONTACTS: '/chat/suggested-contacts',
    BLOCK: (userId: string) => `/chat/blocks/${userId}`,
    USERS: '/chat/users',
  },
  PROFILE: {
    ME: '/profile',
    AVATAR: '/profile/avatar',
  },
  USERS: {
    ME: '/users/me',
    PROFILE: '/users/me/profile',
    AVATAR: '/users/me/avatar',
  },
  WELCOME: '/welcome',
  STUDENT: {
    CAMPAIGNS: '/student/campaigns',
    APPLICATIONS: '/student/applications',
    APPLICATION_BY_ID: (id: string) => `/student/applications/${id}`,
    EVIDENCE: (id: string) => `/student/applications/${id}/evidence`,
    CRITERIA: '/student/criteria',
  },
  ADMIN: {
    DASHBOARD: {
      SUMMARY: '/admin/dashboard/summary',
      KPI: '/admin/dashboard/kpi',
      BOTTLENECKS: '/admin/dashboard/bottlenecks',
      RANKINGS: '/admin/dashboard/rankings',
    },
    APPLICATIONS: {
      BASE: '/admin/applications',
      BY_ID: (id: string) => `/admin/applications/${id}`,
      REVIEW: (id: string) => `/admin/applications/${id}/review`,
      STATUS: (id: string) => `/admin/applications/${id}/status`,
    },
    CAMPAIGNS: {
      BASE: '/admin/campaigns',
      BY_ID: (id: string) => `/admin/campaigns/${id}`,
      STATUS: (id: string) => `/admin/campaigns/${id}/status`,
    },
    STANDARDS: {
      BASE: '/admin/standards',
      BY_ID: (id: string) => `/admin/standards/${id}`,
    },
    CRITERIA: {
      BASE: '/admin/criteria',
      BY_ID: (id: string) => `/admin/criteria/${id}`,
    },
    STUDENTS: {
      BASE: '/admin/students',
      BY_ID: (id: string) => `/admin/students/${id}`,
      STATUS: (id: string) => `/admin/students/${id}/status`,
    },
  },
} as const;
