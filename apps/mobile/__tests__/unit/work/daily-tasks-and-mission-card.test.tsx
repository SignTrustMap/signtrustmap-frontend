import React from 'react';
import { render, fireEvent, renderHook, waitFor, act, cleanup } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  return {
    MaterialCommunityIcons: (props: any) => <View testID={`mc-icon-${props.name}`} {...props} />,
  };
});

jest.mock('@/context/session-provider', () => ({
  useSession: () => ({
    session: {
      accessToken: 'test-token',
      account: { id: 'user-worker-1' },
    },
  }),
}));

const mockClaimMutation = jest.fn().mockResolvedValue({ success: true, rewardCredits: 10 });

jest.mock('@/api/daily-tasks/daily-tasks', () => ({
  getDailyTasks: jest.fn().mockResolvedValue([
    { id: 1, taskCode: 'SURVEY_1', name: 'Khảo sát 1', activityType: 'SURVEY' },
  ]),
  getMyTaskCompletions: jest.fn().mockResolvedValue([
    { id: 'c-1', dailyTaskId: 1, progress: 1, isCompleted: true, claimed: false },
  ]),
  getMyMissionsProgress: jest.fn().mockResolvedValue({ streak: 5, missions: [] }),
  claimDailyTaskReward: (...args: any[]) => mockClaimMutation(...args),
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    backgroundElement: '#F8FAFC',
    backgroundSelected: '#EFF6FF',
    border: '#E2E8F0',
    primary: '#2563EB',
    text: '#0F172A',
    textSecondary: '#475569',
  }),
}));

import {
  dailyTaskKeys,
  isTaskForRole,
  getFallbackMissionsForRole,
  useGetDailyTasks,
  useGetMyTaskCompletions,
  useGetMyMissions,
  useClaimDailyTaskReward,
} from '@/feature/work/hooks/use-daily-tasks';
import { MissionCardItem } from '@/feature/work/components/mission-card-item';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('Daily Tasks Hooks and MissionCardItem', () => {
  afterEach(async () => {
    cleanup();
    jest.clearAllMocks();
  });

  describe('isTaskForRole & getFallbackMissionsForRole', () => {
    it('correctly matches daily tasks to surveyor, reviewer, and driver roles', () => {
      expect(isTaskForRole({ activityType: 'SURVEY_SUBMISSION' } as any, 'surveyor')).toBe(true);
      expect(isTaskForRole({ taskCode: 'REVIEW_CANDIDATE' } as any, 'reviewer')).toBe(true);
      expect(isTaskForRole({ activityType: 'NAVIGATION_SESSION' } as any, 'driver')).toBe(true);
      expect(isTaskForRole({ taskCode: 'GENERIC_TASK' } as any, 'driver')).toBe(false);
    });

    it('returns seeded fallback missions for all roles', () => {
      const surveyorMissions = getFallbackMissionsForRole('surveyor');
      expect(surveyorMissions).toHaveLength(2);

      const reviewerMissions = getFallbackMissionsForRole('reviewer');
      expect(reviewerMissions).toHaveLength(2);

      const driverMissions = getFallbackMissionsForRole('driver');
      expect(driverMissions).toHaveLength(2);
    });

    it('generates daily task keys correctly', () => {
      expect(dailyTaskKeys.all('u1')).toEqual(['daily-tasks', 'u1']);
      expect(dailyTaskKeys.list('u1')).toEqual(['daily-tasks', 'u1', 'list']);
      expect(dailyTaskKeys.completions('u1', '2026-11-07')).toEqual([
        'daily-tasks',
        'u1',
        'completions',
        '2026-11-07',
      ]);
    });
  });

  describe('use-daily-tasks queries and claim mutation', () => {
    it('fetches tasks, completions, missions, and claims reward', async () => {
      const wrapper = createWrapper();

      const { result: tasksRes } = await renderHook(() => useGetDailyTasks(), { wrapper });
      await waitFor(() => expect(tasksRes.current.isSuccess).toBe(true));
      expect(tasksRes.current.data).toHaveLength(1);

      const { result: compRes } = await renderHook(() => useGetMyTaskCompletions('2026-11-07'), {
        wrapper,
      });
      await waitFor(() => expect(compRes.current.isSuccess).toBe(true));

      const { result: misRes } = await renderHook(() => useGetMyMissions(), { wrapper });
      await waitFor(() => expect(misRes.current.isSuccess).toBe(true));

      const { result: claimRes } = await renderHook(() => useClaimDailyTaskReward(), { wrapper });
      await act(async () => {
        await claimRes.current.mutateAsync(1);
      });
      await waitFor(() => expect(claimRes.current.isSuccess).toBe(true));
    });
  });

  describe('MissionCardItem Component', () => {
    const mockCompletion = {
      id: 'comp-10',
      dailyTaskId: 101,
      userId: 'u-1',
      progress: 1,
      isCompleted: true,
      claimed: false,
      claimedAt: null,
      completionDate: '2026-11-07',
      createdAt: '2026-11-07',
      updatedAt: '2026-11-07',
      dailyTask: {
        id: 101,
        taskCode: 'SURVEY_RUN_1',
        name: 'Nộp 1 phiên khảo sát video thực địa',
        description: 'Khảo sát camera',
        targetCount: 1,
        rewardCredits: 25,
        activityType: 'SURVEY_SUBMISSION',
        isActive: true,
        createdAt: '2026-11-07',
        updatedAt: '2026-11-07',
      },
    };

    it('renders task name, progress, and claims completed reward', async () => {
      const wrapper = createWrapper();
      const { getByText, getAllByText } = await render(
        <MissionCardItem completion={mockCompletion as any} role="surveyor" />,
        { wrapper }
      );

      expect(getByText('Nộp 1 phiên khảo sát video thực địa')).toBeTruthy();
      expect(getAllByText(/\+.*25.*Credits/).length).toBeGreaterThan(0);

      const claimBtn = getByText(/Nhận thưởng/);
      await act(async () => {
        fireEvent.press(claimBtn);
      });

      expect(mockClaimMutation).toHaveBeenCalledWith(101, 'test-token');
    });

    it('navigates to corresponding action screen when task is not finished', async () => {
      const unfinishedCompletion = {
        ...mockCompletion,
        isCompleted: false,
        progress: 0,
      };

      const wrapper = createWrapper();
      const { getByText } = await render(
        <MissionCardItem completion={unfinishedCompletion as any} role="surveyor" />,
        { wrapper }
      );

      const startBtn = getByText('Làm ngay');
      fireEvent.press(startBtn);

      expect(mockPush).toHaveBeenCalledWith('/work/new-survey');
    });
  });
});
