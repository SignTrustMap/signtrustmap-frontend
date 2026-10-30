import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
let mockSearchParams: Record<string, string | undefined> = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    canGoBack: () => true,
  }),
  useLocalSearchParams: () => mockSearchParams,
  useSegments: () => ['(authenticated)', '(tabs)', 'work', 'new-survey'],
  useFocusEffect: (cb: any) => cb(),
}));

jest.mock('expo-blob', () => ({
  Blob: class MockBlob {},
}));

jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Image: (props: any) => React.createElement(View, { testID: 'expo-image', ...props }),
  };
});

jest.mock('@expo/vector-icons/AntDesign', () => 'AntDesign');
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
  AntDesign: 'AntDesign',
}));

jest.mock('expo-symbols', () => ({
  SymbolView: 'SymbolView',
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: any) => React.createElement(View, props, children),
    useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
  };
});

jest.mock('@/context/session-provider', () => ({
  useSession: () => ({
    session: {
      account: { id: 'user-123' },
      accessToken: 'test-token',
    },
  }),
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    backgroundElement: '#F8FAFC',
    backgroundSelected: '#EFF6FF',
    border: '#E2E8F0',
    text: '#0F172A',
    textSecondary: '#64748B',
    placeholder: '#94A3B8',
    primary: '#0671EB',
    onPrimary: '#FFFFFF',
    neutral: '#F1F5F9',
  }),
}));

let mockSubmissionStatusData: any = null;
jest.mock('@/feature/upload/hooks/use-survey-submission', () => ({
  useGetSurveySubmissionStatus: () => ({
    data: mockSubmissionStatusData,
    isLoading: false,
    refetch: jest.fn(),
  }),
  useSaveSurveyDraft: () => ({
    mutateAsync: jest.fn(),
  }),
  useUpdateSurveySubmission: () => ({
    mutateAsync: jest.fn(),
  }),
  useSubmitSurveySubmission: () => ({
    mutateAsync: jest.fn(),
  }),
}));

jest.mock('@/feature/upload/hooks/use-save-survey-draft', () => ({
  useSaveSurveyDraft: () => ({
    mutateAsync: jest.fn(),
  }),
  readDraftImage: jest.fn().mockResolvedValue({
    uri: 'file:///cache/video.mp4',
    fileName: 'video.mp4',
    mimeType: 'video/mp4',
    gpxUri: 'file:///cache/track.gpx',
    gpxName: 'track.gpx',
    startLat: 10.7769,
    startLon: 106.7009,
  }),
  updateDraftCoordinates: jest.fn(),
}));

let mockLocationPickerVisible = false;
jest.mock('@/feature/upload/components/location-picker-modal', () => ({
  LocationPickerModal: (props: any) => {
    mockLocationPickerVisible = props.visible;
    const { View, Text } = require('react-native');
    return props.visible ? (
      <View testID="mock-location-picker-modal">
        <Text>Location Picker Modal Open</Text>
      </View>
    ) : null;
  },
}));

jest.mock('@/feature/upload/utils/gpx', () => ({
  extractGpxGpsData: jest.fn().mockResolvedValue({
    coordinates: [
      [106.7009, 10.7769],
      [106.7050, 10.7810],
    ],
    firstPoint: { latitude: 10.7769, longitude: 106.7009 },
    lastPoint: { latitude: 10.7810, longitude: 106.7050 },
  }),
}));

jest.mock('@/feature/upload/hooks/use-reverse-geocode', () => ({
  useReverseGeocode: () => ({
    data: { displayAddress: 'Nguyen Hue, District 1', roadName: 'Nguyen Hue' },
    isLoading: false,
  }),
}));

let lastMapProps: any = {};
jest.mock('@/feature/navigation/components/navigation-map-view', () => ({
  NavigationMapView: (props: any) => {
    lastMapProps = props;
    const { View, Text } = require('react-native');
    return (
      <View testID="mock-preview-map">
        <Text testID="map-preview-has-route">
          {props.routeCoordinates ? 'has-route' : 'no-route'}
        </Text>
        {props.locationPin ? (
          <Text testID="map-preview-location-pin">
            {`${props.locationPin[0]},${props.locationPin[1]}`}
          </Text>
        ) : null}
      </View>
    );
  },
}));

import { SurveyRecordDetailsScreen } from '@/feature/upload/pages/survey-record-details-screen';

describe('SurveyRecordDetailsScreen - Map Zoom Behavior for Video with GPX vs Image', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    lastMapProps = {};
    mockLocationPickerVisible = false;
    mockSearchParams = {};
  });

  it('navigates to /work/new-survey/route-map when clicking zoom button for video with GPX', async () => {
    mockSearchParams = {
      submissionId: 'sub-video-123',
      gpxUri: 'file:///cache/track.gpx',
      gpxName: 'track.gpx',
      startLat: '10.7769',
      startLon: '106.7009',
      duration: '60',
    };

    mockSubmissionStatusData = {
      submission: {
        id: 'sub-video-123',
        status: 'DRAFT',
        submissionType: 'VIDEO_GPX',
        latitude: 10.7769,
        longitude: 106.7009,
        capturedAt: '2026-03-01T10:00:00.000Z',
      },
      mediaFiles: [
        { media_type: 'VIDEO', file_url: 'file:///cache/video.mp4' },
        { media_type: 'GPX', file_url: 'file:///cache/track.gpx' },
      ],
      sessions: [],
    };

    const { getByLabelText } = await render(<SurveyRecordDetailsScreen />);

    await waitFor(() => {
      expect(getByLabelText('Phóng to bản đồ xem trước')).toBeTruthy();
    });

    const zoomBtn = getByLabelText('Phóng to bản đồ xem trước');
    fireEvent.press(zoomBtn);

    // Verify it navigates to the dedicated route-map screen with route params
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/work/new-survey/route-map',
      params: expect.objectContaining({
        gpxUri: 'file:///cache/track.gpx',
        startLat: '10.7769',
        startLon: '106.7009',
        title: 'track.gpx',
      }),
    });

    // Verify LocationPickerModal was NOT opened
    expect(mockLocationPickerVisible).toBe(false);
    expect(lastMapProps.locationPin).toBeUndefined();
  });

  it('opens LocationPickerModal when clicking zoom button for a single image submission and passes locationPin to map', async () => {
    mockSearchParams = {
      submissionId: 'sub-image-456',
    };

    mockSubmissionStatusData = {
      submission: {
        id: 'sub-image-456',
        status: 'DRAFT',
        submissionType: 'SINGLE_IMAGE',
        latitude: 10.7769,
        longitude: 106.7009,
        capturedAt: '2026-03-01T10:00:00.000Z',
      },
      mediaFiles: [
        { media_type: 'IMAGE', file_url: 'file:///cache/sign.jpg' },
      ],
      sessions: [],
    };

    const { readDraftImage } = require('@/feature/upload/hooks/use-save-survey-draft');
    readDraftImage.mockResolvedValueOnce({
      uri: 'file:///cache/sign.jpg',
      fileName: 'sign.jpg',
      mimeType: 'image/jpeg',
      startLat: 10.7769,
      startLon: 106.7009,
    });

    const { getByLabelText, getByTestId } = await render(<SurveyRecordDetailsScreen />);

    await waitFor(() => {
      expect(getByLabelText('Phóng to bản đồ xem trước')).toBeTruthy();
      expect(lastMapProps.locationPin).toEqual([106.7009, 10.7769]);
      expect(lastMapProps.showFocusPin).toBe(true);
      expect(getByTestId('map-preview-location-pin')).toHaveTextContent('106.7009,10.7769');
    });

    const zoomBtn = getByLabelText('Phóng to bản đồ xem trước');
    fireEvent.press(zoomBtn);

    // For image submission, it opens LocationPickerModal so the user can adjust the single GPS coordinate
    expect(mockPush).not.toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/work/new-survey/route-map' }),
    );

    await waitFor(() => {
      expect(mockLocationPickerVisible).toBe(true);
      expect(getByTestId('mock-location-picker-modal')).toBeTruthy();
    });
  });

  describe('Submit Button State based on Captured Date Validation', () => {
    it('disables submit button and shows error message when captured date is older than 30 days', async () => {
      mockSearchParams = { submissionId: 'sub-old-date' };
      const oldDate = new Date(Date.now() - 35 * 86400 * 1000).toISOString();
      mockSubmissionStatusData = {
        submission: {
          id: 'sub-old-date',
          status: 'DRAFT',
          submissionType: 'SINGLE_IMAGE',
          latitude: 10.7769,
          longitude: 106.7009,
          capturedAt: oldDate,
        },
        mediaFiles: [{ media_type: 'IMAGE', file_url: 'file:///cache/sign.jpg' }],
        sessions: [],
      };

      const { readDraftImage } = require('@/feature/upload/hooks/use-save-survey-draft');
      readDraftImage.mockResolvedValueOnce({
        uri: 'file:///cache/sign.jpg',
        fileName: 'sign.jpg',
        mimeType: 'image/jpeg',
        startLat: 10.7769,
        startLon: 106.7009,
      });

      const { getByText } = await render(<SurveyRecordDetailsScreen />);

      await waitFor(() => {
        expect(
          getByText('Thời gian ghi nhận không được quá 30 ngày so với hiện tại.'),
        ).toBeTruthy();
      });

      const submitText = getByText('Gửi hồ sơ');
      // The parent element is the Pressable AppButton
      const submitButton = submitText.parent;
      expect(submitButton?.props.accessibilityState?.disabled).toBe(true);
    });

    it('enables submit button when captured date is valid within 30 days', async () => {
      mockSearchParams = { submissionId: 'sub-valid-date' };
      const validDate = new Date(Date.now() - 2 * 86400 * 1000).toISOString();
      mockSubmissionStatusData = {
        submission: {
          id: 'sub-valid-date',
          status: 'DRAFT',
          submissionType: 'SINGLE_IMAGE',
          latitude: 10.7769,
          longitude: 106.7009,
          capturedAt: validDate,
        },
        mediaFiles: [{ media_type: 'IMAGE', file_url: 'file:///cache/sign.jpg' }],
        sessions: [],
      };

      const { readDraftImage } = require('@/feature/upload/hooks/use-save-survey-draft');
      readDraftImage.mockResolvedValueOnce({
        uri: 'file:///cache/sign.jpg',
        fileName: 'sign.jpg',
        mimeType: 'image/jpeg',
        startLat: 10.7769,
        startLon: 106.7009,
      });

      const { getByText, queryByText } = await render(<SurveyRecordDetailsScreen />);

      await waitFor(() => {
        expect(getByText('Gửi hồ sơ')).toBeTruthy();
      });

      expect(
        queryByText('Thời gian ghi nhận không được quá 30 ngày so với hiện tại.'),
      ).toBeNull();

      const submitText = getByText('Gửi hồ sơ');
      const submitButton = submitText.parent;
      expect(submitButton?.props.accessibilityState?.disabled).toBe(false);
    });

    it('dynamically enables submit button when user edits invalid date to a valid date', async () => {
      mockSearchParams = { submissionId: 'sub-dynamic-date' };
      const oldDate = new Date(Date.now() - 40 * 86400 * 1000).toISOString();
      mockSubmissionStatusData = {
        submission: {
          id: 'sub-dynamic-date',
          status: 'DRAFT',
          submissionType: 'SINGLE_IMAGE',
          latitude: 10.7769,
          longitude: 106.7009,
          capturedAt: oldDate,
        },
        mediaFiles: [{ media_type: 'IMAGE', file_url: 'file:///cache/sign.jpg' }],
        sessions: [],
      };

      const { readDraftImage } = require('@/feature/upload/hooks/use-save-survey-draft');
      readDraftImage.mockResolvedValueOnce({
        uri: 'file:///cache/sign.jpg',
        fileName: 'sign.jpg',
        mimeType: 'image/jpeg',
        startLat: 10.7769,
        startLon: 106.7009,
      });

      const { getByText, getByLabelText, queryByText } = await render(
        <SurveyRecordDetailsScreen />,
      );

      // Initially disabled with error message
      await waitFor(() => {
        expect(
          getByText('Thời gian ghi nhận không được quá 30 ngày so với hiện tại.'),
        ).toBeTruthy();
      });
      let submitButton = getByText('Gửi hồ sơ').parent;
      expect(submitButton?.props.accessibilityState?.disabled).toBe(true);

      // User fixes date to today's date
      const now = new Date();
      const todayFormatted = `${String(now.getDate()).padStart(2, '0')}/${String(
        now.getMonth() + 1,
      ).padStart(2, '0')}/${now.getFullYear()}`;

      const dateInput = getByLabelText(
        'Thời gian ghi nhận phương tiện theo định dạng ngày/tháng/năm',
      );
      fireEvent.changeText(dateInput, todayFormatted);

      // Error message should be gone and submit button enabled
      await waitFor(() => {
        expect(
          queryByText('Thời gian ghi nhận không được quá 30 ngày so với hiện tại.'),
        ).toBeNull();
      });

      submitButton = getByText('Gửi hồ sơ').parent;
      expect(submitButton?.props.accessibilityState?.disabled).toBe(false);
    });
  });
});

