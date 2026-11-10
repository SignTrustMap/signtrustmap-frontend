import {
  getUnreadNotificationCount,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/api/notifications/notifications';
import * as apiClient from '@/api/api-client';

jest.mock('@/api/api-client', () => ({
  apiRequest: jest.fn(),
}));

describe('Notifications API Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUnreadNotificationCount', () => {
    it('fetches unread count and returns number', async () => {
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce({ unreadCount: 5 });

      const count = await getUnreadNotificationCount('token-123');

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/notifications/unread-count',
        { signal: undefined },
        'token-123',
      );
      expect(count).toBe(5);
    });

    it('returns 0 gracefully when network request fails', async () => {
      (apiClient.apiRequest as jest.Mock).mockRejectedValueOnce(new Error('Network offline'));

      const count = await getUnreadNotificationCount('token-123');

      expect(count).toBe(0);
    });
  });

  describe('getNotifications', () => {
    it('fetches paginated notifications list with query params', async () => {
      const mockList = {
        items: [{ id: 'notif-1', title: 'Thưởng 50 Credits' }],
        total: 1,
        page: 2,
        pageSize: 10,
      };
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce(mockList);

      const res = await getNotifications('token-123', 2, 10);

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/notifications?page=2&pageSize=10',
        { signal: undefined },
        'token-123',
      );
      expect(res).toEqual(mockList);
    });
  });

  describe('markNotificationAsRead', () => {
    it('sends PATCH request to mark single notification as read', async () => {
      const mockUpdated = { id: 'notif-1', isRead: true };
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce(mockUpdated);

      const res = await markNotificationAsRead('notif 1', 'token-123');

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/notifications/notif%201/read',
        { method: 'PATCH' },
        'token-123',
      );
      expect(res).toEqual(mockUpdated);
    });
  });

  describe('markAllNotificationsAsRead', () => {
    it('sends PATCH request to mark all unread notifications as read', async () => {
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce({ updated: true });

      const res = await markAllNotificationsAsRead('token-123');

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/notifications/read-all',
        { method: 'PATCH' },
        'token-123',
      );
      expect(res.updated).toBe(true);
    });
  });
});
