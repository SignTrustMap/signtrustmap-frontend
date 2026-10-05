import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';

// Real Application Code Under Test
import { SubmissionReviewScreen } from '@/feature/review/pages/submission-review-screen';
import { ReviewWorkflowProvider } from '@/feature/review/context/review-workflow-provider';
import { SessionProvider, type AppSession } from '@/context/session-provider';
import { resolveS3Url } from '@/api/reviews/review-workflow';

// MSW Server and Fixtures
import {
  server,
  mockReviewCandidates,
  mockReviewQueueResponse,
  mockEmptyQueueResponse,
  REVIEW_VOTE_PATH,
  REVIEW_REPORT_PATH,
  REVIEW_SKIP_PATH,
  REVIEW_QUEUE_PATH,
} from '../mocks/msw';

// ---------------------------------------------------------------------------
// External Infrastructure Mocks
// ---------------------------------------------------------------------------
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
let mockSegments: string[] = ['(authenticated)', '(tabs)', 'work', 'submission-review'];

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    canGoBack: () => true,
  }),
  useSegments: () => mockSegments,
  useLocalSearchParams: () => ({}),
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

const mockRenderedImageSources: any[] = [];
jest.mock('expo-image', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Image: ({ source, ...props }: any) => {
      mockRenderedImageSources.push(source);
      return React.createElement(View, { testID: 'expo-image', ...props });
    },
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
    onPrimary: '#FFFFFF',
    surface: '#FFFFFF',
    neutral: '#F1F5F9',
    grey: '#64748B',
  }),
}));

// In-Memory Storage for Session Provider
const mockStorage = new Map<string, string>();
const authenticatedSession: AppSession = {
  accessToken: 'mock-reviewer-token-xyz',
  account: {
    id: 'reviewer-user-1',
    email: 'reviewer1@stm.dev',
    displayName: 'Reviewer One',
    roles: ['reviewer'],
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

// ---------------------------------------------------------------------------
// Helper: Render Review Flow with Real Providers
// ---------------------------------------------------------------------------
function createIntegrationQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false, gcTime: 0 },
    },
  });
}

async function renderReviewFlow() {
  const queryClient = createIntegrationQueryClient();
  return await render(
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <ReviewWorkflowProvider>
          <SubmissionReviewScreen />
        </ReviewWorkflowProvider>
      </SessionProvider>
    </QueryClientProvider>,
  );
}

// ---------------------------------------------------------------------------
// Test Suite: Review Flow Frontend Integration
// ---------------------------------------------------------------------------
describe('Frontend Review Flow Integration Tests (MSW)', () => {
  beforeAll(() => server.listen());

  beforeEach(() => {
    mockStorage.clear();
    mockStorage.set('session', JSON.stringify(authenticatedSession));
    mockRenderedImageSources.length = 0;
    jest.clearAllMocks();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => server.close());

  // =========================================================================
  // 1. URL Normalization: Passthrough vs. Fallback
  // =========================================================================
  describe('FIT-REV-03: S3 Direct Passthrough vs. CDN Fallback Normalization', () => {
    it('does NOT convert if the URL is already an S3 link (direct passthrough)', () => {
      const s3Url = 'https://s3.signmap.site/stm-sign-crops/crop-s3-direct.jpg';
      // Server returned S3 link directly -> must NOT perform conversion
      expect(resolveS3Url(s3Url)).toBe(s3Url);

      const awsS3Url = 'https://my-bucket.s3.amazonaws.com/crop.jpg';
      expect(resolveS3Url(awsS3Url)).toBe(awsS3Url);
    });

    it('converts legacy CDN links to S3 URLs as a fallback', () => {
      const cdnUrl = 'https://cdn.signmap.site/stm-sign-crops/crop-legacy.jpg';
      // Server returned CDN link -> fallback converts to S3 base
      expect(resolveS3Url(cdnUrl)).toBe('https://s3.signmap.site/stm-sign-crops/crop-legacy.jpg');

      const cdnNoBucket = 'https://cdn.signmap.site/crop-legacy.jpg';
      expect(resolveS3Url(cdnNoBucket)).toBe('https://s3.signmap.site/stm-sign-crops/crop-legacy.jpg');
    });
  });

  // =========================================================================
  // 2. Queue Loading & Display
  // =========================================================================
  describe('FIT-REV-01 & FIT-REV-02: Queue Ingestion & Empty Queue', () => {
    it('fetches candidate queue from MSW and displays the first candidate with S3 image', async () => {
      const { findByText, getByText } = await renderReviewFlow();

      // Verify first candidate title from MSW queue fixture
      const candidateTitle = await findByText(/Tốc độ tối đa 50 km\/h/i);
      expect(candidateTitle).toBeTruthy();

      // Verify counter displays progress
      expect(getByText(/REVIEWING 1 OF 3/i)).toBeTruthy();

      // Verify first candidate image received direct S3 url without unwanted conversion
      expect(mockRenderedImageSources).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ uri: 'https://s3.signmap.site/stm-sign-crops/crop-s3-direct.jpg' }),
        ]),
      );
    });

    it('renders completed state when review queue is empty', async () => {
      server.use(
        http.get(REVIEW_QUEUE_PATH, () => {
          return HttpResponse.json(mockEmptyQueueResponse, { status: 200 });
        }),
      );

      const { findByText } = await renderReviewFlow();

      const completeMsg = await findByText(/All reviews completed/i);
      expect(completeMsg).toBeTruthy();
    });
  });

  // =========================================================================
  // 3. Review Decisions: Approve (+1)
  // =========================================================================
  describe('FIT-REV-04: Approve Candidate (+1)', () => {
    it('dispatches vote: 1 to backend and optimistically advances to next card', async () => {
      let capturedVotePayload: any = null;
      let capturedCandidateId: string | null = null;

      server.use(
        http.post(REVIEW_VOTE_PATH, async ({ params, request }) => {
          capturedCandidateId = String(params.candidateId);
          capturedVotePayload = await request.json();
          return HttpResponse.json({ review: { vote: 1 } }, { status: 201 });
        }),
      );

      const { findByText, getByLabelText } = await renderReviewFlow();
      await findByText(/Tốc độ tối đa 50 km\/h/i);

      // Press Approve button
      const approveButton = getByLabelText('Approve submission');
      await fireEvent.press(approveButton);

      // Verify MSW intercepted request with vote: 1
      await waitFor(() => {
        expect(capturedCandidateId).toBe('cand-001');
        expect(capturedVotePayload).toEqual({ vote: 1 });
      });

      // Optimistic transition to second candidate
      const secondCandidate = await findByText(/Chỗ ngoặt nguy hiểm bên trái/i);
      expect(secondCandidate).toBeTruthy();
    });
  });

  // =========================================================================
  // 4. Review Decisions: Decline (-1) with Reason Selection
  // =========================================================================
  describe('FIT-REV-05: Decline with Bottom Sheet Reason', () => {
    it('opens decline bottom sheet, selects reason, and submits vote: -1 payload', async () => {
      let capturedDeclinePayload: any = null;

      server.use(
        http.post(REVIEW_VOTE_PATH, async ({ request }) => {
          capturedDeclinePayload = await request.json();
          return HttpResponse.json({ review: { vote: -1 } }, { status: 201 });
        }),
      );

      const { findByText, getByLabelText, getByText } = await renderReviewFlow();
      await findByText(/Tốc độ tối đa 50 km\/h/i);

      // 1. Press Decline button
      const declineButton = getByLabelText('Decline submission');
      await fireEvent.press(declineButton);

      // 2. Decline Sheet appears -> Select "Too Poor Image Quality"
      const reasonOption = await findByText(/Too Poor Image Quality/i);
      await fireEvent.press(reasonOption);

      // 3. Confirm Decline
      const confirmButton = getByText('Confirm Decline');
      await fireEvent.press(confirmButton);

      // 4. Verify MSW payload
      await waitFor(() => {
        expect(capturedDeclinePayload).toMatchObject({
          vote: -1,
          declineReason: 'Too Poor Image Quality',
        });
      });

      // 5. Card advances to Candidate 2
      expect(await findByText(/Chỗ ngoặt nguy hiểm bên trái/i)).toBeTruthy();
    });
  });

  // =========================================================================
  // 5. Review Decisions: Report Candidate
  // =========================================================================
  describe('FIT-REV-07: Report Candidate to Moderation', () => {
    it('opens report bottom sheet, submits note to moderation, and advances card', async () => {
      let capturedReportPayload: any = null;

      server.use(
        http.post(REVIEW_REPORT_PATH, async ({ request }) => {
          capturedReportPayload = await request.json();
          return HttpResponse.json({ reported: true, caseId: 'case-999' }, { status: 201 });
        }),
      );

      const { findByText, getByLabelText, getByText } = await renderReviewFlow();
      await findByText(/Tốc độ tối đa 50 km\/h/i);

      // 1. Press Report button
      const reportButton = getByLabelText('Report submission');
      await fireEvent.press(reportButton);

      // 2. Type note into report text input
      const noteInput = getByLabelText('Report Note, required');
      await fireEvent.changeText(noteInput, 'Signs in this submission appear duplicate and spoofed');

      // 3. Confirm Report
      const submitButton = getByText('Submit Report');
      await fireEvent.press(submitButton);

      // 4. Verify MSW payload
      await waitFor(() => {
        expect(capturedReportPayload).toEqual({
          reason: 'Signs in this submission appear duplicate and spoofed',
        });
      });

      // 5. Advances to Candidate 2
      expect(await findByText(/Chỗ ngoặt nguy hiểm bên trái/i)).toBeTruthy();
    });
  });

  // =========================================================================
  // 6. Review Decisions: Skip Candidate
  // =========================================================================
  describe('FIT-REV-08: Skip Candidate', () => {
    it('dispatches skip request and advances to the next candidate', async () => {
      let skipCalled = false;

      server.use(
        http.post(REVIEW_SKIP_PATH, () => {
          skipCalled = true;
          return HttpResponse.json({ skipped: true }, { status: 200 });
        }),
      );

      const { findByText, getByLabelText } = await renderReviewFlow();
      await findByText(/Tốc độ tối đa 50 km\/h/i);

      // Press Skip button
      const skipButton = getByLabelText('Skip submission (cannot identify)');
      await fireEvent.press(skipButton);

      await waitFor(() => {
        expect(skipCalled).toBe(true);
      });

      // Advances to Candidate 2
      expect(await findByText(/Chỗ ngoặt nguy hiểm bên trái/i)).toBeTruthy();
    });
  });

  // =========================================================================
  // 7. Undo Vote
  // =========================================================================
  describe('FIT-REV-09: Undo Last Review Action', () => {
    it('dispatches DELETE vote to backend and rolls back UI to previous candidate', async () => {
      let deleteCalledForCandidateId: string | null = null;

      server.use(
        http.delete(REVIEW_VOTE_PATH, ({ params }) => {
          deleteCalledForCandidateId = String(params.candidateId);
          return HttpResponse.json({ undone: true }, { status: 200 });
        }),
      );

      const { findByText, getByLabelText } = await renderReviewFlow();
      await findByText(/Tốc độ tối đa 50 km\/h/i);

      // 1. Approve Candidate 1
      const approveButton = getByLabelText('Approve submission');
      await fireEvent.press(approveButton);

      // 2. Candidate 2 is now shown
      await findByText(/Chỗ ngoặt nguy hiểm bên trái/i);

      // 3. Press Undo action
      const undoButton = getByLabelText('Undo last review action');
      await fireEvent.press(undoButton);

      // 4. Verify DELETE was dispatched for Candidate 1
      await waitFor(() => {
        expect(deleteCalledForCandidateId).toBe('cand-001');
      });

      // 5. Restores Candidate 1 as the active card
      expect(await findByText(/Tốc độ tối đa 50 km\/h/i)).toBeTruthy();
    });
  });

  // =========================================================================
  // 8. End-of-Queue Navigation
  // =========================================================================
  describe('FIT-REV-11: End-of-Queue Navigation', () => {
    it('navigates to /work/submission-summary when the final candidate is reviewed', async () => {
      // Mock queue with only 1 candidate
      server.use(
        http.get(REVIEW_QUEUE_PATH, () => {
          return HttpResponse.json(
            {
              items: [mockReviewCandidates[0]],
              total: 1,
              page: 1,
              pageSize: 20,
            },
            { status: 200 },
          );
        }),
      );

      const { findByText, getByLabelText } = await renderReviewFlow();
      await findByText(/Tốc độ tối đa 50 km\/h/i);

      // Review the only candidate
      const approveButton = getByLabelText('Approve submission');
      await fireEvent.press(approveButton);

      // Verify router navigated to summary
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/work/submission-summary');
      });
    });
  });
});

