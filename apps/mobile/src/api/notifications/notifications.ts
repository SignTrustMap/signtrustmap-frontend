import { API_PATHS } from '@/api/api';
import { apiRequest } from '@/api/api-client';
import type {
  NotificationItem,
  NotificationListResponse,
  UnreadCountResponse,
} from '@/types/notificationType';

/**
 * Fetch the current number of unread notifications for the authenticated user.
 */
export async function getUnreadNotificationCount(
  accessToken: string,
  signal?: AbortSignal,
): Promise<number> {
  try {
    const res = await apiRequest<UnreadCountResponse>(
      API_PATHS.NOTIFICATIONS_UNREAD_COUNT,
      { signal },
      accessToken,
    );
    return res?.unreadCount ?? 0;
  } catch (error) {
    console.warn('[Notifications] Failed to fetch unread count:', error);
    return 0;
  }
}

/**
 * Fetch a paginated list of notifications for the authenticated user.
 */
export async function getNotifications(
  accessToken: string,
  page = 1,
  pageSize = 20,
  signal?: AbortSignal,
): Promise<NotificationListResponse> {
  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  return apiRequest<NotificationListResponse>(
    `${API_PATHS.NOTIFICATIONS}?${query.toString()}`,
    { signal },
    accessToken,
  );
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationAsRead(
  notificationId: string,
  accessToken: string,
): Promise<NotificationItem> {
  return apiRequest<NotificationItem>(
    `${API_PATHS.NOTIFICATIONS}/${encodeURIComponent(notificationId)}/read`,
    { method: 'PATCH' },
    accessToken,
  );
}

/**
 * Mark all unread notifications as read.
 */
export async function markAllNotificationsAsRead(
  accessToken: string,
): Promise<{ updated: boolean }> {
  return apiRequest<{ updated: boolean }>(
    API_PATHS.NOTIFICATIONS_READ_ALL,
    { method: 'PATCH' },
    accessToken,
  );
}
