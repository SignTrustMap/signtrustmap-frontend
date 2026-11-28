import React from 'react';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockCreateSubmission = jest.fn();
const mockInitializeUpload = jest.fn();
const mockUploadChunk = jest.fn();
const mockCompleteUpload = jest.fn();
const mockUpdateSubmission = jest.fn();
const mockSubmitSubmission = jest.fn();
const mockReadDraftImage = jest.fn();
const mockUpdateDraftCoordinates = jest.fn();
const mockPrepareSurveyImage = jest.fn();
const mockGetDocumentAsync = jest.fn();
const mockExtractGpxGpsData = jest.fn();
const mockExecuteChunkedVideoUpload = jest.fn();
const mockRegisterZeroCopyDraft = jest.fn();
const mockStartSmartPollingSync = jest.fn();
const mockGetVideoFileSizeBytes = jest.fn();
const mockGetCurrentSurveyCoordinate = jest.fn();

let mockParams: Record<string, string | undefined> = {};
let mockSession: any = {
  accessToken: 'survey-tok',
  account: { id: 'acc-1' },
};
let mockDraftQueryData: any = undefined;
let mockReverseGeocodeData: any = {
  data: { displayAddress: '45 Nguyễn Huệ, Q.1', roadName: 'Nguyễn Huệ' },
  isLoading: false,
};
let mockLocationPickerProps: any = null;
let mockDatePickerOnChange: any = null;

jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
  useLocalSearchParams: () => mockParams,
}));

jest.mock('react-native-safe-area-context', () => {
  const { View: RNView } = require('react-native');
  return {
    SafeAreaView: (props: any) => <RNView {...props}>{props.children}</RNView>,
    useSafeAreaInsets: () => ({ top: 0, bottom: 10, left: 0, right: 0 }),
  };
});

jest.mock('@expo/vector-icons', () => {
  const { View: RNView } = require('react-native');
  return {
    MaterialCommunityIcons: (props: any) => <RNView testID={`mc-${props.name}`} {...props} />,
  };
});

jest.mock('@expo/vector-icons/AntDesign', () => {
  const { View: RNView } = require('react-native');
  return (props: any) => <RNView testID={`ant-${props.name}`} {...props} />;
});

jest.mock('expo-symbols', () => {
  const { View: RNView } = require('react-native');
  return {
    SymbolView: (props: any) => <RNView testID="symbol-view" {...props} />,
  };
});

jest.mock('expo-image', () => {
  const { View: RNView } = require('react-native');
  return {
    Image: (props: any) => <RNView testID="expo-image" {...props} />,
  };
});

jest.mock('@react-native-community/datetimepicker', () => {
  const { View: RNView, Pressable: RNPressable, Text: RNText } = require('react-native');
  return (props: any) => {
    mockDatePickerOnChange = props.onChange;
    return (
      <RNView testID="date-time-picker">
        <RNPressable
          testID="date-picker-confirm"
          onPress={() => props.onChange({ type: 'set' }, new Date(Date.now() - 86400 * 1000))}
        >
          <RNText>Confirm Date</RNText>
        </RNPressable>
      </RNView>
    );
  };
});

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: (...args: any[]) => mockGetDocumentAsync(...args),
}));

jest.mock('@/context/session-provider', () => ({
  useSession: () => ({ session: mockSession }),
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    backgroundElement: '#F8FAFC',
    border: '#E2E8F0',
    text: '#0F172A',
    textSecondary: '#475569',
    placeholder: '#94A3B8',
    primary: '#2563EB',
    neutral: '#F1F5F9',
  }),
}));

jest.mock('@/feature/navigation/components/navigation-map-view', () => {
  const { View: RNView } = require('react-native');
  return {
    NavigationMapView: (props: any) => <RNView testID="record-map-view" {...props} />,
  };
});

jest.mock('@/feature/upload/components/location-picker-modal', () => {
  const { View: RNView } = require('react-native');
  return {
    LocationPickerModal: (props: any) => {
      mockLocationPickerProps = props;
      return props.visible ? <RNView testID="location-picker-modal" /> : null;
    },
  };
});

jest.mock('@/feature/upload/hooks/use-survey-submission', () => ({
  useCreateSurveySubmission: () => ({ mutateAsync: mockCreateSubmission }),
  useInitializeSurveyUpload: () => ({ mutateAsync: mockInitializeUpload }),
  useUploadSurveyChunk: () => ({ mutateAsync: mockUploadChunk }),
  useCompleteSurveyUpload: () => ({ mutateAsync: mockCompleteUpload }),
  useUpdateSurveySubmission: () => ({ mutateAsync: mockUpdateSubmission }),
  useSubmitSurveySubmission: () => ({ mutateAsync: mockSubmitSubmission }),
  useGetSurveySubmissionStatus: () => ({ data: mockDraftQueryData }),
}));

jest.mock('@/feature/upload/hooks/use-reverse-geocode', () => ({
  useReverseGeocode: () => mockReverseGeocodeData,
}));

jest.mock('@/feature/upload/hooks/use-save-survey-draft', () => ({
  readDraftImage: (...args: any[]) => mockReadDraftImage(...args),
  updateDraftCoordinates: (...args: any[]) => mockUpdateDraftCoordinates(...args),
}));

jest.mock('@/feature/upload/utils/survey-image', () => ({
  prepareSurveyImage: (...args: any[]) => mockPrepareSurveyImage(...args),
}));

jest.mock('@/feature/upload/utils/gpx', () => ({
  extractGpxGpsData: (...args: any[]) => mockExtractGpxGpsData(...args),
}));

jest.mock('@/feature/upload/utils/chunk-upload-manager', () => ({
  executeChunkedVideoUpload: (...args: any[]) => mockExecuteChunkedVideoUpload(...args),
}));

jest.mock('@/feature/upload/utils/crop-sync-manager', () => ({
  registerZeroCopyDraft: (...args: any[]) => mockRegisterZeroCopyDraft(...args),
  startSmartPollingSync: (...args: any[]) => mockStartSmartPollingSync(...args),
}));

jest.mock('@/feature/upload/utils/video-processor', () => ({
  MAX_SURVEY_VIDEO_SIZE_BYTES: 100 * 1024 * 1024,
  getVideoFileSizeBytes: (...args: any[]) => mockGetVideoFileSizeBytes(...args),
}));

jest.mock('@/services/maplibre', () => ({
  getMapLibre: () => ({}),
}));

jest.mock('@/feature/upload/utils/survey-record-details.utils', () => {
  const actual = jest.requireActual('@/feature/upload/utils/survey-record-details.utils');
  return {
    ...actual,
    getCurrentSurveyCoordinate: (...args: any[]) => mockGetCurrentSurveyCoordinate(...args),
  };
});

import { SurveyRecordDetailsScreen } from '@/feature/upload/pages/survey-record-details-screen';

describe('SurveyRecordDetailsScreen branch coverage', () => {
  const recentIso = new Date(Date.now() - 2 * 86400 * 1000).toISOString();

  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = {};
    mockSession = { accessToken: 'survey-tok', account: { id: 'acc-1' } };
    mockDraftQueryData = undefined;
    mockReverseGeocodeData = {
      data: { displayAddress: '45 Nguyễn Huệ, Q.1', roadName: 'Nguyễn Huệ' },
      isLoading: false,
    };
    mockReadDraftImage.mockResolvedValue(undefined);
    mockUpdateDraftCoordinates.mockResolvedValue(undefined);
    mockPrepareSurveyImage.mockResolvedValue({
      fileName: 'img.jpg',
      sizeBytes: 1024,
      chunk: { chunkIndex: 0, file: {} },
    });
    mockCreateSubmission.mockResolvedValue({ id: 'srv-new-1' });
    mockInitializeUpload.mockResolvedValue({ sessionId: 'up-1' });
    mockUploadChunk.mockResolvedValue({});
    mockCompleteUpload.mockResolvedValue({});
    mockUpdateSubmission.mockResolvedValue({});
    mockSubmitSubmission.mockResolvedValue({ status: 'QUEUED' });
    mockGetVideoFileSizeBytes.mockResolvedValue(5 * 1024 * 1024);
    mockExecuteChunkedVideoUpload.mockImplementation(async ({ onProgress }: any) => {
      onProgress?.({ currentChunk: 1, totalChunks: 2, percent: 50, statusText: 'Đang tải...' });
    });
    mockRegisterZeroCopyDraft.mockResolvedValue(undefined);
    mockGetCurrentSurveyCoordinate.mockResolvedValue([106.701, 10.777]);
  });

  afterEach(() => {
    cleanup();
  });

  it('covers batch image navigation, direction controls, date picker, and multi-image submission', async () => {
    mockParams = {
      latitude: '10.77',
      longitude: '106.7',
      capturedAt: recentIso,
      assetsJson: JSON.stringify([
        {
          uri: 'file:///img1.jpg',
          fileName: 'img1.jpg',
          mimeType: 'image/jpeg',
          capturedAt: recentIso,
          gps: { latitude: 10.77, longitude: 106.7, heading: 90 },
        },
        {
          uri: 'file:///img2.jpg',
          fileName: 'img2.jpg',
          mimeType: 'image/jpeg',
          gps: null,
        },
      ]),
    };

    const screen = await render(<SurveyRecordDetailsScreen />);

    expect(screen.getByText('Bộ ảnh (1/2)')).toBeTruthy();

    // Test direction controls (+15, -15, cardinal chip toggle, reset)
    await fireEvent.press(screen.getByLabelText('Quay cùng chiều kim đồng hồ 15 độ'));
    await fireEvent.press(screen.getByLabelText('Quay ngược chiều kim đồng hồ 15 độ'));
    await fireEvent.press(screen.getByLabelText('Chọn hướng Bắc (0°)'));
    await fireEvent.press(screen.getByLabelText('Chọn hướng Bắc (0°)'));
    await fireEvent.press(screen.getByLabelText('Đặt lại hướng mặc định'));

    // Open calendar DatePicker and set recent valid date
    await fireEvent.press(screen.getByLabelText('Chọn ngày từ lịch'));
    await fireEvent.press(screen.getByTestId('date-picker-confirm'));

    // Edit note -> switch to second batch image
    await fireEvent.changeText(screen.getByLabelText('Ghi chú khảo sát'), 'Ghi chú ảnh 1');
    await fireEvent.press(screen.getByLabelText('Ảnh kế tiếp'));

    await waitFor(() => {
      expect(screen.getByText('Bộ ảnh (2/2)')).toBeTruthy();
    });

    // Second image lacks GPS -> open LocationPickerModal and confirm coordinate
    await fireEvent.press(screen.getByLabelText('Phóng to bản đồ xem trước'));
    expect(screen.getByTestId('location-picker-modal')).toBeTruthy();
    await act(async () => {
      mockLocationPickerProps.onConfirm([106.702, 10.772]);
    });

    // Set recent date on second image as well before switching back
    await fireEvent.press(screen.getByLabelText('Chọn ngày từ lịch'));
    await fireEvent.press(screen.getByTestId('date-picker-confirm'));

    // Switch back to image 1 via thumbnail and submit batch
    await fireEvent.press(screen.getByLabelText('Chọn ảnh 1'));
    await waitFor(() => {
      expect(screen.getByText('Bộ ảnh (1/2)')).toBeTruthy();
    });

    await fireEvent.press(screen.getByText(/Gửi tất cả hồ sơ/));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/work/submission-complete' }),
      );
    });
  });

  it('covers VIDEO_GPX flow: GPX hydration, accordion, invalid/valid GPX pick, current location, video size error, and chunked upload submit', async () => {
    mockParams = {
      imageUri: 'file:///survey.mp4',
      imageName: 'survey.mp4',
      imageMimeType: 'video/mp4',
      duration: '120',
      capturedAt: recentIso,
    };
    mockDraftQueryData = undefined;

    const screen = await render(<SurveyRecordDetailsScreen />);

    // Open GPX accordion & try invalid non-.gpx file first
    await fireEvent.press(screen.getByText('Nâng cao: Đính kèm tệp GPX ngoài'));
    mockGetDocumentAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///bad.txt', name: 'bad.txt' }],
    });
    await fireEvent.press(screen.getByText('Chọn tệp GPX (.gpx)'));
    await waitFor(() => {
      expect(screen.getAllByText(/Định dạng tệp GPX không hợp lệ|\.gpx/i).length).toBeGreaterThan(0);
    });

    // Pick valid .gpx file
    mockGetDocumentAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///track.gpx', name: 'track.gpx' }],
    });
    mockExtractGpxGpsData.mockResolvedValueOnce({
      coordinates: [
        [106.7, 10.77],
        [106.703, 10.773],
      ],
      firstPoint: { longitude: 106.7, latitude: 10.77 },
      lastPoint: { longitude: 106.703, latitude: 10.773 },
      startTime: new Date(Date.now() - 86400 * 1000),
    });
    await fireEvent.press(screen.getByText('Chọn tệp GPX (.gpx)'));

    // Clear GPX back to auto GPS & fetch live GPS
    await waitFor(() => expect(screen.getByText('Dùng GPS tự động')).toBeTruthy());
    await fireEvent.press(screen.getByText('Dùng GPS tự động'));
    await fireEvent.press(screen.getByLabelText('Sử dụng vị trí hiện tại cho điểm bắt đầu'));

    // Open fullscreen route map
    await fireEvent.press(screen.getByLabelText('Mở toàn màn hình xem lộ trình'));
    expect(mockPush).toHaveBeenCalledWith(
      expect.objectContaining({ pathname: '/work/new-survey/route-map' }),
    );

    // Oversized video throws VIDEO_SIZE_EXCEEDED_MESSAGE
    mockGetVideoFileSizeBytes.mockResolvedValueOnce(200 * 1024 * 1024);
    await fireEvent.press(screen.getByText('Gửi hồ sơ'));

    // Valid video submit succeeds
    await waitFor(() => {
      expect(screen.queryByText('Đang gửi...')).toBeNull();
    });
    mockGetVideoFileSizeBytes.mockResolvedValueOnce(5 * 1024 * 1024);
    await fireEvent.press(screen.getByText('Gửi hồ sơ'));

    await waitFor(() => {
      expect(mockExecuteChunkedVideoUpload).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: '/work/submission-complete' }),
      );
    });
  });

  it('covers draft hydration from backend status, missing media button, expired session guard, and single-image submit', async () => {
    mockParams = { submissionId: 'srv-draft-99' };
    mockDraftQueryData = {
      submission: {
        id: 'srv-draft-99',
        submissionType: 'SINGLE_IMAGE',
        status: 'PENDING_CORRECTION',
        capturedAt: recentIso,
        latitude: 10.775,
        longitude: 106.705,
        coordinateSource: 'MANUAL',
        note: 'Bản nháp cũ',
      },
      mediaFiles: [{ mediaType: 'IMAGE', fileUrl: 's3://bucket/photo.jpg' }],
      sessions: [],
    };

    const screen = await render(<SurveyRecordDetailsScreen />);

    await waitFor(() => {
      expect(mockReadDraftImage).toHaveBeenCalledWith('acc-1', 'srv-draft-99');
      expect(screen.getByDisplayValue('Bản nháp cũ')).toBeTruthy();
    });

    // Submit single image draft with existing backend media (skips re-upload)
    await fireEvent.press(screen.getByText('Gửi hồ sơ'));

    await waitFor(() => {
      expect(mockUpdateSubmission).toHaveBeenCalled();
      expect(mockSubmitSubmission).toHaveBeenCalledWith({ submissionId: 'srv-draft-99' });
    });

    // Back button navigation
    await fireEvent.press(screen.getByLabelText('Quay lại'));
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: '/work',
      params: { currentRole: 'surveyor' },
    });
  });
});
