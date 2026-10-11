import React from 'react';
import { render, fireEvent, waitFor, renderHook, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';

// Real Application Code Under Test
import { SurveyRecordDetailsScreen } from '@/feature/upload/pages/survey-record-details-screen';
import { SurveyFinishScreen } from '@/feature/upload/pages/survey-finish-screen';
import { useSaveSurveyDraft, readDraftImage } from '@/feature/upload/hooks/use-save-survey-draft';
import { SessionProvider, type AppSession } from '@/context/session-provider';

// MSW Server and Paths
import {
  server,
  mockCreatedSubmission,
  mockInitializeUploadResponse,
  mockSubmissionStatusResponse,
  SUBMISSIONS_PATH,
  SUBMISSION_BY_ID_PATH,
  INITIALIZE_UPLOAD_PATH,
  UPLOAD_CHUNK_PATH,
  COMPLETE_UPLOAD_PATH,
  SUBMIT_SUBMISSION_PATH,
  SUBMISSION_STATUS_PATH,
} from '../mocks/msw';

// ---------------------------------------------------------------------------
// External Infrastructure Mocks
// ---------------------------------------------------------------------------
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
let mockSearchParams: Record<string, string> = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    canGoBack: () => true,
  }),
  useLocalSearchParams: () => mockSearchParams,
  useSegments: () => ['(authenticated)', '(tabs)', 'work', 'new-survey'],
  useFocusEffect: (cb: any) => {
    const React = require('react');
    React.useEffect(() => {
      return cb();
    }, [cb]);
  },
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: any) => React.createElement(View, props, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    MaterialCommunityIcons: (props: any) =>
      React.createElement(View, { testID: `icon-${props.name}`, ...props }),
  };
});
jest.mock('@expo/vector-icons/AntDesign', () => 'AntDesign');

jest.mock('expo-symbols', () => ({
  SymbolView: 'SymbolView',
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

// In-Memory Storage for Session & Drafts
const mockStorage = new Map<string, string>();
const authenticatedSession: AppSession = {
  accessToken: 'mock-surveyor-token-xyz',
  account: {
    id: 'surveyor-user-1',
    email: 'surveyor1@stm.dev',
    displayName: 'Surveyor One',
    roles: ['surveyor'],
  },
};

jest.mock('@/hooks/use-storage', () => ({
  setStorageItemAsync: jest.fn((key: string, val: string) => {
    mockStorage.set(key, val);
    return Promise.resolve();
  }),
  getStorageItemAsync: jest.fn((key: string) => {
    return Promise.resolve(mockStorage.get(key) ?? null);
  }),
  removeStorageItemAsync: jest.fn((key: string) => {
    mockStorage.delete(key);
    return Promise.resolve();
  }),
}));

// FileSystem Mock for local file inspection and chunk upload
const mockUploadAsync = jest.fn();

jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: 'file:///mock-cache/',
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true, size: 1048576 }),
  readAsStringAsync: jest.fn().mockResolvedValue(
    '<gpx version="1.1"><trk><trkseg><trkpt lat="10.7769" lon="106.7009"><time>2026-10-01T08:00:00Z</time></trkpt></trkseg></trk></gpx>',
  ),
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  uploadAsync: (...args: any[]) => mockUploadAsync(...args),
  FileSystemUploadType: { MULTIPART: 0 },
  EncodingType: { UTF8: 'utf8' },
}));

// Mock Media Pickers & Libraries
const mockLaunchImageLibraryAsync = jest.fn();
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: (...args: any[]) => mockLaunchImageLibraryAsync(...args),
  UIImagePickerPresentationStyle: { PAGE_SHEET: 'PAGE_SHEET' },
}));

const mockGetDocumentAsync = jest.fn();
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: (...args: any[]) => mockGetDocumentAsync(...args),
}));

jest.mock('expo-media-library/legacy', () => ({
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getAssetsAsync: jest.fn().mockResolvedValue({ assets: [] }),
  getAssetInfoAsync: jest.fn().mockResolvedValue(null),
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

jest.mock('@/feature/upload/utils/crop-sync-manager', () => ({
  registerZeroCopyDraft: jest.fn().mockResolvedValue(undefined),
  startSmartPollingSync: jest.fn().mockReturnValue(undefined),
}));

jest.mock('@/feature/upload/utils/gpx', () => ({
  extractGpxGpsData: jest.fn().mockResolvedValue({
    firstPoint: { latitude: 10.7769, longitude: 106.7009, time: '2026-10-01T08:00:00Z' },
    lastPoint: { latitude: 10.7800, longitude: 106.7050, time: '2026-10-01T08:05:00Z' },
    startTime: '2026-10-01T08:00:00Z',
    trackCount: 1,
    totalPoints: 2,
  }),
}));

jest.mock('@/feature/upload/utils/image-gps', () => {
  const actual = jest.requireActual('@/feature/upload/utils/image-gps');
  return {
    ...actual,
    extractImageGpsCoordinates: jest.fn().mockResolvedValue({
      latitude: 10.7769,
      longitude: 106.7009,
      timestamp: '2026-10-01T08:00:00Z',
    }),
  };
});

jest.mock('@/feature/navigation/components/navigation-map-view', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    NavigationMapView: (props: any) =>
      React.createElement(View, { testID: 'mock-navigation-map-view', ...props }),
  };
});

jest.mock('@/services/maplibre', () => ({
  getMapLibre: jest.fn(() => null),
}));

// ---------------------------------------------------------------------------
// Helper: Create QueryClient & Render Wrapper
// ---------------------------------------------------------------------------
function createIntegrationQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });
}

function createProvidersWrapper() {
  const queryClient = createIntegrationQueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>{children}</SessionProvider>
    </QueryClientProvider>
  );
}

// ---------------------------------------------------------------------------
// Integration Test Suite: Upload & Survey Submission Flow (MSW)
// ---------------------------------------------------------------------------
describe('Frontend Upload Flow Integration Tests (MSW)', () => {
  beforeAll(() => server.listen());

  beforeEach(() => {
    mockStorage.clear();
    mockStorage.set('session', JSON.stringify(authenticatedSession));
    mockSearchParams = {};
    mockUploadAsync.mockReset();
    mockUploadAsync.mockResolvedValue({
      status: 200,
      body: JSON.stringify({
        sessionId: 'sess-test-001',
        chunkIndex: 0,
        storageKey: 'submissions/sub-test-001/chunk-0.bin',
        sizeBytes: 1048576,
        receivedChunks: 1,
      }),
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => server.close());

  // =========================================================================
  // SUITE 1: Single Image Draft Creation & Upload Pipeline
  // =========================================================================
  describe('Suite 1: Single Image Draft Creation & Upload Pipeline', () => {
    it('executes full upload pipeline: creates draft contract, initializes session, uploads chunk, and completes upload', async () => {
      let createdSubmissionPayload: any = null;
      let uploadInitPayload: any = null;
      let chunkUploadCalled = false;
      let uploadCompletedCalled = false;

      server.use(
        http.post(SUBMISSIONS_PATH, async ({ request }) => {
          createdSubmissionPayload = await request.json();
          return HttpResponse.json(mockCreatedSubmission, { status: 201 });
        }),
        http.post(INITIALIZE_UPLOAD_PATH, async ({ request }) => {
          uploadInitPayload = await request.json();
          return HttpResponse.json(mockInitializeUploadResponse, { status: 201 });
        }),
        http.post(UPLOAD_CHUNK_PATH, () => {
          chunkUploadCalled = true;
          return HttpResponse.json({ sessionId: 'sess-test-001', chunkIndex: 0 }, { status: 200 });
        }),
        http.post(COMPLETE_UPLOAD_PATH, () => {
          uploadCompletedCalled = true;
          return HttpResponse.json({ status: 'COMPLETED' }, { status: 200 });
        }),
      );

      const { result } = await renderHook(() => useSaveSurveyDraft(), {
        wrapper: createProvidersWrapper(),
      });

      let submissionId: string = '';
      await act(async () => {
        submissionId = await result.current(
          {
            uri: 'file:///path/to/traffic-sign.jpg',
            fileName: 'traffic-sign.jpg',
            type: 'image',
          },
          {
            submissionType: 'SINGLE_IMAGE',
            capturedAt: '2026-10-01T08:00:00Z',
            coordinateSource: 'IMAGE_EXIF',
            latitude: 10.7769,
            longitude: 106.7009,
          },
        );
      });

      // 1. Verify returned submissionId matches backend contract
      expect(submissionId).toBe('sub-test-001');

      // 2. Verify POST /submissions payload contract
      expect(createdSubmissionPayload).toMatchObject({
        submissionType: 'SINGLE_IMAGE',
        coordinateSource: 'IMAGE_EXIF',
        latitude: 10.7769,
        longitude: 106.7009,
      });

      // 3. Verify POST /submissions/:id/uploads payload contract
      expect(uploadInitPayload).toMatchObject({
        mediaType: 'IMAGE',
        totalChunks: 1,
      });

      // 4. Verify chunk was uploaded and session finalized
      expect(mockUploadAsync).toHaveBeenCalled();
      expect(uploadCompletedCalled).toBe(true);

      // 5. Verify local draft persistence in AsyncStorage
      const savedDraft = await readDraftImage('surveyor-user-1', 'sub-test-001');
      expect(savedDraft).toBeDefined();
      expect(savedDraft?.uploadCompleted).toBe(true);
      expect(savedDraft?.sessionId).toBe('sess-test-001');
    });
  });

  // =========================================================================
  // SUITE 2: Video Survey & Companion GPX Creation
  // =========================================================================
  describe('Suite 2: Video Survey & Companion GPX Creation', () => {
    it('creates VIDEO_GPX submission with GPX_FILE coordinate source and stores companion GPX metadata', async () => {
      let createdPayload: any = null;

      server.use(
        http.post(SUBMISSIONS_PATH, async ({ request }) => {
          createdPayload = await request.json();
          return HttpResponse.json(
            {
              ...mockCreatedSubmission,
              id: 'sub-video-001',
              submissionId: 'sub-video-001',
              submissionType: 'VIDEO_GPX',
              coordinateSource: 'GPX_FILE',
            },
            { status: 201 },
          );
        }),
      );

      const { result } = await renderHook(() => useSaveSurveyDraft(), {
        wrapper: createProvidersWrapper(),
      });

      let submissionId: string = '';
      await act(async () => {
        submissionId = await result.current(
          {
            uri: 'file:///path/to/dashcam-video.mp4',
            fileName: 'dashcam-video.mp4',
            type: 'video',
            duration: 120,
          },
          {
            submissionType: 'VIDEO_GPX',
            capturedAt: '2026-10-01T08:00:00Z',
            coordinateSource: 'GPX_FILE',
            latitude: 10.7769,
            longitude: 106.7009,
          },
          undefined,
          {
            name: 'track.gpx',
            uri: 'file:///path/to/track.gpx',
          },
        );
      });

      expect(submissionId).toBe('sub-video-001');
      expect(createdPayload).toMatchObject({
        submissionType: 'VIDEO_GPX',
        coordinateSource: 'GPX_FILE',
        latitude: 10.7769,
        longitude: 106.7009,
      });

      // Verify draft saved with video type and companion GPX
      const savedDraft = await readDraftImage('surveyor-user-1', 'sub-video-001');
      expect(savedDraft?.type).toBe('video');
      expect(savedDraft?.gpxName).toBe('track.gpx');
      expect(savedDraft?.gpxUri).toBe('file:///path/to/track.gpx');
    });
  });

  // =========================================================================
  // SUITE 3: Survey Details Editing & Final Submission Pipeline
  // =========================================================================
  describe('Suite 3: Survey Record Details Screen & Final Submit Pipeline', () => {
    it('loads draft into SurveyRecordDetailsScreen, edits note, and dispatches PATCH and POST submit', async () => {
      let patchedPayload: any = null;
      let submitCalledForId: string | null = null;

      // Seed local storage with draft image
      await mockStorage.set(
        'survey-draft-surveyor-user-1-sub-test-001',
        JSON.stringify({
          uri: 'file:///path/to/traffic-sign.jpg',
          fileName: 'traffic-sign.jpg',
          type: 'image',
          submissionId: 'sub-test-001',
          uploadCompleted: true,
          sessionId: 'sess-test-001',
        }),
      );

      mockSearchParams = {
        submissionId: 'sub-test-001',
        startLat: '10.7769',
        startLon: '106.7009',
      };

      server.use(
        http.patch(SUBMISSION_BY_ID_PATH, async ({ params, request }) => {
          patchedPayload = await request.json();
          return HttpResponse.json({ ...mockCreatedSubmission, ...patchedPayload }, { status: 200 });
        }),
        http.post(SUBMIT_SUBMISSION_PATH, ({ params }) => {
          submitCalledForId = String(params.submissionId);
          return HttpResponse.json(
            { submissionId: params.submissionId, status: 'QUEUED', submissionStatus: 'QUEUED' },
            { status: 200 },
          );
        }),
      );

      const Wrapper = createProvidersWrapper();
      const { findByText, findByDisplayValue, getByText } = await render(
        <Wrapper>
          <SurveyRecordDetailsScreen />
        </Wrapper>,
      );

      // 1. Wait for draft submission to load and hydrate into the inputs
      await findByText('New Survey Record');
      const noteInput = await findByDisplayValue('Sample draft note');

      // 2. Type updated note into notes field
      await act(async () => {
        await fireEvent.changeText(noteInput, 'Speed limit 50 sign observed clearly on roadside');
      });

      // 3. Press Submit survey button
      const submitButton = getByText('Submit');
      await act(async () => {
        await fireEvent.press(submitButton);
      });

      // 4. Verify PATCH was called with updated note and coordinates
      await waitFor(() => {
        expect(patchedPayload).toMatchObject({
          note: 'Speed limit 50 sign observed clearly on roadside',
          latitude: 10.7769,
          longitude: 106.7009,
        });
      });

      // 5. Verify POST /submissions/:id/submit was called
      await waitFor(() => {
        expect(submitCalledForId).toBe('sub-test-001');
      });

      // 6. Verify navigation to finish screen
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith(
          expect.objectContaining({
            pathname: '/work/survey-finish',
            params: expect.objectContaining({
              submissionId: 'sub-test-001',
            }),
          }),
        );
      });
    });
  });

  // =========================================================================
  // SUITE 4: Survey Finish Screen Presentation
  // =========================================================================
  describe('Suite 4: Survey Finish Screen Confirmation', () => {
    it('renders finish confirmation and navigates to work dashboard or new survey on action press', async () => {
      mockSearchParams = {
        submissionId: 'sub-test-001',
        submissionStatus: 'QUEUED',
      };

      const Wrapper = createProvidersWrapper();
      const { getByText } = await render(
        <Wrapper>
          <SurveyFinishScreen />
        </Wrapper>,
      );

      // Verify title confirmation and reference code
      expect(getByText('Sign submitted')).toBeTruthy();
      expect(getByText(/Reference sub-test - QUEUED/i)).toBeTruthy();

      // Press "Return to surveyor's home"
      const homeBtn = getByText("Return to surveyor's home");
      await fireEvent.press(homeBtn);

      expect(mockReplace).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/work',
          params: { currentRole: 'surveyor' },
        }),
      );

      // Press "Submit another survey"
      const newSurveyBtn = getByText('Submit another survey');
      await fireEvent.press(newSurveyBtn);

      expect(mockReplace).toHaveBeenCalledWith('/work/new-survey');
    });
  });

  // =========================================================================
  // SUITE 5: Network Error Resilience & Recovery
  // =========================================================================
  describe('Suite 5: Network Error Resilience', () => {
    it('handles 500 error on chunk upload and keeps draft saved in storage for retry', async () => {
      mockUploadAsync.mockResolvedValueOnce({
        status: 500,
        body: JSON.stringify({ message: 'Internal Storage Error' }),
      });

      server.use(
        http.post(SUBMISSIONS_PATH, () => {
          return HttpResponse.json(mockCreatedSubmission, { status: 201 });
        }),
        http.post(INITIALIZE_UPLOAD_PATH, () => {
          return HttpResponse.json(mockInitializeUploadResponse, { status: 201 });
        }),
        http.post(UPLOAD_CHUNK_PATH, () => {
          return HttpResponse.json({ message: 'Internal Storage Error' }, { status: 500 });
        }),
      );

      const { result } = await renderHook(() => useSaveSurveyDraft(), {
        wrapper: createProvidersWrapper(),
      });

      let caughtError: any = null;
      await act(async () => {
        try {
          await result.current(
            {
              uri: 'file:///path/to/traffic-sign.jpg',
              fileName: 'traffic-sign.jpg',
              type: 'image',
            },
            {
              submissionType: 'SINGLE_IMAGE',
              capturedAt: '2026-10-01T08:00:00Z',
              coordinateSource: 'IMAGE_EXIF',
              latitude: 10.7769,
              longitude: 106.7009,
            },
          );
        } catch (err) {
          caughtError = err;
        }
      });

      expect(caughtError).toBeTruthy();

      // Verify draft record exists in storage even though chunk upload failed, allowing subsequent retry
      const savedDraft = await readDraftImage('surveyor-user-1', 'sub-test-001');
      expect(savedDraft).toBeDefined();
      expect(savedDraft?.uploadCompleted).toBeFalsy();
    });
  });
});
