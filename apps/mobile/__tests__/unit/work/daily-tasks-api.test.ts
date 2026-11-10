import {
  getDailyTasks,
  getMyTaskCompletions,
  getMyMissionsProgress,
  claimDailyTaskReward,
} from '@/api/daily-tasks/daily-tasks';
import * as apiClient from '@/api/api-client';

jest.mock('@/api/api-client', () => ({
  apiRequest: jest.fn(),
  jsonApiRequest: jest.fn(),
}));

describe('Daily Tasks API Module', () => {
  const mockToken = 'mock-bearer-token-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDailyTasks', () => {
    it('calls GET /daily-tasks with auth token and signal', async () => {
      const mockTasks = [
        {
          id: 1,
          taskName: 'Xác thực 5 biển báo',
          rewardCredits: 50,
          targetCount: 5,
        },
      ];
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce(mockTasks);

      const controller = new AbortController();
      const result = await getDailyTasks(mockToken, controller.signal);

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/daily-tasks',
        { signal: controller.signal },
        mockToken,
      );
      expect(result).toEqual(mockTasks);
    });
  });

  describe('getMyTaskCompletions', () => {
    it('calls GET /daily-tasks/completions/me with encoded date query param', async () => {
      const mockCompletions = [
        {
          id: 101,
          taskId: 1,
          progress: 5,
          isCompleted: true,
          isClaimed: false,
          completionDate: '2026-11-07',
        },
      ];
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce(mockCompletions);

      const result = await getMyTaskCompletions('2026-11-07', mockToken);

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/daily-tasks/completions/me?date=2026-11-07',
        { signal: undefined },
        mockToken,
      );
      expect(result).toEqual(mockCompletions);
    });
  });

  describe('getMyMissionsProgress', () => {
    it('calls GET /daily-tasks/missions/me to fetch streak, daily and weekly goals', async () => {
      const mockProgress = {
        streakDays: 7,
        dailyTasksCompleted: 3,
        dailyTasksTotal: 4,
        weeklyTasksCompleted: 10,
        weeklyTasksTotal: 15,
        streakBadge: '🔥 Siêu thám tử 7 ngày',
      };
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce(mockProgress);

      const result = await getMyMissionsProgress(mockToken);

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/daily-tasks/missions/me',
        { signal: undefined },
        mockToken,
      );
      expect(result).toEqual(mockProgress);
    });
  });

  describe('claimDailyTaskReward', () => {
    it('calls POST /daily-tasks/:id/claim with taskId and token', async () => {
      const mockClaimResponse = {
        success: true,
        creditsAwarded: 50,
        message: 'Nhận thưởng 50 Credits thành công!',
      };
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce(mockClaimResponse);

      const result = await claimDailyTaskReward(42, mockToken);

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/daily-tasks/42/claim',
        {
          method: 'POST',
          signal: undefined,
        },
        mockToken,
      );
      expect(result).toEqual(mockClaimResponse);
    });
  });
});
