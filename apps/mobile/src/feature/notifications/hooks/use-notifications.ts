import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useOptionalSession } from '@/context/session-provider';
import { UNAUTHENTICATED_MESSAGE } from '@/constants/message';
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/api/notifications/notifications';
import type { NotificationItem, NotificationListResponse } from '@/types/notificationType';

export const notificationKeys = {
  all: (userId?: string) => ['notifications', userId] as const,
  unreadCount: (userId?: string) => ['notifications', 'unread-count', userId] as const,
  list: (userId?: string, page = 1) => ['notifications', 'list', userId, page] as const,
};

/**
 * Hook to retrieve unread notification count for the badge on the map screen.
 */
export function useGetUnreadNotificationCount(enabled = true) {
  const session = useOptionalSession()?.session;
  const userId = session?.account.id;

  return useQuery<number>({
    queryKey: notificationKeys.unreadCount(userId),
    queryFn: session
      ? ({ signal }) => getUnreadNotificationCount(session.accessToken, signal)
      : skipToken,
    enabled: enabled && Boolean(session),
    staleTime: 15_000,
  });
}

/**
 * Hook to retrieve the list of notifications.
 */
export function useGetNotifications(page = 1, pageSize = 20, enabled = true) {
  const session = useOptionalSession()?.session;
  const userId = session?.account.id;

  return useQuery<NotificationListResponse>({
    queryKey: notificationKeys.list(userId, page),
    queryFn: session
      ? ({ signal }) => getNotifications(session.accessToken, page, pageSize, signal)
      : skipToken,
    enabled: enabled && Boolean(session),
    staleTime: 10_000,
  });
}

/**
 * Hook to mark a specific notification as read.
 */
export function useMarkNotificationAsRead() {
  const session = useOptionalSession()?.session;
  const queryClient = useQueryClient();
  const userId = session?.account.id;

  return useMutation<NotificationItem, Error, string>({
    mutationFn: (notificationId: string) => {
      if (!session) throw new Error(UNAUTHENTICATED_MESSAGE);
      return markNotificationAsRead(notificationId, session.accessToken);
    },
    onSuccess: (updatedItem) => {
      // Invalidate count and list
      queryClient.invalidateQueries({ queryKey: notificationKeys.all(userId) });
    },
  });
}

/**
 * Hook to mark all notifications as read.
 */
export function useMarkAllNotificationsAsRead() {
  const session = useOptionalSession()?.session;
  const queryClient = useQueryClient();
  const userId = session?.account.id;

  return useMutation<{ updated: boolean }, Error, void>({
    mutationFn: () => {
      if (!session) throw new Error(UNAUTHENTICATED_MESSAGE);
      return markAllNotificationsAsRead(session.accessToken);
    },
    onSuccess: () => {
      queryClient.setQueryData(notificationKeys.unreadCount(userId), 0);
      queryClient.invalidateQueries({ queryKey: notificationKeys.all(userId) });
    },
  });
}
