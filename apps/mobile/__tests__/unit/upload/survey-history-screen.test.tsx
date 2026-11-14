import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockRefetch = jest.fn();

let mockSubmissionsData: any = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 20,
  totalPages: 1,
};
let mockIsLoading = false;
let mockIsFetching = false;
let mockIsRefetching = false;
let mockError: any = null;

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
}));

jest.mock('@/feature/upload/hooks/use-survey-submission', () => ({
  useGetMySubmissions: () => ({
    data: mockSubmissionsData,
    isLoading: mockIsLoading,
    isFetching: mockIsFetching,
    isRefetching: mockIsRefetching,
    error: mockError,
    refetch: mockRefetch,
  }),
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: any) => <View {...props}>{children}</View>,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

jest.mock('@expo/vector-icons/AntDesign', () => {
  const { View } = require('react-native');
  return (props: any) => <View testID={`ant-icon-${props.name}`} {...props} />;
});

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  return {
    MaterialCommunityIcons: (props: any) => <View testID={`mc-icon-${props.name}`} {...props} />,
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
    primary: '#2563EB',
  }),
}));

import { SurveyHistoryScreen } from '@/feature/upload/pages/survey-history-screen';

describe('SurveyHistoryScreen', () => {
  const sampleItems = [
    {
      id: 'sub-comp-1',
      surveyorId: 'user-1',
      submissionType: 'SINGLE_IMAGE',
      status: 'COMPLETED',
      createdAt: '2026-11-01T10:00:00.000Z',
      updatedAt: '2026-11-01T10:05:00.000Z',
      latitude: 10.7769,
      longitude: 106.7009,
    },
    {
      id: 'sub-pending-2',
      surveyorId: 'user-1',
      submissionType: 'VIDEO_GPX',
      status: 'QUEUED',
      createdAt: '2026-11-02T10:00:00.000Z',
      updatedAt: '2026-11-02T10:00:00.000Z',
      latitude: 10.7770,
      longitude: 106.7010,
    },
    {
      id: 'sub-failed-3',
      surveyorId: 'user-1',
      submissionType: 'SINGLE_IMAGE',
      status: 'FAILED',
      createdAt: '2026-11-03T10:00:00.000Z',
      updatedAt: '2026-11-03T10:00:00.000Z',
      latitude: 10.7771,
      longitude: 106.7011,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmissionsData = {
      items: sampleItems,
      total: 3,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    };
    mockIsLoading = false;
    mockIsFetching = false;
    mockIsRefetching = false;
    mockError = null;
  });

  it('renders loading state when isLoading is true', async () => {
    mockIsLoading = true;
    mockSubmissionsData = { items: [], total: 0, page: 1, pageSize: 20, totalPages: 1 };

    const { getByLabelText } = await render(<SurveyHistoryScreen />);
    expect(getByLabelText('Đang tải lịch sử khảo sát')).toBeTruthy();
  });

  it('renders error state and handles retry button', async () => {
    mockError = new Error('Network error');
    mockSubmissionsData = { items: [], total: 0, page: 1, pageSize: 20, totalPages: 1 };

    const { getByText } = await render(<SurveyHistoryScreen />);
    expect(getByText('Không thể tải lịch sử khảo sát của bạn.')).toBeTruthy();

    const retryBtn = getByText('Thử lại');
    await act(async () => {
      fireEvent.press(retryBtn);
    });
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders submissions list in "Tất cả" tab', async () => {
    const { getByText, getAllByText } = await render(<SurveyHistoryScreen />);

    // Header and subtitles
    expect(getByText('Hồ sơ khảo sát')).toBeTruthy();
    expect(getByText('3 hồ sơ · Nhấn vào bản ghi để xem chi tiết')).toBeTruthy();

    // Check items rendered
    expect(getAllByText('Khảo sát hình ảnh').length).toBe(2);
    expect(getByText('Khảo sát Video')).toBeTruthy();
    expect(getAllByText('Đã hoàn tất').length).toBe(2); // Tab and badge
    expect(getByText('Đang chờ xử lý')).toBeTruthy();
    expect(getByText('Thất bại')).toBeTruthy();
  });

  it('filters by "Đang xử lý" tab and "Đã hoàn tất" tab', async () => {
    const { getByText, getAllByText, queryByText } = await render(<SurveyHistoryScreen />);

    // Switch to "Đang xử lý"
    const pendingTab = getByText('Đang xử lý');
    await act(async () => {
      fireEvent.press(pendingTab);
    });

    expect(getByText('Hồ sơ đang xử lý')).toBeTruthy();
    expect(getByText('1 hồ sơ đang xử lý · Nhấn vào bản ghi để xem chi tiết')).toBeTruthy();
    expect(getByText('Khảo sát Video')).toBeTruthy();
    // Only the tab button exists, item status badge is filtered out
    expect(getAllByText('Đã hoàn tất').length).toBe(1);

    // Switch to "Đã hoàn tất"
    const completedTab = getByText('Đã hoàn tất');
    await act(async () => {
      fireEvent.press(completedTab);
    });

    expect(getByText('Lịch sử khảo sát')).toBeTruthy();
    expect(getByText('1 hồ sơ đã hoàn tất · Nhấn vào bản ghi để xem chi tiết')).toBeTruthy();
    expect(queryByText('Đang chờ xử lý')).toBeNull();
  });

  it('navigates to submission details when clicking a submission row', async () => {
    const { getAllByLabelText } = await render(<SurveyHistoryScreen />);

    const rowButtons = getAllByLabelText('View submission details for Khảo sát hình ảnh');
    await act(async () => {
      fireEvent.press(rowButtons[0]);
    });

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/work/survey-submission-details',
      params: { id: 'sub-comp-1' },
    });
  });

  it('navigates back to /work with role surveyor on back button press', async () => {
    const { getByLabelText } = await render(<SurveyHistoryScreen />);

    const backButton = getByLabelText('Quay lại công việc khảo sát');
    await act(async () => {
      fireEvent.press(backButton);
    });

    expect(mockReplace).toHaveBeenCalledWith({
      pathname: '/work',
      params: { currentRole: 'surveyor' },
    });
  });

  it('triggers refetch on reload button press', async () => {
    const { getByLabelText } = await render(<SurveyHistoryScreen />);

    const reloadButton = getByLabelText('Làm mới lịch sử khảo sát');
    await act(async () => {
      fireEvent.press(reloadButton);
    });

    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders pagination buttons and handles page changes when totalPages > 1', async () => {
    mockSubmissionsData = {
      items: sampleItems,
      total: 6,
      page: 1,
      pageSize: 3,
      totalPages: 2,
    };

    const { getByText } = await render(<SurveyHistoryScreen />);
    expect(getByText('1 / 2')).toBeTruthy();

    const nextBtn = getByText('Sau');
    await act(async () => {
      fireEvent.press(nextBtn);
    });
    // Triggers internal page state update
  });
});
