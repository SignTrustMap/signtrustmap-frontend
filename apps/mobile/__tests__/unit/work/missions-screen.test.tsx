import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { MissionsScreen } from '@/feature/work/pages/missions-screen';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockBack = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
  }),
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    MaterialCommunityIcons: (props: any) =>
      React.createElement(View, { testID: `icon-${props.name}`, ...props }),
  };
});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: any) => React.createElement(View, props, children),
  };
});

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    backgroundElement: '#F8FAFC',
    backgroundSelected: '#EFF6FF',
    border: '#E2E8F0',
    text: '#0F172A',
    textSecondary: '#475569',
    placeholder: '#94A3B8',
    primary: '#2563EB',
    onPrimary: '#FFFFFF',
    surface: '#FFFFFF',
    neutral: '#F1F5F9',
    grey: '#64748B',
  }),
}));

const mockRefetchCompletions = jest.fn();
const mockRefetchDailyTasks = jest.fn();
const mockRefetchMissions = jest.fn();

let mockMissionsData: any = {
  dailyStreak: 3,
  daily: {
    missions: [
      {
        code: 'GLOBAL_LEVEL_5',
        title: 'Đạt cấp độ 5',
        description: 'Tích lũy 500 điểm kinh nghiệm',
        rewardCredits: 50,
        progress: 200,
        target: 500,
        completed: false,
        rewardGranted: false,
      },
    ],
  },
  weekly: {
    title: 'Tuần lễ khảo sát',
    description: 'Khảo sát 20 tuyến đường trong tuần',
    bonusCredits: 100,
    completedMissions: 12,
    target: 20,
    completed: false,
    bonusGranted: false,
  },
};

let mockCompletionsData: any = [
  {
    id: 'completion-1',
    dailyTaskId: 'task-driver-1',
    isCompleted: false,
    progress: 1,
    claimed: false,
    dailyTask: {
      id: 'task-driver-1',
      name: 'Di chuyển 5km',
      description: 'Lái xe và bật điều hướng tối thiểu 5km',
      rewardAmount: 10,
      rewardType: 'CREDIT',
      target: 5,
      role: 'driver',
    },
  },
  {
    id: 'completion-2',
    dailyTaskId: 'task-surveyor-1',
    isCompleted: true,
    progress: 3,
    claimed: false,
    dailyTask: {
      id: 'task-surveyor-1',
      name: 'Ghi nhận 3 biển báo',
      description: 'Chụp và tải lên 3 biển báo mới',
      rewardAmount: 20,
      rewardType: 'CREDIT',
      target: 3,
      role: 'surveyor',
    },
  },
];

let mockDailyTasksData: any = [
  {
    id: 'task-driver-1',
    name: 'Di chuyển 5km',
    description: 'Lái xe và bật điều hướng tối thiểu 5km',
    rewardAmount: 10,
    rewardType: 'CREDIT',
    target: 5,
    role: 'driver',
  },
  {
    id: 'task-surveyor-1',
    name: 'Ghi nhận 3 biển báo',
    description: 'Chụp và tải lên 3 biển báo mới',
    rewardAmount: 20,
    rewardType: 'CREDIT',
    target: 3,
    role: 'surveyor',
  },
];

jest.mock('@/feature/work/hooks/use-daily-tasks', () => ({
  useGetMyTaskCompletions: () => ({
    data: mockCompletionsData,
    isLoading: false,
    refetch: mockRefetchCompletions,
    isRefetching: false,
  }),
  useGetDailyTasks: () => ({
    data: mockDailyTasksData,
    isLoading: false,
    refetch: mockRefetchDailyTasks,
    isRefetching: false,
  }),
  useGetMyMissions: () => ({
    data: mockMissionsData,
    isLoading: false,
    refetch: mockRefetchMissions,
    isRefetching: false,
  }),
  useClaimDailyTaskReward: () => ({
    mutate: jest.fn(),
    isPending: false,
  }),
  useClaimMissionReward: () => ({
    mutate: jest.fn(),
    isPending: false,
  }),
  isTaskForRole: (task: any, role: string) => {
    if (!task) return true;
    const taskRole = (task.role || '').toLowerCase();
    return taskRole === role.toLowerCase() || taskRole === 'all' || !taskRole;
  },
  getFallbackMissionsForRole: () => [],
}));

describe('MissionsScreen Unit Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMissionsData = {
      dailyStreak: 3,
      daily: {
        missions: [
          {
            code: 'GLOBAL_LEVEL_5',
            title: 'Đạt cấp độ 5',
            description: 'Tích lũy 500 điểm kinh nghiệm',
            rewardCredits: 50,
            progress: 200,
            target: 500,
            completed: false,
            rewardGranted: false,
          },
        ],
      },
      weekly: {
        title: 'Tuần lễ khảo sát',
        description: 'Khảo sát 20 tuyến đường trong tuần',
        bonusCredits: 100,
        completedMissions: 12,
        target: 20,
        completed: false,
        bonusGranted: false,
      },
    };
  });

  describe('1. Streak Display & 7-Day Tracker', () => {
    it('renders active streak count correctly', async () => {
      const { getByText } = await render(<MissionsScreen initialRole="driver" />);

      expect(getByText('Chuỗi 3 ngày')).toBeTruthy();
      expect(getByText(/Đóng góp mỗi ngày để duy trì ngọn lửa/)).toBeTruthy();
    });

    it('renders zero streak encouragement banner when streak is 0', async () => {
      mockMissionsData = { ...mockMissionsData, dailyStreak: 0 };
      const { getByText } = await render(<MissionsScreen initialRole="driver" />);

      expect(getByText('Bắt đầu chuỗi ngày đóng góp của bạn ngay!')).toBeTruthy();
    });

    it('renders milestone message when streak is 7 or more days', async () => {
      mockMissionsData = { ...mockMissionsData, dailyStreak: 7 };
      const { getByText } = await render(<MissionsScreen initialRole="driver" />);

      expect(getByText('Chuỗi 7 ngày')).toBeTruthy();
      expect(getByText(/Bạn đã đạt mốc 7 ngày liên tiếp!/)).toBeTruthy();
    });

    it('renders all 7 day labels in tracker row', async () => {
      const { getByText } = await render(<MissionsScreen initialRole="driver" />);

      ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].forEach((day) => {
        expect(getByText(day)).toBeTruthy();
      });
    });
  });

  describe('2. Tab Switching (Daily, Weekly, Global)', () => {
    it('defaults to Daily tab and shows daily tasks for driver', async () => {
      const { getByText } = await render(<MissionsScreen initialRole="driver" />);

      expect(getByText('Di chuyển 5km')).toBeTruthy();
      expect(getByText('Nhiệm vụ làm mới vào 00:00 mỗi ngày.')).toBeTruthy();
    });

    it('switches to Weekly tab when tab is pressed', async () => {
      const { getByLabelText, getByText } = await render(<MissionsScreen initialRole="driver" />);

      fireEvent.press(getByLabelText('Tab Hàng tuần'));

      await waitFor(() => {
        expect(getByText('Tuần lễ khảo sát')).toBeTruthy();
        expect(getByText('Nhiệm vụ hàng tuần đặt lại vào thứ Hai lúc 00:00 (UTC+7).')).toBeTruthy();
      });
    });

    it('switches to Global tab when tab is pressed', async () => {
      const { getByLabelText, getByText } = await render(<MissionsScreen initialRole="driver" />);

      fireEvent.press(getByLabelText('Tab Chung'));

      await waitFor(() => {
        expect(getByText('Đạt cấp độ 5')).toBeTruthy();
        expect(getByText('Nhiệm vụ toàn hệ thống.')).toBeTruthy();
      });
    });
  });

  describe('3. Role Filter Integration', () => {
    it('renders surveyor tasks when initialRole is surveyor', async () => {
      const { getByText } = await render(<MissionsScreen initialRole="surveyor" />);

      expect(getByText('Ghi nhận 3 biển báo')).toBeTruthy();
    });
  });

  describe('4. Navigation', () => {
    it('navigates back when pressing back button', async () => {
      const { getByLabelText } = await render(<MissionsScreen initialRole="driver" />);

      fireEvent.press(getByLabelText('Quay lại trang Công việc'));
      expect(mockBack).toHaveBeenCalled();
    });
  });
});
