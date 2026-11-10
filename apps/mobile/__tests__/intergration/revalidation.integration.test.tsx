import React from 'react';
import { Platform } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';

// Real Application Code Under Test
import {
  InspectRevalidateScreen,
  calculateDistanceMeters,
  isValidGpsCoordinates,
  getFreshnessStyle,
  REVALIDATION_STATUS_OPTIONS,
} from '@/feature/revalidation/pages/inspect-revalidate-screen';
import { RevalidationReviewScreen } from '@/feature/revalidation/pages/revalidation-review-screen';
import { RevalidationWorkflowProvider } from '@/feature/revalidation/context/revalidation-workflow-provider';
import { SessionProvider, type AppSession } from '@/context/session-provider';
import {
  getRevalidationTasksInBounds,
  getAllRevalidationTasks,
  fetchFirstRevalidationSign,
  toRevalidationTaskItem,
  revalidationTaskToRouteSign,
  submitRevalidationEvidence,
  getRevalidationEvidenceQueue,
  voteOnRevalidationEvidence,
  finalizeRevalidationTask,
  getEvidenceDecisions,
} from '@/api/revalidation/revalidation';
import { isRealWorldTaskBounds } from '@/feature/revalidation/hooks/use-revalidation';
import { server } from '../mocks/msw';

// ---------------------------------------------------------------------------
// External Infrastructure Mocks
// ---------------------------------------------------------------------------
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
let mockSearchParams: Record<string, string> = {};
let mockSegments: string[] = ['(authenticated)', '(tabs)', 'work', 'revalidation-review'];

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    canGoBack: () => true,
  }),
  useLocalSearchParams: () => mockSearchParams,
  useSegments: () => mockSegments,
  useFocusEffect: (cb: any) => {
    const React = require('react');
    React.useEffect(() => cb(), [cb]);
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

jest.mock('expo-symbols', () => ({
  SymbolView: 'SymbolView',
}));

const mockRenderedImages: any[] = [];
jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Image: ({ source, ...props }: any) => {
      if (source) mockRenderedImages.push(source);
      return React.createElement(View, { testID: 'expo-image', ...props });
    },
  };
});

const mockUploadAsync = jest.fn();
jest.mock('expo-file-system/legacy', () => ({
  FileSystemUploadType: {
    MULTIPART: 1,
    BINARY_CONTENT: 0,
  },
  uploadAsync: (...args: any[]) => mockUploadAsync(...args),
}));

const mockLaunchCameraAsync = jest.fn();
const mockLaunchImageLibraryAsync = jest.fn();
const mockRequestCameraPermissionsAsync = jest.fn();
jest.mock('expo-image-picker', () => ({
  launchCameraAsync: () => mockLaunchCameraAsync(),
  launchImageLibraryAsync: () => mockLaunchImageLibraryAsync(),
  requestCameraPermissionsAsync: () => mockRequestCameraPermissionsAsync(),
}));

jest.mock('expo-media-library/legacy', () => ({
  MediaType: { photo: 'photo', video: 'video' },
  SortBy: { creationTime: 'creationTime' },
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getAssetsAsync: jest.fn(async () => ({
    assets: [
      {
        id: 'asset-field-01',
        filename: 'field-inspection.jpg',
        uri: 'file:///data/field-inspection.jpg',
        mediaType: 'photo',
        creationTime: Date.now(),
      },
    ],
    endCursor: 'cursor-1',
    hasNextPage: false,
  })),
  getAssetInfoAsync: jest.fn(async (asset: any) => ({
    ...asset,
    localUri: asset.uri,
  })),
}));

const mockFetchFreshGpsPosition = jest.fn();
jest.mock('@/feature/navigation/utils/gps', () => ({
  fetchFreshGpsPosition: () => mockFetchFreshGpsPosition(),
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
    surface: '#FFFFFF',
    grey: '#64748B',
  }),
}));

const mockStorage = new Map<string, string>();
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

// ---------------------------------------------------------------------------
// Mock Sessions & Data Fixtures
// ---------------------------------------------------------------------------
const reviewerSession: AppSession = {
  accessToken: 'jwt-reviewer-token-xyz',
  account: {
    id: 'reviewer-user-01',
    email: 'reviewer@signtrustmap.com',
    displayName: 'Thẩm định viên Alpha',
    roles: ['reviewer'],
  },
};

const surveyorSession: AppSession = {
  accessToken: 'jwt-surveyor-token-abc',
  account: {
    id: 'surveyor-user-01',
    email: 'surveyor@signtrustmap.com',
    displayName: 'Điều tra viên Beta',
    roles: ['surveyor'],
  },
};

const mockTasksInBoundsResponse = {
  items: [
    {
      id: 'task-reval-101',
      verified_sign_id: 'sign-v-101',
      sign_code: 'P.102',
      name_vi: 'Cấm đi ngược chiều',
      name_en: 'No Entry',
      latitude: 10.7769,
      longitude: 106.6955,
      sign_crop_url: 'https://s3.signmap.site/stm-sign-crops/crop-p102.jpg',
      freshness_score: 45,
      priority: 'HIGH',
      status: 'OPEN',
      reward_credits: 50,
      reason: 'Sign exceeds staleness threshold (>90 days without verification)',
      created_at: '2026-08-01T10:00:00.000Z',
    },
    {
      id: 'task-reval-102',
      verified_sign_id: 'sign-v-102',
      sign_code: 'P.123a',
      name_vi: 'Cấm rẽ trái',
      name_en: 'No Left Turn',
      latitude: 10.78,
      longitude: 106.698,
      sign_crop_url: 'https://cdn.signmap.site/stm-sign-crops/crop-p123.jpg',
      freshness_score: 25,
      priority: 'URGENT',
      status: 'OPEN',
      reward_credits: 75,
      reason: 'User report indicates sign missing',
      created_at: '2026-07-15T08:00:00.000Z',
    },
  ],
  total: 2,
  page: 1,
  pageSize: 50,
  totalPages: 1,
};

const mockEvidenceQueueResponse = {
  items: [
    {
      evidenceId: 'evi-reval-001',
      taskId: 'task-reval-101',
      verifiedSign: {
        id: 'sign-v-101',
        signCode: 'P.102',
        nameVi: 'Cấm đi ngược chiều',
        nameEn: 'No Entry',
        signCropUrl: 'https://s3.signmap.site/stm-sign-crops/crop-p102.jpg',
        lastVerifiedAt: '2026-08-01T10:00:00.000Z',
        freshnessScore: 45,
      },
      evidence: {
        mediaUrl: 'https://s3.signmap.site/evidence/evidence-001.jpg',
        evidenceType: 'STILL_ACTIVE',
        submittedAt: '2026-11-06T09:30:00.000Z',
        latitude: 10.77695,
        longitude: 106.69552,
        distanceMeters: 6,
      },
      currentVoteCount: 2,
      taskStatus: 'EVALUATING',
      rewardCredits: 30,
    },
    {
      evidenceId: 'evi-reval-002',
      taskId: 'task-reval-102',
      verifiedSign: {
        id: 'sign-v-102',
        signCode: 'P.123a',
        nameVi: 'Cấm rẽ trái',
        nameEn: 'No Left Turn',
        signCropUrl: 'https://s3.signmap.site/stm-sign-crops/crop-p123.jpg',
        lastVerifiedAt: '2026-07-15T08:00:00.000Z',
        freshnessScore: 25,
      },
      evidence: {
        mediaUrl: 'https://s3.signmap.site/evidence/evidence-002.jpg',
        evidenceType: 'REMOVED',
        submittedAt: '2026-11-06T10:15:00.000Z',
        latitude: 10.78005,
        longitude: 106.69805,
        distanceMeters: 8,
      },
      currentVoteCount: 1,
      taskStatus: 'EVALUATING',
      rewardCredits: 40,
    },
  ],
  total: 2,
  page: 1,
  pageSize: 20,
  totalPages: 1,
};

function createIntegrationQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });
}

// ---------------------------------------------------------------------------
// Integration Test Suite
// ---------------------------------------------------------------------------
describe('Revalidation Feature End-to-End Integration Tests', () => {
  beforeAll(() => server.listen());

  beforeEach(() => {
    mockStorage.clear();
    mockStorage.set('session', JSON.stringify(reviewerSession));
    mockRenderedImages.length = 0;
    mockSearchParams = {};
    mockSegments = ['(authenticated)', '(tabs)', 'work', 'revalidation-review'];
    jest.clearAllMocks();

    mockUploadAsync.mockResolvedValue({
      status: 200,
      body: JSON.stringify({
        id: 'evi-new-001',
        taskId: 'task-reval-101',
        userId: 'surveyor-user-01',
        mediaUrl: 'https://s3.signmap.site/evidence/uploaded-evidence.jpg',
        evidenceType: 'STILL_ACTIVE',
        latitude: 10.77692,
        longitude: 106.69551,
        distanceMeters: 4,
        status: 'PENDING_EVALUATION',
      }),
    });

    // Register Default Revalidation Handlers on MSW
    server.use(
      http.get('*/revalidation/tasks/map', () => {
        return HttpResponse.json(mockTasksInBoundsResponse, { status: 200 });
      }),
      http.get('*/revalidation/tasks', () => {
        return HttpResponse.json(mockTasksInBoundsResponse, { status: 200 });
      }),
      http.get('*/revalidation/evidence/queue', () => {
        return HttpResponse.json(mockEvidenceQueueResponse, { status: 200 });
      }),
      http.post('*/revalidation/evidence/:evidenceId/vote', async ({ params, request }) => {
        const body = (await request.json().catch(() => ({}))) as any;
        return HttpResponse.json(
          {
            vote: {
              id: 'vote-resp-001',
              evidenceId: params.evidenceId,
              reviewerId: reviewerSession.account.id,
              decision: body.decision,
              note: body.note ?? null,
              suggestedSignTypeId: body.suggestedSignTypeId ?? null,
              decidedAt: new Date().toISOString(),
            },
            consensus: {
              evaluated: true,
              winningDecision: body.decision,
              totalVotes: 3,
            },
          },
          { status: 201 },
        );
      }),
      http.post('*/revalidation/tasks/:taskId/evidence', async ({ params }) => {
        return HttpResponse.json(
          {
            id: 'evi-post-001',
            taskId: params.taskId,
            mediaUrl: 'https://s3.signmap.site/evidence/web-upload.jpg',
            evidenceType: 'STILL_ACTIVE',
            latitude: 10.7769,
            longitude: 106.6955,
            distanceMeters: 5,
            status: 'PENDING_EVALUATION',
          },
          { status: 201 },
        );
      }),
      http.post('*/revalidation/tasks/:taskId/finalize', async ({ params }) => {
        return HttpResponse.json(
          {
            evaluated: true,
            taskId: params.taskId,
            winningDecision: 'STILL_ACTIVE',
            totalVotes: 3,
            creditedReviewers: 3,
            creditedSubmitters: 1,
          },
          { status: 200 },
        );
      }),
      http.get('*/revalidation/evidence/:evidenceId/decisions', () => {
        return HttpResponse.json(
          [
            {
              id: 'dec-1',
              evidenceId: 'evi-reval-001',
              reviewerId: 'reviewer-user-01',
              decision: 'STILL_ACTIVE',
              note: 'Confirmed on field',
              decidedAt: '2026-11-06T10:00:00.000Z',
            },
          ],
          { status: 200 },
        );
      }),
      http.get('*/wallet', () => {
        return HttpResponse.json({ balance: 500, pendingBalance: 50 }, { status: 200 });
      }),
      http.get('*/reviews/me/stats', () => {
        return HttpResponse.json({ totalReviews: 24, accuracyRate: 98 }, { status: 200 });
      }),
    );
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => server.close());

  // =========================================================================
  // 1. Revalidation Tasks Discovery & Map Bounds Spatial Integration
  // =========================================================================
  describe('FIT-REVAL-01: Tasks Discovery & Spatial Normalization', () => {
    it('validates bounds with isRealWorldTaskBounds and rejects out-of-world bounding boxes', () => {
      expect(isRealWorldTaskBounds(undefined)).toBe(false);
      expect(isRealWorldTaskBounds({ minLat: -90, maxLat: 90, minLon: -180, maxLon: 180 })).toBe(
        false,
      );
      expect(
        isRealWorldTaskBounds({ minLat: 10.7, maxLat: 10.8, minLon: 106.6, maxLon: 106.7 }),
      ).toBe(true);
    });

    it('transforms raw backend data into RevalidationTaskItem with normalized priority and coordinates', () => {
      const raw = mockTasksInBoundsResponse.items[0];
      const task = toRevalidationTaskItem(raw);

      expect(task.id).toBe('task-reval-101');
      expect(task.code).toBe('P.102');
      expect(task.name).toBe('Cấm đi ngược chiều');
      expect(task.priority).toBe('HIGH');
      expect(task.status).toBe('OPEN');
      expect(task.latitude).toBeCloseTo(10.7769);
      expect(task.longitude).toBeCloseTo(106.6955);
      expect(task.rewardCredits).toBe(50);
    });

    it('transforms RevalidationTaskItem to RouteSign with freshness score normalized to 0..1 scale', () => {
      const task = toRevalidationTaskItem(mockTasksInBoundsResponse.items[0]);
      const sign = revalidationTaskToRouteSign(task);

      expect(sign.id).toBe('sign-v-101');
      expect(sign.taskId).toBe('task-reval-101');
      expect(sign.signCode).toBe('P.102');
      expect(sign.freshnessScore).toBe(0.45); // 45 / 100
      expect(sign.coordinate).toEqual([106.6955, 10.7769]);
    });

    it('queries GET /revalidation/tasks/map with geographic viewport bounds and returns items', async () => {
      const tasks = await getRevalidationTasksInBounds({
        minLat: 10.7,
        maxLat: 10.8,
        minLon: 106.6,
        maxLon: 106.8,
        pageSize: 50,
      });

      expect(tasks).toHaveLength(2);
      expect(tasks[0].id).toBe('task-reval-101');
      expect(tasks[1].code).toBe('P.123a');
    });

    it('falls back seamlessly to /revalidation/tasks and broad country bounds when map query fails', async () => {
      let mapCallCount = 0;
      server.use(
        http.get('*/revalidation/tasks/map', ({ request }) => {
          mapCallCount++;
          const url = new URL(request.url);
          // If nationwide query (has min_lat=8), return broad result
          if (url.searchParams.get('min_lat') === '8') {
            return HttpResponse.json(mockTasksInBoundsResponse, { status: 200 });
          }
          // Initial unconstrained query returns 500 error
          return new HttpResponse(null, { status: 500 });
        }),
        http.get('*/revalidation/tasks', () => {
          return new HttpResponse(null, { status: 500 });
        }),
      );

      const allTasks = await getAllRevalidationTasks();
      expect(allTasks).toHaveLength(2);
      expect(mapCallCount).toBeGreaterThanOrEqual(2);
    });

    it('fetches the first revalidation sign prioritizing user location proximity', async () => {
      const userCoord: [number, number] = [106.6955, 10.7769];
      const sign = await fetchFirstRevalidationSign(userCoord);

      expect(sign).not.toBeNull();
      expect(sign?.taskId).toBe('task-reval-101');
      expect(sign?.signCode).toBe('P.102');
    });
  });

  // =========================================================================
  // 2. Surveyor Field Inspection & Evidence Submission (InspectRevalidateScreen)
  // =========================================================================
  describe('FIT-REVAL-02: Surveyor Field Inspection & Evidence Submission', () => {
    const originalPlatformOs = Platform.OS;

    beforeEach(() => {
      Platform.OS = 'android';
      mockStorage.set('session', JSON.stringify(surveyorSession));
      mockSearchParams = {
        signId: 'sign-v-101',
        taskId: 'task-reval-101',
        signCode: 'P.102',
        nameVi: 'Cấm đi ngược chiều',
        latitude: '10.77690',
        longitude: '106.69550',
        roadName: 'Đường Lê Lợi, Quận 1',
        freshnessScore: '45',
        imageUrl: 'https://s3.signmap.site/stm-sign-crops/crop-p102.jpg',
      };
    });

    afterEach(() => {
      Platform.OS = originalPlatformOs;
    });

    it('calculates Haversine distance and validates GPS proximity thresholds', () => {
      // 0 meters
      expect(calculateDistanceMeters(10.7769, 106.6955, 10.7769, 106.6955)).toBe(0);
      // Valid coordinates check
      expect(isValidGpsCoordinates({ latitude: 10.7769, longitude: 106.6955 })).toBe(true);
      expect(isValidGpsCoordinates({ latitude: 0, longitude: 0 })).toBe(false);
      expect(isValidGpsCoordinates(null)).toBe(false);

      // Freshness styles check
      expect(getFreshnessStyle(85).text).toBe('#047857'); // Healthy
      expect(getFreshnessStyle(65).text).toBe('#C2410C'); // Moderate
      expect(getFreshnessStyle(40).text).toBe('#BE123C'); // Warning
      expect(getFreshnessStyle(20).text).toBe('#B91C1C'); // Critical
    });

    it('renders carried target sign context and blocks submit without media and location', async () => {
      const queryClient = createIntegrationQueryClient();
      const { getByText, getByLabelText } = await render(
        <QueryClientProvider client={queryClient}>
          <SessionProvider>
            <InspectRevalidateScreen />
          </SessionProvider>
        </QueryClientProvider>,
      );

      // Sign code and road name
      expect(getByText('P.102')).toBeTruthy();
      expect(getByText('Đường Lê Lợi, Quận 1')).toBeTruthy();

      // Submit button should initially prompt for photo/video
      expect(getByLabelText('Tải lên ảnh hoặc video bằng chứng')).toBeTruthy();
    });

    it('completes on-site inspection flow: stamps GPS, selects status, enters note, and submits evidence', async () => {
      // Mock device location 10 meters away from target sign
      mockFetchFreshGpsPosition.mockResolvedValue([106.69555, 10.77695]);

      const queryClient = createIntegrationQueryClient();
      const { getByLabelText, getByText, findByText, findByLabelText } = await render(
        <QueryClientProvider client={queryClient}>
          <SessionProvider>
            <InspectRevalidateScreen />
          </SessionProvider>
        </QueryClientProvider>,
      );

      // 1. Open Android Gallery and select an asset
      const uploadArea = getByLabelText('Tải lên ảnh hoặc video');
      await act(async () => {
        fireEvent.press(uploadArea);
      });

      const assetItem = await findByLabelText('Select field-inspection.jpg');
      await act(async () => {
        fireEvent.press(assetItem);
      });

      // 2. Stamp live device GPS
      const stampGpsBtn = getByLabelText('Sử dụng GPS thiết bị hiện tại');
      await act(async () => {
        fireEvent.press(stampGpsBtn);
      });

      // Proximity distance should now be calculated and valid
      await waitFor(() => {
        expect(getByText(/Cách vị trí biển báo cũ \d+m/)).toBeTruthy();
      });

      // 3. Select status "Đã gỡ bỏ" (REMOVED)
      const removedOption = getByLabelText('Đã gỡ bỏ');
      await act(async () => {
        fireEvent.press(removedOption);
      });

      // 4. Enter notes
      const notesInput = getByLabelText('Ghi chú của người kiểm tra');
      await act(async () => {
        fireEvent.changeText(notesInput, 'Biển báo đã bị tháo do sửa chữa nút giao');
      });

      // 5. Submit evidence
      const submitBtn = getByLabelText('Gửi bằng chứng tái thẩm định');
      await act(async () => {
        fireEvent.press(submitBtn);
      });

      // Verify native upload was invoked
      await waitFor(() => {
        expect(mockUploadAsync).toHaveBeenCalledTimes(1);
        const [uploadUrl, fileUri, options] = mockUploadAsync.mock.calls[0];
        expect(uploadUrl).toContain('/revalidation/tasks/task-reval-101/evidence');
        expect(fileUri).toBe('file:///data/field-inspection.jpg');
        expect(options.parameters.evidenceType).toBe('REMOVED');
      });

      // Verify success banner and route redirection
      expect(await findByText(/Đã gửi bằng chứng!/)).toBeTruthy();
      await waitFor(
        () => {
          expect(mockReplace).toHaveBeenCalledWith(
            expect.objectContaining({
              pathname: '/work/submission-complete',
              params: expect.objectContaining({
                taskId: 'task-reval-101',
                signCode: 'P.102',
              }),
            }),
          );
        },
        { timeout: 3000 },
      );
    });

    it('displays error feedback when evidence upload fails on backend', async () => {
      mockFetchFreshGpsPosition.mockResolvedValue([106.6955, 10.7769]);

      mockUploadAsync.mockResolvedValueOnce({
        status: 400,
        body: JSON.stringify({ message: 'Tọa độ GPS không hợp lệ hoặc nằm ngoài khu vực' }),
      });

      const queryClient = createIntegrationQueryClient();
      const { getByLabelText, findByText, findByLabelText } = await render(
        <QueryClientProvider client={queryClient}>
          <SessionProvider>
            <InspectRevalidateScreen />
          </SessionProvider>
        </QueryClientProvider>,
      );

      // Open Android Gallery and select an asset
      await act(async () => {
        fireEvent.press(getByLabelText('Tải lên ảnh hoặc video'));
      });
      const assetItem = await findByLabelText('Select field-inspection.jpg');
      await act(async () => {
        fireEvent.press(assetItem);
        fireEvent.press(getByLabelText('Sử dụng GPS thiết bị hiện tại'));
      });

      const submitBtn = await waitFor(() => getByLabelText('Gửi bằng chứng tái thẩm định'));
      await act(async () => {
        fireEvent.press(submitBtn);
      });

      // Error message rendered
      const errorAlert = await findByText(/Tọa độ GPS không hợp lệ/);
      expect(errorAlert).toBeTruthy();
    });
  });

  // =========================================================================
  // 3. Reviewer Consensus Evaluation & Voting Workflow
  // =========================================================================
  describe('FIT-REVAL-03: Reviewer Queue Consensus & Voting Workflow', () => {
    beforeEach(() => {
      mockStorage.set('session', JSON.stringify(reviewerSession));
      mockSegments = ['(authenticated)', '(tabs)', 'work', 'revalidation-review'];
    });

    async function renderReviewerWorkflow() {
      const queryClient = createIntegrationQueryClient();
      return await render(
        <QueryClientProvider client={queryClient}>
          <SessionProvider>
            <RevalidationWorkflowProvider>
              <RevalidationReviewScreen />
            </RevalidationWorkflowProvider>
          </SessionProvider>
        </QueryClientProvider>,
      );
    }

    it('loads evidence queue from MSW and renders comparison view with telemetry', async () => {
      const { findByText, getByText } = await renderReviewerWorkflow();

      // Verified sign name from queue fixture
      expect(await findByText('Cấm đi ngược chiều')).toBeTruthy();
      expect(getByText(/Cách vị trí cũ 6m/)).toBeTruthy();
      expect(getByText('KẾT LUẬN: BÁO CÁO VẪN CÒN')).toBeTruthy();
      expect(getByText(/Đã có 2 người bình chọn trước bạn/)).toBeTruthy();
    });

    it('casts Agree vote: dispatches STILL_ACTIVE to MSW and advances to next evidence card', async () => {
      let capturedVoteBody: any = null;
      let capturedEvidenceId: string | null = null;

      server.use(
        http.post('*/revalidation/evidence/:evidenceId/vote', async ({ params, request }) => {
          capturedEvidenceId = String(params.evidenceId);
          capturedVoteBody = await request.json();
          return HttpResponse.json(
            {
              vote: { decision: 'STILL_ACTIVE', evidenceId: params.evidenceId },
              consensus: { evaluated: true },
            },
            { status: 201 },
          );
        }),
      );

      const { findByText, getByLabelText } = await renderReviewerWorkflow();
      await findByText('Cấm đi ngược chiều');

      // Click Agree button
      const agreeButton = getByLabelText('Đồng ý với kết luận của điều tra viên');
      await act(async () => {
        fireEvent.press(agreeButton);
      });

      // Verify MSW intercepted request
      await waitFor(() => {
        expect(capturedEvidenceId).toBe('evi-reval-001');
        expect(capturedVoteBody).toEqual({ decision: 'STILL_ACTIVE' });
      });

      // Advances to second candidate in queue: "Cấm rẽ trái"
      expect(await findByText('Cấm rẽ trái')).toBeTruthy();
      expect(getByLabelText('Đồng ý với kết luận của điều tra viên')).toBeTruthy();
    });

    it('handles Decline modal flow: selects counter-verdict, enters note, and submits decline vote', async () => {
      let capturedVoteBody: any = null;

      server.use(
        http.post('*/revalidation/evidence/:evidenceId/vote', async ({ request }) => {
          capturedVoteBody = await request.json();
          return HttpResponse.json({ vote: { decision: 'REMOVED' } }, { status: 201 });
        }),
      );

      const { findByText, getByLabelText, getByText } = await renderReviewerWorkflow();
      await findByText('Cấm đi ngược chiều');

      // Press Decline button
      const declineButton = getByLabelText('Từ chối kết luận của điều tra viên');
      await act(async () => {
        fireEvent.press(declineButton);
      });

      // Select counter choice "Biển báo đã bị gỡ bỏ"
      const removedChoice = await findByText('Biển báo đã bị gỡ bỏ');
      await act(async () => {
        fireEvent.press(removedChoice);
      });

      // Type reviewer explanation
      const noteInput = getByLabelText('Ghi chú quan sát của thẩm định viên');
      await act(async () => {
        fireEvent.changeText(noteInput, 'Ảnh thực địa không thấy biển P.102');
      });

      // Confirm Decline
      const confirmButton = getByText('Xác nhận từ chối');
      await act(async () => {
        fireEvent.press(confirmButton);
      });

      // Verify MSW intercepted REMOVED with note
      await waitFor(() => {
        expect(capturedVoteBody.decision).toBe('REMOVED');
        expect(capturedVoteBody.note).toBe('Ảnh thực địa không thấy biển P.102');
      });

      // Next candidate rendered
      expect(await findByText('Cấm rẽ trái')).toBeTruthy();
    });

    it('handles Report modal flow: flags invalid evidence as UNCLEAR with issue description', async () => {
      let capturedVoteBody: any = null;

      server.use(
        http.post('*/revalidation/evidence/:evidenceId/vote', async ({ request }) => {
          capturedVoteBody = await request.json();
          return HttpResponse.json({ vote: { decision: 'UNCLEAR' } }, { status: 201 });
        }),
      );

      const { findByText, getByLabelText, getByText } = await renderReviewerWorkflow();
      await findByText('Cấm đi ngược chiều');

      // Press Report button
      const reportButton = getByLabelText('Báo cáo minh chứng này');
      await act(async () => {
        fireEvent.press(reportButton);
      });

      // Select report reason
      const blurReason = await findByText('Ảnh mờ / Không rõ biển báo');
      await act(async () => {
        fireEvent.press(blurReason);
      });

      // Confirm report
      const sendReportBtn = getByText('Gửi báo cáo');
      await act(async () => {
        fireEvent.press(sendReportBtn);
      });

      await waitFor(() => {
        expect(capturedVoteBody.decision).toBe('UNCLEAR');
        expect(capturedVoteBody.note).toContain('Ảnh mờ / Không rõ biển báo');
      });
    });

    it('skips evidence without voting and advances the queue', async () => {
      const voteSpy = jest.fn();
      server.use(
        http.post('*/revalidation/evidence/:evidenceId/vote', () => {
          voteSpy();
          return HttpResponse.json({}, { status: 200 });
        }),
      );

      const { findByText, getByLabelText } = await renderReviewerWorkflow();
      await findByText('Cấm đi ngược chiều');

      // Click Skip button
      const skipButton = getByLabelText('Bỏ qua minh chứng này');
      await act(async () => {
        fireEvent.press(skipButton);
      });

      // Second candidate immediately shown without vote API call
      expect(await findByText('Cấm rẽ trái')).toBeTruthy();
      expect(voteSpy).not.toHaveBeenCalled();
    });

    it('renders empty queue state when server has no evidence pending review', async () => {
      server.use(
        http.get('*/revalidation/evidence/queue', () => {
          return HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 20 }, { status: 200 });
        }),
      );

      const { findByText } = await renderReviewerWorkflow();
      expect(await findByText('Đã đánh giá tất cả minh chứng')).toBeTruthy();
    });

    it('renders summary review metrics when all queue items have been judged', async () => {
      // Return single item in queue
      server.use(
        http.get('*/revalidation/evidence/queue', () => {
          return HttpResponse.json(
            { items: [mockEvidenceQueueResponse.items[0]], total: 1, page: 1, pageSize: 1 },
            { status: 200 },
          );
        }),
      );

      const { findByText, getByLabelText, getByText } = await renderReviewerWorkflow();
      await findByText('Cấm đi ngược chiều');

      // Cast agree vote on single item to complete the batch
      await act(async () => {
        fireEvent.press(getByLabelText('Đồng ý với kết luận của điều tra viên'));
      });

      // Completes queue and switches to batch summary view
      expect(await findByText('Tổng kết tái thẩm định')).toBeTruthy();
      expect(getByText(/Đã đánh giá 1 biển báo/)).toBeTruthy();

      // Finish reviews button navigates to completion screen
      const finishBtn = getByText('Hoàn tất');
      await act(async () => {
        fireEvent.press(finishBtn);
      });

      expect(mockReplace).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: '/work/submission-complete',
          params: expect.objectContaining({ type: 'review_revalidation' }),
        }),
      );
    });
  });

  // =========================================================================
  // 4. Consensus Finalization & Consensus Decisions Integration
  // =========================================================================
  describe('FIT-REVAL-04: Consensus Finalization & Decisions History', () => {
    it('calls finalizeRevalidationTask on POST /revalidation/tasks/:taskId/finalize', async () => {
      let capturedTaskId: string | null = null;
      server.use(
        http.post('*/revalidation/tasks/:taskId/finalize', ({ params }) => {
          capturedTaskId = String(params.taskId);
          return HttpResponse.json(
            {
              evaluated: true,
              winningDecision: 'STILL_ACTIVE',
              totalVotes: 3,
            },
            { status: 200 },
          );
        }),
      );

      const result = await finalizeRevalidationTask('task-reval-101');
      expect(capturedTaskId).toBe('task-reval-101');
      expect(result?.evaluated).toBe(true);
      expect(result?.winningDecision).toBe('STILL_ACTIVE');
    });

    it('fetches consensus decisions history for an evidence item', async () => {
      const decisions = await getEvidenceDecisions('evi-reval-001');
      expect(decisions).toHaveLength(1);
      expect(decisions[0].decision).toBe('STILL_ACTIVE');
      expect(decisions[0].note).toBe('Confirmed on field');
    });
  });
});
