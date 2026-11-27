import React from 'react';
import { act, cleanup, fireEvent, render } from '@testing-library/react-native';
import { Linking, Platform, View } from 'react-native';

const mockBack = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockSetStringAsync = jest.fn().mockResolvedValue(true);
const mockRefetch = jest.fn().mockResolvedValue(undefined);
const mockSubmitSubmission = jest.fn();
const mockReadDraftImage = jest.fn();

let mockStatusData: any = null;
let mockIsStatusLoading = false;
let mockListData: any = null;
let mockLocationQuery: any = { data: { displayAddress: 'Quận 1, TP.HCM' }, isLoading: false };

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
    replace: mockReplace,
  }),
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: (...args: any[]) => mockSetStringAsync(...args),
}));

jest.mock('@/context/session-provider', () => ({
  useSession: () => ({
    session: { accessToken: 'tok-branch', account: { id: 'usr-1' }, user: { id: 'usr-1' } },
  }),
  useOptionalSession: () => ({
    session: { accessToken: 'tok-branch', account: { id: 'usr-1' }, user: { id: 'usr-1' } },
  }),
}));

jest.mock('@/feature/upload/hooks/use-save-survey-draft', () => ({
  readDraftImage: (...args: any[]) => mockReadDraftImage(...args),
}));

jest.mock('@/feature/upload/hooks/use-reverse-geocode', () => ({
  useReverseGeocode: () => mockLocationQuery,
}));

jest.mock('@/feature/upload/hooks/use-survey-submission', () => ({
  useGetSurveySubmissionStatus: () => ({
    data: mockStatusData,
    isLoading: mockIsStatusLoading,
    refetch: mockRefetch,
  }),
  useGetMySubmissions: () => ({
    data: mockListData,
    refetch: mockRefetch,
  }),
  useSubmitSurveySubmission: () => ({
    mutateAsync: mockSubmitSubmission,
    isPending: false,
  }),
}));

jest.mock('@/feature/navigation/components/navigation-map-view', () => {
  const { View: RNView } = require('react-native');
  return {
    NavigationMapView: (props: any) => <RNView testID="submission-map-view" {...props} />,
  };
});

jest.mock('expo-image', () => {
  const { View: RNView } = require('react-native');
  return {
    Image: (props: any) => <RNView testID="expo-image" {...props} />,
  };
});

jest.mock('@expo/vector-icons', () => {
  const { View: RNView } = require('react-native');
  return {
    MaterialCommunityIcons: (props: any) => (
      <RNView testID={`mc-icon-${props.name}`} {...props} />
    ),
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

describe('SurveySubmissionDetailsScreen branch coverage', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    Platform.OS = 'ios';
    mockStatusData = null;
    mockIsStatusLoading = false;
    mockListData = null;
    mockLocationQuery = { data: { displayAddress: '123 Lê Lợi, Q.1' }, isLoading: false };
    mockReadDraftImage.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    await act(async () => {
      jest.runOnlyPendingTimers();
      cleanup();
    });
    jest.useRealTimers();
  });

  it('covers list fallback lookup, QUEUED/DETECTING/TRACKING/PENDING_CORRECTION/NO_SIGN_DETECTED/PARTIALLY_PROCESSED/PENDING statuses, loading address, and note display', async () => {
    const statuses = [
      'QUEUED',
      'DETECTING',
      'TRACKING',
      'PENDING_CORRECTION',
      'NO_SIGN_DETECTED',
      'PARTIALLY_PROCESSED',
      'PENDING',
    ];

    let screen: any = null;
    for (const status of statuses) {
      mockStatusData = null;
      mockListData = {
        items: [
          {
            id: `sub-${status}`,
            submissionType: 'CUSTOM_UNKNOWN_TYPE',
            status,
            createdAt: '2026-11-01T10:00:00.000Z',
            updatedAt: '2026-11-01T10:01:00.000Z',
            latitude: 10.77,
            longitude: 106.7,
            note: 'Ghi chú hiện trường',
            mediaFiles: [],
          },
        ],
      };
      mockLocationQuery = { data: undefined, isLoading: true };

      if (!screen) {
        screen = await render(
          <SurveySubmissionDetailsScreen submissionId={`sub-${status}`} />,
        );
      } else {
        await screen.rerender(
          <SurveySubmissionDetailsScreen submissionId={`sub-${status}`} />,
        );
      }

      expect(screen.getAllByText('CUSTOM_UNKNOWN_TYPE').length).toBeGreaterThan(0);
      expect(screen.getByText('Đang tra cứu địa chỉ…')).toBeTruthy();
      expect(screen.getByText('Ghi chú hiện trường')).toBeTruthy();
    }
  });

  it('covers missing location fallback, empty displayAddress, copy timeout reset, and map zoom route navigation', async () => {
    mockStatusData = {
      submission: {
        id: 'sub-img-zoom-1234',
        submissionType: 'IMAGE_BATCH',
        status: 'REJECTED',
        failureReason: 'Ảnh mờ',
        createdAt: '2026-11-01T10:00:00.000Z',
        latitude: 10.771,
        longitude: 106.701,
        mediaFiles: [
          { id: 'm1', mediaType: 'IMAGE', fileUrl: 'https://cdn.example.com/1.jpg' },
          { id: 'm2', mediaType: 'IMAGE', fileUrl: 'https://cdn.example.com/2.jpg' },
        ],
      },
    };
    mockLocationQuery = { data: { displayAddress: '' }, isLoading: false };

    const screen = await render(
      <SurveySubmissionDetailsScreen submissionId="sub-img-zoom-1234" />,
    );

    expect(screen.getByText('Không có địa chỉ')).toBeTruthy();
    expect(screen.getByText('Bị từ chối')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Sao chép mã hồ sơ'));
    });
    expect(screen.getByText('Đã sao chép!')).toBeTruthy();

    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Phóng to bản đồ xem trước'));
    });
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        pathname: '/work/new-survey/route-map',
        params: expect.objectContaining({
          title: 'Vị trí khảo sát đã gửi',
          startLat: '10.771',
          startLon: '106.701',
        }),
      }),
    );

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Mở toàn màn hình xem lộ trình'));
    });
    expect(mockPush).toHaveBeenCalledTimes(2);
  });

  it('covers VIDEO_GPX fullscreen route map with endCoords, native Linking video open, and candidate metadata variants', async () => {
    const openUrlSpy = jest.spyOn(Linking, 'openURL').mockResolvedValueOnce(undefined as any);
    mockStatusData = {
      submission: {
        id: 'sub-video-1234',
        submissionType: 'VIDEO_GPX',
        status: 'COMPLETED',
        createdAt: '2026-11-01T10:00:00.000Z',
        latitude: 10.77,
        longitude: 106.7,
        endLatitude: 10.78,
        endLongitude: 106.71,
        mediaFiles: [
          { id: 'v1', mediaType: 'VIDEO', fileUrl: 'https://cdn.example.com/v.mp4', fileName: 'v.mp4' },
          { id: 'g1', mediaType: 'GPX', fileUrl: 'https://cdn.example.com/r.gpx', fileName: 'r.gpx' },
        ],
      },
      mediaFiles: [
        { id: 'v1', mediaType: 'VIDEO', fileUrl: 'https://cdn.example.com/v.mp4', fileName: 'v.mp4' },
        { id: 'g1', mediaType: 'GPX', fileUrl: 'https://cdn.example.com/r.gpx', fileName: 'r.gpx' },
      ],
      candidates: [
        {
          id: 'c1',
          signCode: 'W.201',
          nameVi: 'Chỗ ngoặt nguy hiểm',
          confidenceScore: 88,
          timestampSec: 65,
          status: 'APPROVED',
          cropUrl: 'https://cdn.example.com/c1.jpg',
        },
        {
          id: 'c2',
          signCode: 'P.102',
          confidence: 0.72,
          timestamp_ms: 12000,
          reviewStatus: 'REJECTED',
        },
        {
          id: 'c3',
          predicted_sign_type: { sign_code: 'R.301', name_en: 'Go straight' },
          reviewStatus: 'PENDING',
          bestFrameUrl: 'https://cdn.example.com/c3.jpg',
        },
      ],
    };

    const screen = await render(
      <SurveySubmissionDetailsScreen submissionId="sub-video-1234" />,
    );

    expect(screen.getByText('Chỗ ngoặt nguy hiểm')).toBeTruthy();
    expect(screen.getByText('Độ tin cậy: 88%')).toBeTruthy();
    expect(screen.getByText('Đã duyệt')).toBeTruthy();
    expect(screen.getByText('Từ chối')).toBeTruthy();
    expect(screen.getByText('Chờ duyệt')).toBeTruthy();
    expect(screen.getByText('Thời điểm: 1:05 (65s)')).toBeTruthy();
    expect(screen.getByText('Biển P.102')).toBeTruthy();
    expect(screen.getByText('Go straight')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Phóng to bản đồ xem trước'));
    });
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({
          title: 'Lộ trình khảo sát đã gửi',
          gpxUri: 'https://cdn.example.com/r.gpx',
          endLat: expect.any(String),
          endLon: expect.any(String),
        }),
      }),
    );

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Phát video khảo sát'));
    });
    expect(screen.getByText('Bản ghi video khảo sát')).toBeTruthy();
    openUrlSpy.mockRestore();
  });

  it('covers retry error handling and cancel dismissal inside retry modal', async () => {
    mockStatusData = {
      submission: {
        id: 'sub-fail-err',
        submissionType: 'SINGLE_IMAGE',
        status: 'FAILED',
        failureReason: 'Timeout',
        createdAt: '2026-11-01T10:00:00.000Z',
        mediaFiles: [],
      },
    };
    mockSubmitSubmission.mockRejectedValueOnce(new Error('Server 500'));

    const screen = await render(
      <SurveySubmissionDetailsScreen submissionId="sub-fail-err" />,
    );

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Thử lại gửi hồ sơ'));
    });

    await act(async () => {
      fireEvent.press(screen.getByText('Gửi lại ngay'));
    });
    expect(screen.getByText('Server 500')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByText('Hủy'));
    });
    expect(screen.queryByText('Gửi lại ngay')).toBeNull();
  });
});
