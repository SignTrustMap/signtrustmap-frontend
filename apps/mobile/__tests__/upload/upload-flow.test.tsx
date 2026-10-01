import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';

// Components under test
import { NewSurveyRecordScreen } from '@/feature/upload/pages/new-survey-record-screen';
import { SurveyRecordDetailsScreen } from '@/feature/upload/pages/survey-record-details-screen';
import { SurveyFinishScreen } from '@/feature/upload/pages/survey-finish-screen';
import { SurveyorWorkPanel } from '@/feature/upload/components/surveyor-work-panel';
import { SurveyScanModal } from '@/feature/upload/components/survey-scan-modal';

// 1. Mock expo-router
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
let mockSearchParams: Record<string, string> = {};

jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useRouter: () => ({
      push: mockPush,
      replace: mockReplace,
      back: mockBack,
      canGoBack: () => true,
    }),
    useLocalSearchParams: () => mockSearchParams,
    useFocusEffect: (cb: any) => {
      React.useEffect(() => {
        return cb();
      }, [cb]);
    },
  };
});

// 2. Mock UI and Vector Icons
jest.mock('@expo/vector-icons/AntDesign', () => 'AntDesign');
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));
jest.mock('expo-symbols', () => ({
  SymbolView: 'SymbolView',
}));
jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Image: (props: any) => React.createElement(View, props),
  };
});
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: any) =>
      React.createElement(View, props, children),
    useSafeAreaInsets: () => ({ top: 0, left: 0, right: 0, bottom: 0 }),
  };
});
jest.mock('react-native-reanimated', () => ({
  useReducedMotion: jest.fn(() => false),
}));

// 3. Mock theme and session
jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    backgroundElement: '#F8FAFC',
    backgroundSelected: '#EFF6FF',
    text: '#0F172A',
    textSecondary: '#64748B',
    placeholder: '#94A3B8',
    border: '#E2E8F0',
    primary: '#0671EB',
    onPrimary: '#FFFFFF',
    neutral: '#F1F5F9',
  }),
}));

const mockDefaultSession = {
  accessToken: 'mock-access-token-123',
  account: { id: 'account-surveyor-1', username: 'surveyor1' },
};
let mockCurrentSession: typeof mockDefaultSession | null = mockDefaultSession;

jest.mock('@/context/session-provider', () => ({
  useSession: () => ({
    session: mockCurrentSession,
  }),
}));

// 4. Mock Media Libraries & Pickers
const mockLegacyRequestPermissionsAsync = jest.fn();
const mockLegacyGetAssetsAsync = jest.fn();
const mockLegacyGetAssetInfoAsync = jest.fn();

jest.mock('expo-media-library/legacy', () => ({
  requestPermissionsAsync: (...args: any[]) => mockLegacyRequestPermissionsAsync(...args),
  getAssetsAsync: (...args: any[]) => mockLegacyGetAssetsAsync(...args),
  getAssetInfoAsync: (...args: any[]) => mockLegacyGetAssetInfoAsync(...args),
  MediaType: { photo: 'photo', video: 'video' },
  SortBy: { creationTime: 'creationTime' },
}));

jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  MediaType: { IMAGE: 'image', VIDEO: 'video' },
  AssetField: { MEDIA_TYPE: 'mediaType', MODIFICATION_TIME: 'modificationTime' },
  Query: jest.fn().mockImplementation(() => ({
    eq: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    exeForMetadata: jest.fn().mockResolvedValue([]),
  })),
  Asset: jest.fn().mockImplementation(() => ({
    getLocation: jest.fn().mockResolvedValue({ latitude: 10.7769, longitude: 106.7009 }),
    getExif: jest.fn().mockResolvedValue({}),
  })),
}));

const mockLaunchImageLibraryAsync = jest.fn();
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: (...args: any[]) => mockLaunchImageLibraryAsync(...args),
  UIImagePickerPresentationStyle: { PAGE_SHEET: 'PAGE_SHEET' },
}));

const mockGetDocumentAsync = jest.fn();
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: (...args: any[]) => mockGetDocumentAsync(...args),
}));

// 5. Mock Upload Hooks
const mockSaveDraft = jest.fn();
const mockReadDraftImage = jest.fn();
jest.mock('@/feature/upload/hooks/use-save-survey-draft', () => ({
  useSaveSurveyDraft: () => mockSaveDraft,
  readDraftImage: (...args: any[]) => mockReadDraftImage(...args),
}));

const mockUpdateSubmission = jest.fn();
const mockSubmitSubmission = jest.fn();
let mockSubmissionStatusData: any = null;

jest.mock('@/feature/upload/hooks/use-survey-submission', () => ({
  useGetSurveySubmissionStatus: () => ({
    data: mockSubmissionStatusData,
    isLoading: false,
    refetch: jest.fn(),
  }),
  useUpdateSurveySubmission: () => ({
    mutateAsync: mockUpdateSubmission,
  }),
  useSubmitSurveySubmission: () => ({
    mutateAsync: mockSubmitSubmission,
  }),
  useGetMyPendingSubmissions: () => ({
    data: { pending: 4, countsByStatus: { DRAFT: 2 } },
  }),
  useGetMySurveyStats: () => ({
    data: { revalidationAvailable: 5 },
  }),
}));

const mockReverseGeocode = jest.fn();
jest.mock('@/feature/upload/hooks/use-reverse-geocode', () => ({
  useReverseGeocode: (coord: any) => mockReverseGeocode(coord),
}));

jest.mock('@/feature/revalidation/hooks/use-revalidation', () => ({
  useGetFirstRevalidationSign: () => ({ data: null }),
}));

jest.mock('@/api/revalidation/revalidation', () => ({
  fetchFirstRevalidationSign: jest.fn().mockResolvedValue(null),
}));

// 6. Mock chunk upload and crop sync managers
const mockExecuteChunkedVideoUpload = jest.fn();
jest.mock('@/feature/upload/utils/chunk-upload-manager', () => ({
  executeChunkedVideoUpload: (...args: any[]) => mockExecuteChunkedVideoUpload(...args),
}));

const mockRegisterZeroCopyDraft = jest.fn();
const mockStartSmartPollingSync = jest.fn();
jest.mock('@/feature/upload/utils/crop-sync-manager', () => ({
  registerZeroCopyDraft: (...args: any[]) => mockRegisterZeroCopyDraft(...args),
  startSmartPollingSync: (...args: any[]) => mockStartSmartPollingSync(...args),
}));

// 7. Mock video, image, gpx gps extractors
const mockExtractVideoMetadataAsync = jest.fn();
jest.mock('@/feature/upload/utils/video-gps', () => {
  const actual = jest.requireActual('@/feature/upload/utils/video-gps');
  return {
    ...actual,
    extractVideoMetadataAsync: (...args: any[]) => mockExtractVideoMetadataAsync(...args),
  };
});

const mockExtractGpxGpsData = jest.fn();
jest.mock('@/feature/upload/utils/gpx', () => ({
  extractGpxGpsData: (...args: any[]) => mockExtractGpxGpsData(...args),
}));

const mockExtractImageGpsCoordinates = jest.fn();
jest.mock('@/feature/upload/utils/image-gps', () => ({
  extractImageGpsCoordinates: (...args: any[]) => mockExtractImageGpsCoordinates(...args),
}));

// 8. Mock maplibre native bridge & MapView
const mockMapLibreLocation = {
  requestPermissions: jest.fn().mockResolvedValue(true),
  getCurrentPosition: jest.fn().mockResolvedValue({
    coords: { latitude: 10.7769, longitude: 106.7009 },
  }),
};

jest.mock('@/services/maplibre', () => ({
  getMapLibre: () => ({
    LocationManager: mockMapLibreLocation,
  }),
}));

const mockMapProps: any = {};
jest.mock('@/feature/navigation/components/navigation-map-view', () => ({
  NavigationMapView: (props: any) => {
    Object.assign(mockMapProps, props);
    const React = require('react');
    const { View } = require('react-native');
    return React.createElement(View, { testID: 'mock-navigation-map-view', ...props });
  },
}));

// 9. Mock SurveyScanModal for page tests (actual component tested separately in Case 8)
let mockScanModalProps: any = undefined;
let mockScanModalCompleteCallback: (() => void) | undefined;
let mockScanModalCancelCallback: (() => void) | undefined;
jest.mock('@/feature/upload/components/survey-scan-modal', () => ({
  SurveyScanModal: (props: any) => {
    mockScanModalProps = props;
    mockScanModalCompleteCallback = props.onComplete;
    mockScanModalCancelCallback = props.onCancel;
    const React = require('react');
    const { View, Text, Pressable } = require('react-native');
    return React.createElement(
      View,
      { testID: 'mock-survey-scan-modal' },
      React.createElement(Text, null, 'Scanning Survey Video...'),
      React.createElement(
        Pressable,
        { accessibilityLabel: 'Cancel scan', onPress: props.onCancel },
        React.createElement(Text, null, 'Cancel'),
      ),
    );
  },
}));

const originalPlatformOS = Platform.OS;

describe('Upload Flow: Comprehensive Unit Test Suite', () => {
  beforeEach(() => {
    Platform.OS = originalPlatformOS;
    jest.clearAllMocks();
    mockSearchParams = {};
    mockCurrentSession = mockDefaultSession;
    mockSubmissionStatusData = null;
    mockScanModalProps = undefined;
    mockScanModalCompleteCallback = undefined;
    mockScanModalCancelCallback = undefined;
    mockReverseGeocode.mockReturnValue({
      data: {
        displayAddress: '123 Nguyen Hue, Ben Nghe, District 1',
        roadName: 'Nguyen Hue',
      },
      isLoading: false,
    });
    Object.keys(mockMapProps).forEach((k) => delete mockMapProps[k]);
  });

  afterEach(() => {
    Platform.OS = originalPlatformOS;
  });

  // =========================================================================
  // CASE 1: Upload Screen Components (NewSurveyRecordScreen)
  // =========================================================================
  describe('Case 1: Upload Screen Components', () => {
    it('renders header, title, upload placeholder, helper text, and disabled submit button initially', async () => {
      const { getByText, getByLabelText } = await render(<NewSurveyRecordScreen />);

      expect(getByText('New Survey Record')).toBeTruthy();
      expect(getByText('Upload photo or video')).toBeTruthy();
      expect(getByText('Upload your sign image or video here')).toBeTruthy();

      const backButton = getByLabelText('Back to surveyor work');
      expect(backButton).toBeTruthy();

      const submitButton = getByText('Submit Record');
      expect(submitButton).toBeTruthy();
    });

    it('updates button label to "Change selected photo" and enables submit button when asset is selected', async () => {
      mockLaunchImageLibraryAsync.mockResolvedValueOnce({
        canceled: false,
        assets: [
          {
            uri: 'file:///data/photo-1.jpg',
            fileName: 'photo-1.jpg',
            type: 'image',
            mimeType: 'image/jpeg',
            exif: {},
          },
        ],
      });
      mockExtractImageGpsCoordinates.mockReturnValueOnce({ latitude: 10.7769, longitude: 106.7009 });

      const { getByText, getByLabelText } = await render(<NewSurveyRecordScreen />);

      fireEvent.press(getByText('Upload photo or video'));

      await waitFor(() => {
        expect(getByLabelText('Change selected photo')).toBeTruthy();
        expect(getByText('Tap the preview to choose a different file')).toBeTruthy();
      });
    });
  });

  // =========================================================================
  // CASE 2: Upload Screen Navigation
  // =========================================================================
  describe('Case 2: Upload Screen Navigation', () => {
    it('triggers router.back() when back button is pressed', async () => {
      const { getByLabelText } = await render(<NewSurveyRecordScreen />);
      const backButton = getByLabelText('Back to surveyor work');

      fireEvent.press(backButton);
      expect(mockBack).toHaveBeenCalled();
    });

    it('navigates to /work/new-survey when "Draft Submissions" is pressed on SurveyorWorkPanel', async () => {
      const { getByText } = await render(<SurveyorWorkPanel />);
      const draftSubmissionsCard = getByText('Draft Submissions');

      fireEvent.press(draftSubmissionsCard);
      expect(mockPush).toHaveBeenCalledWith('/work/new-survey');
    });

    it('saves draft and replaces route with /work/new-survey/details upon scan completion', async () => {
      mockLaunchImageLibraryAsync.mockResolvedValueOnce({
        canceled: false,
        assets: [
          {
            uri: 'file:///data/photo-1.jpg',
            fileName: 'photo-1.jpg',
            type: 'image',
            mimeType: 'image/jpeg',
            exif: {},
          },
        ],
      });
      mockExtractImageGpsCoordinates.mockReturnValueOnce({ latitude: 10.7769, longitude: 106.7009 });
      mockSaveDraft.mockResolvedValueOnce('sub-generated-123');

      const { getByText } = await render(<NewSurveyRecordScreen />);

      // Pick image
      fireEvent.press(getByText('Upload photo or video'));

      // Wait for Submit Record to be enabled
      await waitFor(() => {
        expect(getByText('Submit Record')).toBeTruthy();
      });

      // Submit record
      fireEvent.press(getByText('Submit Record'));

      await waitFor(() => {
        expect(mockSaveDraft).toHaveBeenCalled();
      });

      // Trigger completion callback from scan modal
      expect(mockScanModalCompleteCallback).toBeDefined();
      mockScanModalCompleteCallback!();

      expect(mockReplace).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/work/new-survey/details',
          params: expect.objectContaining({
            submissionId: 'sub-generated-123',
            startLat: '10.7769',
            startLon: '106.7009',
          }),
        }),
      );
    });
  });

  // =========================================================================
  // CASE 3: Camera & Gallery Permission
  // =========================================================================
  describe('Case 3: Camera and Gallery Permissions', () => {
    it('displays error message when Android media permission is denied', async () => {
      Platform.OS = 'android';

      mockLegacyRequestPermissionsAsync.mockResolvedValueOnce({
        status: 'denied',
        accessPrivileges: 'none',
      });

      const { getByText } = await render(<NewSurveyRecordScreen />);

      fireEvent.press(getByText('Upload photo or video'));

      await waitFor(() => {
        expect(mockLegacyRequestPermissionsAsync).toHaveBeenCalledWith(false, ['photo', 'video']);
        expect(getByText('Media library permission is required to select photos and videos.')).toBeTruthy();
      });
    });

    it('loads media library assets when Android permission is granted', async () => {
      Platform.OS = 'android';

      mockLegacyRequestPermissionsAsync.mockResolvedValueOnce({
        status: 'granted',
        accessPrivileges: 'all',
      });
      mockLegacyGetAssetsAsync.mockResolvedValueOnce({
        assets: [
          {
            id: 'asset-1',
            filename: 'street_sign.jpg',
            uri: 'content://media/1',
            mediaType: 'photo',
            creationTime: 1710000000000,
          },
        ],
        endCursor: 'cursor-1',
        hasNextPage: false,
      });

      const { getByText, getByLabelText } = await render(<NewSurveyRecordScreen />);

      fireEvent.press(getByText('Upload photo or video'));

      await waitFor(() => {
        expect(mockLegacyGetAssetsAsync).toHaveBeenCalled();
        expect(getByText('Choose a photo or video')).toBeTruthy();
        expect(getByLabelText('Select street_sign.jpg')).toBeTruthy();
      });
    });
  });

  // =========================================================================
  // CASE 4: Image Selection & EXIF GPS
  // =========================================================================
  describe('Case 4: Image Selection & EXIF GPS Extraction', () => {
    it('selects image via picker and extracts valid EXIF GPS coordinates', async () => {
      mockLaunchImageLibraryAsync.mockResolvedValueOnce({
        canceled: false,
        assets: [
          {
            uri: 'file:///media/sign_post.jpg',
            fileName: 'sign_post.jpg',
            type: 'image',
            mimeType: 'image/jpeg',
            exif: { GPSLatitude: 10.7769, GPSLongitude: 106.7009 },
          },
        ],
      });
      mockExtractImageGpsCoordinates.mockReturnValueOnce({
        latitude: 10.7769,
        longitude: 106.7009,
      });

      const { getByText, getByLabelText } = await render(<NewSurveyRecordScreen />);

      fireEvent.press(getByText('Upload photo or video'));

      await waitFor(() => {
        expect(mockExtractImageGpsCoordinates).toHaveBeenCalled();
        expect(getByLabelText('Selected survey media')).toBeTruthy();
      });
    });

    it('handles image selection with no EXIF GPS gracefully', async () => {
      mockLaunchImageLibraryAsync.mockResolvedValueOnce({
        canceled: false,
        assets: [
          {
            uri: 'file:///media/no_gps.jpg',
            fileName: 'no_gps.jpg',
            type: 'image',
            mimeType: 'image/jpeg',
            exif: {},
          },
        ],
      });
      mockExtractImageGpsCoordinates.mockReturnValueOnce(null);

      const { getByText, getByLabelText } = await render(<NewSurveyRecordScreen />);

      fireEvent.press(getByText('Upload photo or video'));

      await waitFor(() => {
        expect(getByLabelText('Selected survey media')).toBeTruthy();
      });
    });
  });

  // =========================================================================
  // CASE 5: Video Selection & GPX Handling
  // =========================================================================
  describe('Case 5: Video Selection & GPX Handling', () => {
    it('detects video metadata, shows detected GPS card, and allows GPX toggle', async () => {
      mockLaunchImageLibraryAsync.mockResolvedValueOnce({
        canceled: false,
        assets: [
          {
            uri: 'file:///media/survey_drive.mp4',
            fileName: 'survey_drive.mp4',
            type: 'video',
            mimeType: 'video/mp4',
            duration: 45000,
          },
        ],
      });
      mockExtractVideoMetadataAsync.mockResolvedValueOnce({
        hasDeviceGps: true,
        startCoordinate: [106.7009, 10.7769],
        durationSeconds: 45,
        capturedAt: '2026-03-01T08:00:00.000Z',
      });

      const { getByText, getByLabelText } = await render(<NewSurveyRecordScreen />);

      fireEvent.press(getByText('Upload photo or video'));

      await waitFor(() => {
        expect(getByText('survey_drive.mp4')).toBeTruthy();
        expect(getByText('GPS detected: 10.77690, 106.70090')).toBeTruthy();
      });

      // Toggle external GPX picker
      const gpxToggle = getByLabelText('Toggle advanced GPX file picker');
      fireEvent.press(gpxToggle);

      await waitFor(() => {
        expect(getByLabelText('Upload GPX file')).toBeTruthy();
      });
    });

    it('rejects non-gpx files and displays an error message', async () => {
      mockLaunchImageLibraryAsync.mockResolvedValueOnce({
        canceled: false,
        assets: [
          {
            uri: 'file:///media/survey.mp4',
            fileName: 'survey.mp4',
            type: 'video',
            mimeType: 'video/mp4',
            duration: 30000,
          },
        ],
      });
      mockExtractVideoMetadataAsync.mockResolvedValueOnce({
        hasDeviceGps: false,
        startCoordinate: [0, 0],
        durationSeconds: 30,
      });

      const { getByText, getByLabelText } = await render(<NewSurveyRecordScreen />);

      fireEvent.press(getByText('Upload photo or video'));

      await waitFor(() => {
        expect(getByLabelText('Toggle advanced GPX file picker')).toBeTruthy();
      });

      // Open GPX toggle
      fireEvent.press(getByLabelText('Toggle advanced GPX file picker'));

      await waitFor(() => {
        expect(getByLabelText('Upload GPX file')).toBeTruthy();
      });

      // Pick an invalid .txt file
      mockGetDocumentAsync.mockResolvedValueOnce({
        canceled: false,
        assets: [{ name: 'invalid_track.txt', uri: 'file:///tracks/invalid.txt' }],
      });

      fireEvent.press(getByLabelText('Upload GPX file'));

      await waitFor(() => {
        expect(getByText('Please select a valid GPX file (.gpx).')).toBeTruthy();
      });
    });

    it('extracts GPS and updates coordinates when valid .gpx file is selected', async () => {
      mockLaunchImageLibraryAsync.mockResolvedValueOnce({
        canceled: false,
        assets: [
          {
            uri: 'file:///media/survey.mp4',
            fileName: 'survey.mp4',
            type: 'video',
            mimeType: 'video/mp4',
            duration: 30000,
          },
        ],
      });
      mockExtractVideoMetadataAsync.mockResolvedValueOnce({
        hasDeviceGps: false,
        startCoordinate: [0, 0],
        durationSeconds: 30,
      });

      const { getByText, getByLabelText } = await render(<NewSurveyRecordScreen />);

      fireEvent.press(getByText('Upload photo or video'));

      await waitFor(() => {
        expect(getByLabelText('Toggle advanced GPX file picker')).toBeTruthy();
      });

      fireEvent.press(getByLabelText('Toggle advanced GPX file picker'));

      await waitFor(() => {
        expect(getByLabelText('Upload GPX file')).toBeTruthy();
      });

      mockGetDocumentAsync.mockResolvedValueOnce({
        canceled: false,
        assets: [{ name: 'route.gpx', uri: 'file:///tracks/route.gpx' }],
      });
      mockExtractGpxGpsData.mockResolvedValueOnce({
        firstPoint: { latitude: 10.7800, longitude: 106.6900 },
        startTime: '2026-03-01T08:30:00.000Z',
      });

      fireEvent.press(getByLabelText('Upload GPX file'));

      await waitFor(() => {
        expect(getByText('route.gpx')).toBeTruthy();
      });
    });
  });

  // =========================================================================
  // CASE 6: Item Details Screen (SurveyRecordDetailsScreen)
  // =========================================================================
  describe('Case 6: Item Details Screen', () => {
    it('hydrates draft metadata, displays reverse geocoded address, and allows editing note and timestamp', async () => {
      mockSearchParams = { submissionId: 'sub-existing-123' };
      mockSubmissionStatusData = {
        submission: {
          id: 'sub-existing-123',
          status: 'DRAFT',
          submissionType: 'SINGLE_IMAGE',
          latitude: 10.7769,
          longitude: 106.7009,
          capturedAt: '2026-03-01T10:00:00.000Z',
          coordinateSource: 'IMAGE_EXIF',
          note: 'Initial speed limit note',
        },
        mediaFiles: [],
        sessions: [],
      };
      mockReadDraftImage.mockResolvedValueOnce({
        uri: 'file:///cache/survey-123.jpg',
        fileName: 'survey-123.jpg',
        mimeType: 'image/jpeg',
        submissionId: 'sub-existing-123',
        type: 'image',
      });

      const { getByLabelText, getByText } = await render(<SurveyRecordDetailsScreen />);

      await waitFor(() => {
        expect(getByText('New Survey Record')).toBeTruthy();
        expect(getByText('123 Nguyen Hue, Ben Nghe, District 1')).toBeTruthy();
      });

      const noteInput = getByLabelText('Survey note');
      expect(noteInput.props.value).toBe('Initial speed limit note');

      fireEvent.changeText(noteInput, 'Updated sign description');
      await waitFor(() => {
        expect(getByLabelText('Survey note').props.value).toBe('Updated sign description');
      });
    });

    it('navigates back to new survey to change media when "Choose draft media" is clicked', async () => {
      mockSearchParams = { submissionId: 'sub-repick-media' };
      mockSubmissionStatusData = {
        submission: {
          id: 'sub-repick-media',
          status: 'DRAFT',
          submissionType: 'SINGLE_IMAGE',
          latitude: 10.7769,
          longitude: 106.7009,
          capturedAt: '2026-03-01T10:00:00.000Z',
        },
        mediaFiles: [],
        sessions: [],
      };
      mockReadDraftImage.mockResolvedValueOnce(undefined);

      const { getByText } = await render(<SurveyRecordDetailsScreen />);

      await waitFor(() => {
        expect(getByText('Choose draft media')).toBeTruthy();
      });

      fireEvent.press(getByText('Choose draft media'));

      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/work/new-survey',
        params: { draftId: 'sub-repick-media' },
      });
    });

    it('updates coordinates when "Use current location" button is clicked', async () => {
      mockSearchParams = { submissionId: 'sub-gps-update' };
      mockSubmissionStatusData = {
        submission: {
          id: 'sub-gps-update',
          status: 'DRAFT',
          submissionType: 'SINGLE_IMAGE',
          latitude: null,
          longitude: null,
          capturedAt: '2026-03-01T10:00:00.000Z',
        },
        mediaFiles: [],
        sessions: [],
      };
      mockReadDraftImage.mockResolvedValueOnce({
        uri: 'file:///cache/survey.jpg',
        submissionId: 'sub-gps-update',
      });

      mockMapLibreLocation.getCurrentPosition.mockResolvedValueOnce({
        coords: { latitude: 10.7725, longitude: 106.6980 },
      });

      const { getByText } = await render(<SurveyRecordDetailsScreen />);

      await waitFor(() => {
        expect(getByText('Use current location')).toBeTruthy();
      });

      fireEvent.press(getByText('Use current location'));

      await waitFor(() => {
        expect(mockMapLibreLocation.getCurrentPosition).toHaveBeenCalled();
      });
    });
  });

  // =========================================================================
  // CASE 7: Upload Submit Screen & Finish Screen Flow
  // =========================================================================
  describe('Case 7: Upload Submit Screen & Finish Screen Flow', () => {
    it('executes single image submission and navigates to /work/survey-finish', async () => {
      mockSearchParams = { submissionId: 'sub-final-image' };
      mockSubmissionStatusData = {
        submission: {
          id: 'sub-final-image',
          status: 'DRAFT',
          submissionType: 'SINGLE_IMAGE',
          latitude: 10.7769,
          longitude: 106.7009,
          capturedAt: '2026-03-01T10:00:00.000Z',
          coordinateSource: 'IMAGE_EXIF',
          note: 'Final sign check',
        },
        mediaFiles: [{ media_type: 'IMAGE', file_url: 'https://example.com/sign.jpg' }],
        sessions: [],
      };
      mockReadDraftImage.mockResolvedValueOnce({
        uri: 'file:///cache/sign.jpg',
        submissionId: 'sub-final-image',
        fileName: 'sign.jpg',
        mimeType: 'image/jpeg',
      });
      mockUpdateSubmission.mockResolvedValueOnce({});
      mockSubmitSubmission.mockResolvedValueOnce({ status: 'QUEUED' });

      const { getByText, getByLabelText } = await render(<SurveyRecordDetailsScreen />);

      await waitFor(() => {
        expect(getByLabelText('Survey note').props.value).toBe('Final sign check');
      });

      fireEvent.press(getByText('Submit'));

      await waitFor(() => {
        expect(mockUpdateSubmission).toHaveBeenCalled();
        expect(mockSubmitSubmission).toHaveBeenCalledWith({ submissionId: 'sub-final-image' });
        expect(mockReplace).toHaveBeenCalledWith(
          expect.objectContaining({
            pathname: '/work/survey-finish',
            params: expect.objectContaining({
              submissionId: 'sub-final-image',
            }),
          }),
        );
      });
    });

    it('executes chunked video upload and registration before finalizing video submission', async () => {
      mockSearchParams = { submissionId: 'sub-final-video', duration: '60' };
      mockSubmissionStatusData = {
        submission: {
          id: 'sub-final-video',
          status: 'DRAFT',
          submissionType: 'VIDEO_GPX',
          latitude: 10.7769,
          longitude: 106.7009,
          capturedAt: '2026-03-01T10:00:00.000Z',
          coordinateSource: 'GPX_FILE',
          note: 'Video survey route',
        },
        mediaFiles: [],
        sessions: [],
      };
      mockReadDraftImage.mockResolvedValueOnce({
        uri: 'file:///cache/video.mp4',
        submissionId: 'sub-final-video',
        fileName: 'video.mp4',
        mimeType: 'video/mp4',
        type: 'video',
      });
      mockExecuteChunkedVideoUpload.mockResolvedValueOnce(undefined);
      mockRegisterZeroCopyDraft.mockResolvedValueOnce(undefined);
      mockUpdateSubmission.mockResolvedValueOnce({});
      mockSubmitSubmission.mockResolvedValueOnce({ status: 'QUEUED' });

      const { getByText, getByLabelText } = await render(<SurveyRecordDetailsScreen />);

      await waitFor(() => {
        expect(getByLabelText('Survey note').props.value).toBe('Video survey route');
      });

      fireEvent.press(getByText('Submit'));

      await waitFor(() => {
        expect(mockExecuteChunkedVideoUpload).toHaveBeenCalled();
        expect(mockRegisterZeroCopyDraft).toHaveBeenCalled();
        expect(mockStartSmartPollingSync).toHaveBeenCalled();
        expect(mockUpdateSubmission).toHaveBeenCalled();
        expect(mockSubmitSubmission).toHaveBeenCalled();
        expect(mockReplace).toHaveBeenCalledWith(
          expect.objectContaining({
            pathname: '/work/survey-finish',
            params: expect.objectContaining({
              submissionId: 'sub-final-video',
            }),
          }),
        );
      });
    });

    it('renders SurveyFinishScreen with confirmation details and navigates upon button clicks', async () => {
      mockSearchParams = {
        submissionId: 'sub-finish-12345678-abcd',
        submissionStatus: 'QUEUED',
      };

      const { getByText } = await render(<SurveyFinishScreen />);

      expect(getByText('Sign submitted')).toBeTruthy();
      expect(getByText('Your image was uploaded successfully and is queued for processing.')).toBeTruthy();
      expect(getByText(/Reference sub-fini - QUEUED/)).toBeTruthy();

      // Test "Submit another survey"
      const submitAnotherBtn = getByText('Submit another survey');
      fireEvent.press(submitAnotherBtn);
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/work/new-survey');
      });

      // Test "Return to surveyor's home"
      const returnHomeBtn = getByText("Return to surveyor's home");
      fireEvent.press(returnHomeBtn);
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith(
          expect.objectContaining({
            pathname: '/work',
            params: { currentRole: 'surveyor' },
          }),
        );
      });
    });
  });

  // =========================================================================
  // CASE 8: Scan Animation Modal (SurveyScanModal)
  // =========================================================================
  describe('Case 8: Scan Animation Modal', () => {
    it('registers onComplete and onCancel callbacks with SurveyScanModal', async () => {
      const onCompleteMock = jest.fn();
      const onCancelMock = jest.fn();

      const { getByLabelText, getByText } = await render(
        <SurveyScanModal
          imageUri="file:///media/video.mp4"
          isVideo={true}
          onComplete={onCompleteMock}
          onCancel={onCancelMock}
        />,
      );

      expect(getByText('Scanning Survey Video...')).toBeTruthy();
      expect(mockScanModalProps).toEqual(
        expect.objectContaining({
          imageUri: 'file:///media/video.mp4',
          isVideo: true,
          onComplete: onCompleteMock,
          onCancel: onCancelMock,
        }),
      );

      fireEvent.press(getByLabelText('Cancel scan'));
      expect(onCancelMock).toHaveBeenCalled();

      mockScanModalProps.onComplete();
      expect(onCompleteMock).toHaveBeenCalled();
    });
  });

  // =========================================================================
  // CASE 9: Android Custom Media Gallery Modal Grid & Pagination
  // =========================================================================
  describe('Case 9: Android Custom Media Gallery Grid and Pagination', () => {
    it('shows empty state when no media items are found in Android library', async () => {
      Platform.OS = 'android';

      mockLegacyRequestPermissionsAsync.mockResolvedValueOnce({
        status: 'granted',
        accessPrivileges: 'all',
      });
      mockLegacyGetAssetsAsync.mockResolvedValueOnce({
        assets: [],
        endCursor: undefined,
        hasNextPage: false,
      });

      const { getByText } = await render(<NewSurveyRecordScreen />);

      fireEvent.press(getByText('Upload photo or video'));

      await waitFor(() => {
        expect(getByText('No photos or videos found')).toBeTruthy();
      });
    });

    it('loads next page of gallery assets on end reached', async () => {
      Platform.OS = 'android';

      mockLegacyRequestPermissionsAsync.mockResolvedValueOnce({
        status: 'granted',
        accessPrivileges: 'all',
      });
      mockLegacyGetAssetsAsync.mockResolvedValueOnce({
        assets: [
          { id: 'asset-page1', filename: 'img1.jpg', uri: 'content://1', mediaType: 'photo' },
        ],
        endCursor: 'cursor-page-1',
        hasNextPage: true,
      });

      const { getByText } = await render(<NewSurveyRecordScreen />);

      fireEvent.press(getByText('Upload photo or video'));

      await waitFor(() => {
        expect(mockLegacyGetAssetsAsync).toHaveBeenCalledTimes(1);
      });
    });
  });

  // =========================================================================
  // CASE 10: Submission Validation & Guard Edge Cases
  // =========================================================================
  describe('Case 10: Submission Validation and Guard Edge Cases', () => {
    it('blocks submission and displays error when session has expired', async () => {
      mockCurrentSession = {
        accessToken: '', // Expired session token
        account: { id: 'account-surveyor-1', username: 'surveyor1' },
      };
      mockSearchParams = { submissionId: 'sub-no-auth' };
      mockSubmissionStatusData = {
        submission: {
          id: 'sub-no-auth',
          status: 'DRAFT',
          submissionType: 'SINGLE_IMAGE',
          latitude: 10.7769,
          longitude: 106.7009,
          capturedAt: '2026-03-01T10:00:00.000Z',
        },
        mediaFiles: [{ media_type: 'IMAGE', file_url: 'https://example.com/sign.jpg' }],
        sessions: [],
      };
      mockReadDraftImage.mockResolvedValueOnce({
        uri: 'file:///cache/sign.jpg',
        submissionId: 'sub-no-auth',
      });

      const { getByText, getByLabelText } = await render(<SurveyRecordDetailsScreen />);

      await waitFor(() => {
        expect(
          getByLabelText('Media capture date and time with time zone').props.value,
        ).toBe('2026-03-01T10:00:00.000Z');
      });

      fireEvent.press(getByText('Submit'));

      await waitFor(() => {
        expect(getByText('Your session has expired. Log in again and retry.')).toBeTruthy();
        expect(mockSubmitSubmission).not.toHaveBeenCalled();
      });
    });

    it('blocks submission and displays error when captured timestamp is invalid', async () => {
      mockSearchParams = { submissionId: 'sub-invalid-date' };
      mockSubmissionStatusData = {
        submission: {
          id: 'sub-invalid-date',
          status: 'DRAFT',
          submissionType: 'SINGLE_IMAGE',
          latitude: 10.7769,
          longitude: 106.7009,
          capturedAt: 'invalid-date-string',
        },
        mediaFiles: [{ media_type: 'IMAGE', file_url: 'https://example.com/sign.jpg' }],
        sessions: [],
      };
      mockReadDraftImage.mockResolvedValueOnce({
        uri: 'file:///cache/sign.jpg',
        submissionId: 'sub-invalid-date',
      });

      const { getByText, getByLabelText } = await render(<SurveyRecordDetailsScreen />);

      await waitFor(() => {
        expect(
          getByLabelText('Media capture date and time with time zone').props.value,
        ).toBe('invalid-date-string');
      });

      fireEvent.press(getByText('Submit'));

      await waitFor(() => {
        expect(
          getByText('Enter the date and time the media was recorded, including its time zone.'),
        ).toBeTruthy();
        expect(mockSubmitSubmission).not.toHaveBeenCalled();
      });
    });

    it('blocks submission when coordinates are completely missing', async () => {
      mockSearchParams = { submissionId: 'sub-missing-coord' };
      mockSubmissionStatusData = {
        submission: {
          id: 'sub-missing-coord',
          status: 'DRAFT',
          submissionType: 'SINGLE_IMAGE',
          latitude: null,
          longitude: null,
          capturedAt: '2026-03-01T10:00:00.000Z',
        },
        mediaFiles: [{ media_type: 'IMAGE', file_url: 'https://example.com/sign.jpg' }],
        sessions: [],
      };
      mockReadDraftImage.mockResolvedValueOnce({
        uri: 'file:///cache/sign.jpg',
        submissionId: 'sub-missing-coord',
      });

      const { getByText, getByLabelText } = await render(<SurveyRecordDetailsScreen />);

      await waitFor(() => {
        expect(
          getByLabelText('Media capture date and time with time zone').props.value,
        ).toBe('2026-03-01T10:00:00.000Z');
      });

      fireEvent.press(getByText('Submit'));

      await waitFor(() => {
        expect(
          getByText('Use media with GPS metadata or select your current location.'),
        ).toBeTruthy();
        expect(mockSubmitSubmission).not.toHaveBeenCalled();
      });
    });
  });

  // =========================================================================
  // CASE 11: Network & Submission Failure Resilience
  // =========================================================================
  describe('Case 11: Network and Submission Failure Resilience', () => {
    it('displays error banner and keeps draft editable when submission API fails', async () => {
      mockSearchParams = { submissionId: 'sub-network-fail' };
      mockSubmissionStatusData = {
        submission: {
          id: 'sub-network-fail',
          status: 'DRAFT',
          submissionType: 'SINGLE_IMAGE',
          latitude: 10.7769,
          longitude: 106.7009,
          capturedAt: '2026-03-01T10:00:00.000Z',
        },
        mediaFiles: [{ media_type: 'IMAGE', file_url: 'https://example.com/sign.jpg' }],
        sessions: [],
      };
      mockReadDraftImage.mockResolvedValueOnce({
        uri: 'file:///cache/sign.jpg',
        submissionId: 'sub-network-fail',
      });
      mockUpdateSubmission.mockRejectedValueOnce(new Error('Network connection timeout.'));

      const { getByText, getByLabelText } = await render(<SurveyRecordDetailsScreen />);

      await waitFor(() => {
        expect(
          getByLabelText('Media capture date and time with time zone').props.value,
        ).toBe('2026-03-01T10:00:00.000Z');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
      fireEvent.press(getByText('Submit'));

      await waitFor(() => {
        expect(getByText('Network connection timeout.')).toBeTruthy();
        expect(mockReplace).not.toHaveBeenCalledWith(
          expect.objectContaining({ pathname: '/work/survey-finish' }),
        );
      });
      consoleSpy.mockRestore();
    });
  });
});
