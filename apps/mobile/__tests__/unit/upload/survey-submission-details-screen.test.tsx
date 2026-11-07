import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockBack = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockRefetch = jest.fn();
const mockSubmitSubmission = jest.fn();
const mockSetStringAsync = jest.fn().mockResolvedValue(true);

let mockStatusData: any = null;
let mockIsStatusLoading = false;
let mockListData: any = null;

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
    replace: mockReplace,
  }),
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: (text: string) => mockSetStringAsync(text),
}));

jest.mock('@/context/session-provider', () => ({
  useSession: () => ({
    session: { user: { id: 'usr-1', name: 'Surveyor John' } },
  }),
}));

jest.mock('@/feature/upload/hooks/use-save-survey-draft', () => ({
  readDraftImage: jest.fn().mockResolvedValue(null),
}));

jest.mock('@/feature/upload/hooks/use-reverse-geocode', () => ({
  useReverseGeocode: () => ({
    data: { displayAddress: '123 Nguyen Hue, Quan 1, TP.HCM' },
    isLoading: false,
  }),
}));

jest.mock('@/feature/upload/hooks/use-survey-submission', () => ({
  useGetSurveySubmissionStatus: () => ({
    data: mockStatusData,
    isLoading: mockIsStatusLoading,
    isRefetching: false,
    refetch: mockRefetch,
  }),
  useGetMySubmissions: () => ({
    data: mockListData,
  }),
  useSubmitSurveySubmission: () => ({
    mutateAsync: mockSubmitSubmission,
  }),
}));

jest.mock('@/feature/navigation/components/navigation-map-view', () => {
  const { View } = require('react-native');
  return {
    NavigationMapView: (props: any) => <View testID="navigation-map-view" {...props} />,
  };
});

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return {
    Image: (props: any) => <View testID="expo-image" {...props} />,
  };
});

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
    placeholder: '#94A3B8',
    primary: '#2563EB',
    neutral: '#F1F5F9',
  }),
}));

import { SurveySubmissionDetailsScreen } from '@/feature/upload/pages/survey-submission-details-screen';

describe('SurveySubmissionDetailsScreen', () => {
  const sampleCompletedSubmission = {
    id: 'sub-comp-1234567890',
    surveyorId: 'usr-1',
    submissionType: 'SINGLE_IMAGE',
    status: 'COMPLETED',
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:05:00.000Z',
    latitude: 10.7769,
    longitude: 106.7009,
    detectedSignCount: 2,
    totalCandidatesExtracted: 2,
    mediaFiles: [
      {
        id: 'med-1',
        mediaType: 'IMAGE',
        fileUrl: 's3://bucket/test.jpg',
      },
    ],
  };

  const sampleFailedSubmission = {
    id: 'sub-failed-1234567890',
    surveyorId: 'usr-1',
    submissionType: 'VIDEO_GPX',
    status: 'FAILED',
    failureReason: 'Tập tin GPX không khớp thời gian với video',
    createdAt: '2026-11-02T10:00:00.000Z',
    updatedAt: '2026-11-02T10:05:00.000Z',
    latitude: 10.7770,
    longitude: 106.7010,
    mediaFiles: [],
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockStatusData = null;
    mockIsStatusLoading = false;
    mockListData = null;
  });

  afterEach(async () => {
    await act(async () => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('renders loading state when status is loading and no submission exists', async () => {
    mockIsStatusLoading = true;
    const { getByText } = await render(
      <SurveySubmissionDetailsScreen submissionId="loading-id" />
    );
    expect(getByText('Đang tải chi tiết hồ sơ…')).toBeTruthy();
  });

  it('renders empty not-found state and allows navigating back to history', async () => {
    const { getByText } = await render(
      <SurveySubmissionDetailsScreen submissionId="non-existent" />
    );
    expect(getByText('Không tìm thấy hồ sơ')).toBeTruthy();

    const historyBtn = getByText('Đi tới Lịch sử khảo sát');
    await act(async () => {
      fireEvent.press(historyBtn);
    });
    expect(mockReplace).toHaveBeenCalledWith('/work/survey-history');
  });

  it('renders completed submission details correctly', async () => {
    mockStatusData = {
      submission: sampleCompletedSubmission,
      mediaFiles: sampleCompletedSubmission.mediaFiles,
    };

    const { getByText, getByLabelText } = await render(
      <SurveySubmissionDetailsScreen submissionId="sub-comp-1234567890" />
    );

    // Title & subtitle
    expect(getByText('Chi tiết hồ sơ khảo sát')).toBeTruthy();
    expect(getByText('#sub-comp-1')).toBeTruthy();
    expect(getByText('Đã hoàn tất')).toBeTruthy();

    // Back button
    const backBtn = getByLabelText('Quay lại');
    await act(async () => {
      fireEvent.press(backBtn);
    });
    expect(mockBack).toHaveBeenCalled();
  });

  it('triggers refetch on refresh button press', async () => {
    mockStatusData = {
      submission: sampleCompletedSubmission,
    };

    const { getByLabelText } = await render(
      <SurveySubmissionDetailsScreen submissionId="sub-comp-1234567890" />
    );

    const refreshBtn = getByLabelText('Làm mới dữ liệu hồ sơ');
    await act(async () => {
      fireEvent.press(refreshBtn);
    });
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('handles retry modal and direct resubmit for failed submission', async () => {
    mockStatusData = {
      submission: sampleFailedSubmission,
    };
    mockSubmitSubmission.mockResolvedValueOnce({ success: true });

    const { getByLabelText, getByText, getAllByText } = await render(
      <SurveySubmissionDetailsScreen submissionId="sub-failed-1234567890" />
    );

    expect(getByText('Xử lý thất bại')).toBeTruthy();

    // Open retry modal
    const retryHeaderBtn = getByLabelText('Thử lại gửi hồ sơ');
    await act(async () => {
      fireEvent.press(retryHeaderBtn);
    });

    // Check modal contents
    expect(getAllByText('Gửi lại khảo sát').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('Lý do thất bại:').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('Tập tin GPX không khớp thời gian với video').length).toBeGreaterThanOrEqual(1);

    // Click direct resubmit
    const resubmitBtn = getByText('Gửi lại ngay');
    await act(async () => {
      fireEvent.press(resubmitBtn);
    });

    expect(mockSubmitSubmission).toHaveBeenCalledWith({
      submissionId: 'sub-failed-1234567890',
    });
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('handles edit and resubmit navigation from retry modal', async () => {
    mockStatusData = {
      submission: sampleFailedSubmission,
    };

    const { getByLabelText, getByText, getAllByText } = await render(
      <SurveySubmissionDetailsScreen submissionId="sub-failed-1234567890" />
    );

    // Open retry modal
    const retryHeaderBtn = getByLabelText('Thử lại gửi hồ sơ');
    await act(async () => {
      fireEvent.press(retryHeaderBtn);
    });

    // Click edit & resubmit
    const editBtn = getByText('Chỉnh sửa chi tiết & Gửi lại');
    await act(async () => {
      fireEvent.press(editBtn);
    });

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/work/new-survey/details',
      params: {
        submissionId: 'sub-failed-1234567890',
        startLat: '10.777',
        startLon: '106.701',
      },
    });
  });
});
