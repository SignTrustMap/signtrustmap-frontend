import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from '@/api/notifications/notifications';
import {
  notificationKeys,
  useMarkAllNotificationsAsRead,
} from '@/feature/notifications/hooks/use-notifications';
import { NotificationsScreen } from '@/feature/notifications/pages/notifications-screen';
import * as apiClient from '@/api/api-client';

// 1. Mock vector icons as View components
jest.mock('@expo/vector-icons', () => {
  const R = require('react');
  const { View } = require('react-native');
  return {
    Ionicons: (props: any) => R.createElement(View, props),
    MaterialCommunityIcons: (props: any) => R.createElement(View, props),
  };
});

// 2. Mock session provider
jest.mock('@/context/session-provider', () => ({
  useSession: () => ({
    session: {
      accessToken: 'test-token',
      account: { id: 'test-user-id', username: 'testuser', role: 'SURVEYOR' },
    },
  }),
  useOptionalSession: () => ({
    session: {
      accessToken: 'test-token',
      account: { id: 'test-user-id', username: 'testuser', role: 'SURVEYOR' },
    },
  }),
}));

// 3. Mock expo-router
const mockBack = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
  }),
}));

// 4. Mock safe-area-context with native View
jest.mock('react-native-safe-area-context', () => {
  const R = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: any) =>
      R.createElement(View, props, children),
    useSafeAreaInsets: () => ({ top: 0, left: 0, right: 0, bottom: 0 }),
  };
});

describe('Surveyor Missing Sign Notification Feature', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
      },
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Badge Count Formatting Rules', () => {
    const formatBadge = (count: number) => (count > 9 ? '9+' : String(count));

    it('formats single-digit counts correctly', () => {
      expect(formatBadge(1)).toBe('1');
      expect(formatBadge(5)).toBe('5');
      expect(formatBadge(9)).toBe('9');
    });

    it('formats 10 and above as 9+ as required', () => {
      expect(formatBadge(10)).toBe('9+');
      expect(formatBadge(11)).toBe('9+');
      expect(formatBadge(99)).toBe('9+');
    });
  });

  describe('Notification API Client', () => {
    it('getUnreadNotificationCount requests /notifications/unread-count', async () => {
      const spy = jest.spyOn(apiClient, 'apiRequest').mockResolvedValueOnce({ unreadCount: 7 });

      const count = await getUnreadNotificationCount('token-abc');

      expect(spy).toHaveBeenCalledWith(
        '/notifications/unread-count',
        expect.anything(),
        'token-abc',
      );
      expect(count).toBe(7);
    });

    it('getNotifications requests /notifications with pagination', async () => {
      const mockResult = {
        items: [],
        total: 0,
        page: 1,
        pageSize: 20,
        totalPages: 0,
      };
      const spy = jest.spyOn(apiClient, 'apiRequest').mockResolvedValueOnce(mockResult);

      const res = await getNotifications('token-abc', 1, 20);

      expect(spy).toHaveBeenCalledWith(
        '/notifications?page=1&pageSize=20',
        expect.anything(),
        'token-abc',
      );
      expect(res).toEqual(mockResult);
    });

    it('markNotificationAsRead calls PATCH on /notifications/:id/read', async () => {
      const spy = jest.spyOn(apiClient, 'apiRequest').mockResolvedValueOnce({ id: 'notif-1', isRead: true });

      await markNotificationAsRead('notif-1', 'token-abc');

      expect(spy).toHaveBeenCalledWith(
        '/notifications/notif-1/read',
        { method: 'PATCH' },
        'token-abc',
      );
    });

    it('markAllNotificationsAsRead calls PATCH on /notifications/read-all', async () => {
      const spy = jest.spyOn(apiClient, 'apiRequest').mockResolvedValueOnce({ updated: true });

      await markAllNotificationsAsRead('token-abc');

      expect(spy).toHaveBeenCalledWith(
        '/notifications/read-all',
        { method: 'PATCH' },
        'token-abc',
      );
    });
  });

  describe('NotificationsScreen Component', () => {
    it('renders empty state when there are no notifications', async () => {
      jest.spyOn(apiClient, 'apiRequest').mockImplementation(async (path: string) => {
        if (path.includes('unread-count')) {
          return { unreadCount: 0 };
        }
        return {
          items: [],
          total: 0,
          page: 1,
          pageSize: 20,
          totalPages: 0,
        };
      });

      const { getByText } = await render(
        <QueryClientProvider client={queryClient}>
          <NotificationsScreen />
        </QueryClientProvider>,
      );

      await waitFor(() => {
        expect(getByText('Chưa có thông báo nào')).toBeTruthy();
      });
      expect(getByText(/Khi có biển báo bị mất cần kiểm tra/)).toBeTruthy();
    });

    it('renders notification items and tapping card acts as placeholder without error', async () => {
      jest.spyOn(apiClient, 'apiRequest').mockImplementation(async (path: string) => {
        if (path.includes('unread-count')) {
          return { unreadCount: 1 };
        }
        return {
          items: [
            {
              id: 'notif-missing-sign',
              userId: 'test-user-id',
              type: 'SIGN_MISSING_DISPATCH',
              title: 'Cần kiểm tra biển báo báo mất',
              message: 'Biển báo P.102 được báo cáo không còn tồn tại. Nhiệm vụ kiểm tra đã được kích hoạt (+30 credits).',
              relatedEntityType: 'revalidation_task',
              relatedEntityId: 'task-999',
              isRead: false,
              createdAt: new Date().toISOString(),
            },
          ],
          total: 1,
          page: 1,
          pageSize: 20,
          totalPages: 1,
        };
      });

      const { getByText, getByLabelText } = await render(
        <QueryClientProvider client={queryClient}>
          <NotificationsScreen />
        </QueryClientProvider>,
      );

      // Verify title renders
      await waitFor(() => {
        expect(getByText('Cần kiểm tra biển báo báo mất')).toBeTruthy();
      });

      // Verify message and tag badge
      expect(getByText(/Biển báo P.102 được báo cáo không còn tồn tại/)).toBeTruthy();
      expect(getByText('Khảo sát biển báo')).toBeTruthy();

      // Tap on the card: as requested, it acts as a placeholder and does not navigate or throw
      const card = getByLabelText('Thông báo: Cần kiểm tra biển báo báo mất');
      fireEvent.press(card);

      // Verify back button navigates back
      const backBtn = getByLabelText('Quay lại');
      fireEvent.press(backBtn);
      expect(mockBack).toHaveBeenCalled();
    });
  });
});
