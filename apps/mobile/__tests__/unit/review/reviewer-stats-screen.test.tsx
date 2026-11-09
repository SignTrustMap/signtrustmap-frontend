import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { ReviewerStatsScreen } from '@/feature/review/pages/reviewer-stats-screen';
import {
  useGetMyReviewHistory,
  useGetMyReviewerStats,
} from '@/feature/review/hooks/use-review';

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/feature/review/hooks/use-review', () => ({
  useGetMyReviewerStats: jest.fn(),
  useGetMyReviewHistory: jest.fn(),
}));

jest.mock('@/hooks/use-back-button', () => ({
  useBackButton: jest.fn(),
}));

jest.mock('@/hooks/use-work-route', () => ({
  useWorkRoute: jest.fn((defaultRoute) => defaultRoute),
}));

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return {
    Image: (props: any) => <View testID="mock-expo-image" {...props} />,
  };
});

describe('ReviewerStatsScreen Unit Test Suite', () => {
  const mockReplace = jest.fn();
  const mockPush = jest.fn();
  const mockRefetchStats = jest.fn().mockResolvedValue(undefined);
  const mockRefetchHistory = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      replace: mockReplace,
      push: mockPush,
    });
  });

  const sampleStats = {
    reliabilityScore: 0.95,
    accuracyRate: 0.92,
    totalReviews: 120,
    approved: 100,
    rejected: 20,
    currentStreak: 5,
  };

  const sampleHistory = {
    items: [
      {
        id: 'rev-1',
        candidateId: 'cand-1',
        vote: 1,
        createdAt: '2026-03-01T10:00:00Z',
        candidate: {
          signCropUrl: 'https://cdn.example.com/p102.png',
          predictedSignType: {
            nameVi: 'Cấm đi ngược chiều',
            signCode: 'P.102',
          },
        },
      },
      {
        id: 'rev-2',
        candidateId: 'cand-2',
        vote: -1,
        createdAt: '2026-03-01T11:00:00Z',
        candidate: {
          signCropUrl: 'https://cdn.example.com/w201.png',
          predictedSignType: {
            nameVi: 'Đường cong nguy hiểm',
            signCode: 'W.201',
          },
        },
      },
    ],
    total: 2,
    totalPages: 1,
    page: 1,
  };

  it('renders loading state when stats are fetching initially', async () => {
    (useGetMyReviewerStats as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: true,
      refetch: mockRefetchStats,
    });
    (useGetMyReviewHistory as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      isFetching: true,
      refetch: mockRefetchHistory,
    });

    const { getByRole, queryByText } = await render(<ReviewerStatsScreen />);

    expect(getByRole('header')).toBeTruthy();
    // Stats content should not be present while loading
    expect(queryByText('Điểm tín nhiệm')).toBeNull();
  });

  it('renders error state and allows retrying when stats query fails', async () => {
    (useGetMyReviewerStats as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      error: new Error('Network error'),
      refetch: mockRefetchStats,
    });
    (useGetMyReviewHistory as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      refetch: mockRefetchHistory,
    });

    const { getByText } = await render(<ReviewerStatsScreen />);

    expect(getByText('Không thể tải dữ liệu thống kê')).toBeTruthy();
    expect(getByText('Vui lòng kiểm tra kết nối mạng và thử lại.')).toBeTruthy();

    const retryBtn = getByText('Thử lại');
    fireEvent.press(retryBtn);

    expect(mockRefetchStats).toHaveBeenCalled();
    expect(mockRefetchHistory).toHaveBeenCalled();
  });

  it('renders stats hero banner, reliability score, tier, and streak badge', async () => {
    (useGetMyReviewerStats as jest.Mock).mockReturnValue({
      data: sampleStats,
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: mockRefetchStats,
    });
    (useGetMyReviewHistory as jest.Mock).mockReturnValue({
      data: sampleHistory,
      isLoading: false,
      isFetching: false,
      refetch: mockRefetchHistory,
    });

    const { getByText } = await render(<ReviewerStatsScreen />);

    // Tier calculation: >= 90% is 'Thẩm định viên cao cấp'
    expect(getByText('Thẩm định viên cao cấp')).toBeTruthy();
    expect(getByText('95%')).toBeTruthy();
    expect(getByText('Độ tin cậy')).toBeTruthy();
    expect(getByText('Chuỗi 5 phiếu chính xác liên tiếp')).toBeTruthy();

    // 4 Key metrics
    expect(getByText('120')).toBeTruthy(); // Total reviews
    expect(getByText('92%')).toBeTruthy(); // Accuracy rate
    expect(getByText('100')).toBeTruthy(); // Approved
    expect(getByText('20')).toBeTruthy(); // Rejected
  });

  it('renders tier "Thẩm định viên tin cậy" when score is between 75% and 89%', async () => {
    (useGetMyReviewerStats as jest.Mock).mockReturnValue({
      data: { ...sampleStats, reliabilityScore: 0.82 },
      isLoading: false,
      isFetching: false,
      error: null,
      refetch: mockRefetchStats,
    });
    (useGetMyReviewHistory as jest.Mock).mockReturnValue({
      data: sampleHistory,
      isLoading: false,
      isFetching: false,
      refetch: mockRefetchHistory,
    });

    const { getByText } = await render(<ReviewerStatsScreen />);

    expect(getByText('Thẩm định viên tin cậy')).toBeTruthy();
    expect(getByText('82%')).toBeTruthy();
  });

  it('navigates to submission review when "Tiếp tục thẩm định hồ sơ" button is clicked', async () => {
    (useGetMyReviewerStats as jest.Mock).mockReturnValue({
      data: sampleStats,
      isLoading: false,
      isFetching: false,
      refetch: mockRefetchStats,
    });
    (useGetMyReviewHistory as jest.Mock).mockReturnValue({
      data: sampleHistory,
      isLoading: false,
      isFetching: false,
      refetch: mockRefetchHistory,
    });

    const { getByText } = await render(<ReviewerStatsScreen />);

    const startReviewBtn = getByText('Tiếp tục thẩm định hồ sơ');
    fireEvent.press(startReviewBtn);

    expect(mockPush).toHaveBeenCalledWith('/work/submission-review');
  });

  it('navigates back to reviewer work panel when back button is pressed', async () => {
    (useGetMyReviewerStats as jest.Mock).mockReturnValue({
      data: sampleStats,
      isLoading: false,
      isFetching: false,
      refetch: mockRefetchStats,
    });
    (useGetMyReviewHistory as jest.Mock).mockReturnValue({
      data: sampleHistory,
      isLoading: false,
      isFetching: false,
      refetch: mockRefetchHistory,
    });

    const { getByLabelText } = await render(<ReviewerStatsScreen />);

    const backBtn = getByLabelText('Quay lại danh mục công việc thẩm định');
    fireEvent.press(backBtn);

    expect(mockReplace).toHaveBeenCalledWith('/work');
  });

  it('filters history list when switching tabs (all, approved, rejected)', async () => {
    (useGetMyReviewerStats as jest.Mock).mockReturnValue({
      data: sampleStats,
      isLoading: false,
      isFetching: false,
      refetch: mockRefetchStats,
    });
    (useGetMyReviewHistory as jest.Mock).mockReturnValue({
      data: sampleHistory,
      isLoading: false,
      isFetching: false,
      refetch: mockRefetchHistory,
    });

    const { getByText, queryByText, getAllByRole } = await render(<ReviewerStatsScreen />);

    // Initially 'all' tab -> both items visible
    expect(getByText('Cấm đi ngược chiều')).toBeTruthy();
    expect(getByText('Đường cong nguy hiểm')).toBeTruthy();

    const tabs = getAllByRole('tab');

    // Switch to 'Đồng ý' tab (index 1)
    await act(async () => {
      fireEvent.press(tabs[1]);
    });

    expect(getByText('Cấm đi ngược chiều')).toBeTruthy();
    expect(queryByText('Đường cong nguy hiểm')).toBeNull();

    // Switch to 'Từ chối' tab (index 2)
    await act(async () => {
      fireEvent.press(tabs[2]);
    });

    expect(queryByText('Cấm đi ngược chiều')).toBeNull();
    expect(getByText('Đường cong nguy hiểm')).toBeTruthy();
  });

  it('renders date filter and sort controls for sign history and supports sorting', async () => {
    (useGetMyReviewerStats as jest.Mock).mockReturnValue({
      data: sampleStats,
      isLoading: false,
      isFetching: false,
      refetch: mockRefetchStats,
    });
    (useGetMyReviewHistory as jest.Mock).mockReturnValue({
      data: sampleHistory,
      isLoading: false,
      isFetching: false,
      refetch: mockRefetchHistory,
    });

    const { getByText, getByLabelText } = await render(<ReviewerStatsScreen />);

    // Date filter header and controls in history section
    expect(getByText('Lọc theo ngày biểu quyết')).toBeTruthy();
    expect(getByLabelText('Chọn Từ ngày')).toBeTruthy();
    expect(getByLabelText('Chọn Đến ngày')).toBeTruthy();

    // Toggle sort order
    expect(getByText('Mới nhất')).toBeTruthy();
    const sortBtn = getByLabelText('Sắp xếp ngày: Mới nhất');
    fireEvent.press(sortBtn);

    await waitFor(() => {
      expect(getByText('Cũ nhất')).toBeTruthy();
    });
  });
});
