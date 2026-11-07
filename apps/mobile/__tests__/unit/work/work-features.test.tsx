import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockBack = jest.fn();
const mockPush = jest.fn();
let mockParams: Record<string, any> = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
  }),
  useLocalSearchParams: () => mockParams,
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: any) => <View {...props}>{children}</View>,
  };
});

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  return {
    MaterialCommunityIcons: (props: any) => <View testID={`mc-icon-${props.name}`} {...props} />,
  };
});

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return {
    Image: (props: any) => <View testID="expo-image" {...props} />,
  };
});

let mockCompletions: any = [];
let mockMissionsData: any = { dailyStreak: 5 };
jest.mock('@/feature/work/hooks/use-daily-tasks', () => ({
  useGetMyTaskCompletions: () => ({ data: mockCompletions, isLoading: false }),
  useGetMyMissions: () => ({ data: mockMissionsData, isLoading: false }),
  useClaimDailyTaskReward: () => ({ mutateAsync: jest.fn(), isPending: false }),
  isTaskForRole: (task: any, role: string) => task?.targetRole === role,
  getFallbackMissionsForRole: (role: string) => [
    {
      id: `fallback-${role}-1`,
      dailyTaskId: `task-${role}-1`,
      dailyTask: {
        id: `task-${role}-1`,
        name: `Nhiệm vụ mẫu cho ${role}`,
        description: 'Mô tả nhiệm vụ mẫu',
        rewardPoints: 50,
        targetRole: role,
        targetCount: 1,
      },
      currentCount: 0,
      targetCount: 1,
      isCompleted: false,
      claimed: false,
    },
  ],
}));

let mockRecapturesData: any = null;
let mockIsLoadingRecaptures = false;
let mockMutateRecapture = jest.fn().mockResolvedValue({ success: true });

jest.mock('@/feature/review/hooks/use-recapture', () => ({
  useGetMyRecaptures: () => ({
    data: mockRecapturesData,
    isLoading: mockIsLoadingRecaptures,
    refetch: jest.fn(),
    isRefetching: false,
  }),
  useSubmitRecaptureMutation: () => ({
    mutateAsync: mockMutateRecapture,
    isPending: false,
  }),
}));

jest.mock('@/feature/navigation/utils/gps', () => ({
  fetchFreshGpsPosition: jest.fn().mockResolvedValue([106.7009, 10.7769]),
}));

jest.mock('@/feature/navigation/utils/geo', () => ({
  calculateDistanceMeters: () => 25,
}));

jest.mock('@/feature/upload/utils/image-gps', () => ({
  extractImageGpsCoordinates: jest.fn().mockResolvedValue({ latitude: 10.7769, longitude: 106.7009 }),
}));

jest.mock('@/feature/upload/utils/image-file-gps', () => ({
  extractGpsFromImageFile: jest.fn().mockResolvedValue(null),
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
    neutral: '#F1F5F9',
  }),
}));

import { WorkMissionsSection } from '@/feature/work/components/work-missions-section';
import { RecordedSignsScreen } from '@/feature/work/pages/recorded-signs-screen';
import { RecapturesScreen } from '@/feature/work/pages/recaptures-screen';
import { RecaptureCameraScreen } from '@/feature/work/pages/recapture-camera-screen';

describe('Work Feature Components and Pages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = {};
    mockCompletions = [];
    mockMissionsData = { dailyStreak: 5 };
    mockRecapturesData = null;
    mockIsLoadingRecaptures = false;
  });

  describe('WorkMissionsSection', () => {
    it('renders missions with fallback data when completions are empty', async () => {
      const { getByText } = await render(<WorkMissionsSection role="surveyor" />);
      expect(getByText('Nhiệm vụ hôm nay')).toBeTruthy();
      expect(getByText('Chuỗi 5 ngày')).toBeTruthy();
      expect(getByText('Nhiệm vụ mẫu cho surveyor')).toBeTruthy();
    });

    it('toggles collapse and expand when header is clicked', async () => {
      const { getByLabelText, queryByText, getByText } = await render(
        <WorkMissionsSection role="surveyor" />
      );

      const headerButton = getByLabelText('Thu gọn hoặc mở rộng danh sách nhiệm vụ hôm nay');
      expect(getByText('Nhiệm vụ mẫu cho surveyor')).toBeTruthy();

      // Collapse
      await act(async () => {
        fireEvent.press(headerButton);
      });
      expect(queryByText('Nhiệm vụ mẫu cho surveyor')).toBeNull();

      // Expand again
      await act(async () => {
        fireEvent.press(headerButton);
      });
      expect(getByText('Nhiệm vụ mẫu cho surveyor')).toBeTruthy();
    });
  });

  describe('RecordedSignsScreen', () => {
    it('renders list of recorded signs and handles back and submit buttons', async () => {
      const { getByText, getByLabelText } = await render(<RecordedSignsScreen />);
      expect(getByText('Biển báo đã ghi nhận')).toBeTruthy();
      expect(getByText('Biển Dừng lại (P.122)')).toBeTruthy();
      expect(getByText('Biển Cấm đi ngược chiều (P.102)')).toBeTruthy();

      const backBtn = getByLabelText('Quay lại');
      await act(async () => {
        fireEvent.press(backBtn);
      });
      expect(mockBack).toHaveBeenCalled();

      const submitBtn = getByText('Gửi ngay');
      await act(async () => {
        fireEvent.press(submitBtn);
      });
      expect(mockBack).toHaveBeenCalledTimes(2);
    });
  });

  describe('RecapturesScreen', () => {
    it('shows loading indicator when isLoading is true', async () => {
      mockIsLoadingRecaptures = true;
      const { getByTestId } = await render(<RecapturesScreen />);
      expect(getByTestId('mc-icon-arrow-left')).toBeTruthy();
    });

    it('shows empty state when no recaptures exist', async () => {
      mockRecapturesData = { items: [], total: 0 };
      const { getByText } = await render(<RecapturesScreen />);
      expect(getByText('Không có yêu cầu chụp lại nào')).toBeTruthy();
    });

    it('renders recapture items and navigates to recapture camera', async () => {
      mockRecapturesData = {
        items: [
          {
            request_id: 'req-1',
            candidate_id: 'cand-1',
            reason: 'BLURRY',
            note: 'Ảnh bị nhòe biển báo',
            sign_crop_url: 'thumbnail.jpg',
            best_frame_url: 'frame.jpg',
            latitude: 10.7769,
            longitude: 106.7009,
          },
        ],
        total: 1,
      };

      const { getByText } = await render(<RecapturesScreen />);
      expect(getByText('Yêu cầu chụp lại')).toBeTruthy();
      expect(getByText('Ảnh mờ hoặc rung tay')).toBeTruthy();

      const captureBtn = getByText('Chụp lại ngay');
      await act(async () => {
        fireEvent.press(captureBtn);
      });

      expect(mockPush).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/work/recapture-camera',
          params: expect.objectContaining({
            candidateId: 'cand-1',
            reason: 'BLURRY',
          }),
        })
      );
    });
  });

  describe('RecaptureCameraScreen', () => {
    it('renders candidate details and back navigation', async () => {
      mockParams = {
        candidateId: 'cand-1',
        reason: 'BLURRY',
        note: 'Ảnh chụp rung tay cần nét hơn',
        targetLat: '10.7769',
        targetLon: '106.7009',
        oldSignCropUrl: 'https://example.com/sign.jpg',
      };

      const { getByText, getByLabelText } = await render(<RecaptureCameraScreen />);
      expect(getByText('Yêu cầu chụp lại')).toBeTruthy();
      expect(getByText('Ảnh mờ, rung tay')).toBeTruthy();
      expect(getByText('Hồ sơ #cand-1')).toBeTruthy();

      const backBtn = getByLabelText('Quay lại danh sách chụp lại');
      await act(async () => {
        fireEvent.press(backBtn);
      });
      expect(mockBack).toHaveBeenCalled();
    });
  });
});
