import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// 1. Mock Navigation (expo-router)
// ---------------------------------------------------------------------------
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
let mockSegments: string[] = ['(authenticated)', '(tabs)', 'work', 'submission-review'];
let mockSearchParams: Record<string, string> = {};

jest.mock('expo-router', () => {
  const React = require('react');
  return {
    useRouter: () => ({
      push: mockPush,
      replace: mockReplace,
      back: mockBack,
    }),
    useSegments: () => mockSegments,
    useLocalSearchParams: () => mockSearchParams,
    useFocusEffect: (cb: any) => {
      React.useEffect(() => {
        return cb();
      }, [cb]);
    },
  };
});

// ---------------------------------------------------------------------------
// 2. Mock UI & Theme
// ---------------------------------------------------------------------------
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
    MaterialCommunityIcons: (props: any) => React.createElement(View, { testID: `icon-${props.name}`, ...props }),
  };
});

jest.mock('expo-symbols', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SymbolView: (props: any) => React.createElement(View, { testID: 'symbol-view', ...props }),
  };
});

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
    textSecondary: '#475569',
    placeholder: '#94A3B8',
    primary: '#2563EB',
    onPrimary: '#FFFFFF',
    surface: '#FFFFFF',
    neutral: '#F1F5F9',
    grey: '#64748B',
  }),
}));

// ---------------------------------------------------------------------------
// 3. Mock Session & External Hooks
// ---------------------------------------------------------------------------
const mockSession = {
  accessToken: 'mock-reviewer-token',
  account: {
    id: 'reviewer-user-1',
    roles: ['reviewer'],
  },
};

jest.mock('@/context/session-provider', () => ({
  ACCOUNT_ROLES: ['driver', 'surveyor', 'reviewer'],
  useSession: () => ({
    session: mockSession,
    currentRole: 'reviewer',
    switchRole: jest.fn(),
  }),
}));

const mockInvalidateWalletAndStats = jest.fn();
jest.mock('@/feature/credits/hooks/use-wallet', () => ({
  useInvalidateWalletAndStats: () => mockInvalidateWalletAndStats,
}));

jest.mock('@/feature/revalidation/hooks/use-revalidation', () => ({
  useGetRevalidationEvidenceQueue: () => ({ data: { total: 2 } }),
  useGetFirstRevalidationSign: () => ({ data: null }),
}));

jest.mock('@/feature/upload/hooks/use-survey-submission', () => ({
  useGetMyPendingSubmissions: () => ({ data: { pending: 1, countsByStatus: { DRAFT: 0 } } }),
  useGetMySubmissions: () => ({ data: [] }),
  useGetMySurveyStats: () => ({ data: { revalidationAvailable: 0 } }),
}));

// ---------------------------------------------------------------------------
// 4. Mock Review Data & Review Hooks
// ---------------------------------------------------------------------------
const defaultCandidate1 = {
  id: 'cand-1',
  title: 'Speed Limit 50 (P.127)',
  captured: 'May 10, 2:30 PM',
  location: '123 Le Loi, District 1',
  surveyorId: 'surveyor-1',
  image: { uri: 'https://s3.signmap.site/stm-sign-crops/crop-1.jpg' },
};

const defaultCandidate2 = {
  id: 'cand-2',
  title: 'No Parking (P.130)',
  captured: 'May 10, 2:45 PM',
  location: '456 Nguyen Hue, District 1',
  surveyorId: 'surveyor-2',
  image: { uri: 'https://s3.signmap.site/stm-sign-crops/crop-2.jpg' },
};

const defaultCandidate3 = {
  id: 'cand-3',
  title: 'Stop (P.122)',
  captured: 'May 10, 3:00 PM',
  location: '789 Tran Hung Dao, District 5',
  surveyorId: 'surveyor-3',
  image: { uri: 'https://s3.signmap.site/stm-sign-crops/crop-3.jpg' },
};

let mockQueueSubmissions = [defaultCandidate1, defaultCandidate2, defaultCandidate3];
let mockHistorySubmissions: any[] = [];
let mockQueueTotal = 3;

const mockCastVote = jest.fn().mockResolvedValue({ success: true });
const mockReportCandidate = jest.fn().mockResolvedValue({ success: true });
const mockSkipSign = jest.fn().mockResolvedValue({ success: true });
const mockUndoVote = jest.fn().mockResolvedValue({ success: true });
const mockRefetchQueue = jest.fn();
const mockRefetchHistory = jest.fn();

const defaultCatalog = {
  categories: [
    { id: 1, code: 'WARN', nameEn: 'Warning Signs', nameVi: 'Biển báo nguy hiểm', description: 'Warn of hazards' },
    { id: 2, code: 'PROHIB', nameEn: 'Prohibitory Signs', nameVi: 'Biển báo cấm', description: 'Prohibit actions' },
    { id: 3, code: 'GUIDE', nameEn: 'Guide Signs', nameVi: 'Biển chỉ dẫn', description: 'Guide drivers' },
  ],
  signs: [
    {
      id: 101,
      categoryId: 1,
      nameEn: 'Dangerous Curve Ahead',
      nameVi: 'Chỗ ngoặt nguy hiểm',
      signCode: 'W.201a',
      description: 'Curve to the left ahead',
      representativeImageKey: 'https://s3.signmap.site/catalog/w201a.png',
      category: { id: 1, code: 'WARN', nameEn: 'Warning Signs', nameVi: 'Biển báo nguy hiểm', description: null },
    },
    {
      id: 102,
      categoryId: 2,
      nameEn: 'No Left Turn',
      nameVi: 'Cấm rẽ trái',
      signCode: 'P.123a',
      description: 'Vehicles must not turn left',
      representativeImageKey: 'https://s3.signmap.site/catalog/p123a.png',
      category: { id: 2, code: 'PROHIB', nameEn: 'Prohibitory Signs', nameVi: 'Biển báo cấm', description: null },
    },
    {
      id: 103,
      categoryId: 3,
      nameEn: 'Parking Area',
      nameVi: 'Nơi đỗ xe',
      signCode: 'I.408',
      description: 'Indicates designated parking space',
      representativeImageKey: 'https://s3.signmap.site/catalog/i408.png',
      category: { id: 3, code: 'GUIDE', nameEn: 'Guide Signs', nameVi: 'Biển chỉ dẫn', description: null },
    },
  ],
};

let mockCatalogData = defaultCatalog;
let mockCatalogLoading = false;
let mockCatalogError: Error | null = null;

jest.mock('@/feature/review/hooks/use-review', () => ({
  useGetReviewQueue: () => ({
    data: {
      submissions: mockQueueSubmissions,
      total: mockQueueTotal,
    },
    refetch: mockRefetchQueue,
    isLoading: false,
  }),
  useGetReviewHistory: () => ({
    data: mockHistorySubmissions,
    refetch: mockRefetchHistory,
    isLoading: false,
  }),
  useCastVoteOnSignCandidate: () => ({
    mutateAsync: mockCastVote,
  }),
  useReportSignCandidate: () => ({
    mutateAsync: mockReportCandidate,
  }),
  useSkipSign: () => ({
    mutateAsync: mockSkipSign,
  }),
  useUndoVoteOnCandidate: () => ({
    mutateAsync: mockUndoVote,
  }),
  useGetCatalog: () => ({
    data: mockCatalogData,
    isPending: mockCatalogLoading,
    error: mockCatalogError,
  }),
  useGetMyReviewerStats: () => ({
    data: {
      reviewerId: 'reviewer-user-1',
      reliabilityScore: 98,
      totalReviews: 45,
      approved: 35,
      rejected: 10,
      accuracyRate: 95,
      currentStreak: 7,
    },
    isPending: false,
  }),
}));

// ---------------------------------------------------------------------------
// Imports of components to test
// ---------------------------------------------------------------------------
import { WorkScreen } from '@/feature/work/pages/work-screen';
import { ReviewerWorkPanel } from '@/feature/review/components/reviewer-work-panel';
import {
  ReviewWorkflowProvider,
  ReviewWorkflowContext,
  type ReviewWorkflowContextValue,
} from '@/feature/review/context/review-workflow-provider';
import { SubmissionReviewScreen } from '@/feature/review/pages/submission-review-screen';
import { SubmissionSummaryScreen } from '@/feature/review/pages/submission-summary-screen';
import { SubmissionFinishedScreen } from '@/feature/review/pages/submission-finished-screen';
import { SignCatalogScreen } from '@/feature/review/pages/sign-catalog-screen';
import { ReviewBottomTabs } from '@/feature/review/components/review-bottom-tabs';
import { resolveS3Url, resolveCdnUrl } from '@/api/reviews/review-workflow';

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------
describe('Review Flow: Comprehensive Unit Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSegments = ['(authenticated)', '(tabs)', 'work', 'submission-review'];
    mockSearchParams = {};
    mockQueueSubmissions = [defaultCandidate1, defaultCandidate2, defaultCandidate3];
    mockHistorySubmissions = [];
    mockQueueTotal = 3;
    mockCatalogData = defaultCatalog;
    mockCatalogLoading = false;
    mockCatalogError = null;

    mockRefetchQueue.mockImplementation(async () => ({
      data: { submissions: mockQueueSubmissions, total: mockQueueTotal },
    }));
    mockRefetchHistory.mockImplementation(async () => ({
      data: mockHistorySubmissions,
    }));
  });

  afterEach(async () => {
    // Microtask drain to keep test environments cleanly separated
    await new Promise((resolve) => setTimeout(resolve, 30));
  });

  // =========================================================================
  // CASE 1: Reviewer Work Entry & Navigation
  // =========================================================================
  describe('Case 1: Reviewer Work Entry & Navigation', () => {
    it('renders reviewer action cards with queue count badge and navigates to submission review', async () => {
      const { getByText, getByLabelText } = await render(<WorkScreen currentRole="reviewer" />);

      expect(getByText('Pending Reviews')).toBeTruthy();
      expect(getByText('3 NEW')).toBeTruthy();
      expect(getByText('Pending Revalidation Evidence')).toBeTruthy();
      expect(getByText('Traffic Sign Catalog')).toBeTruthy();

      const heroButton = getByLabelText('Review pending submissions');
      await fireEvent.press(heroButton);

      expect(mockPush).toHaveBeenCalledWith('/work/submission-review');
    });

    it('navigates to /work/submission-review when ReviewerWorkPanel action card is pressed', async () => {
      const { getByText } = await render(<ReviewerWorkPanel />);

      const panelCard = getByText('Pending Reviews');
      expect(panelCard).toBeTruthy();

      await fireEvent.press(panelCard);
      expect(mockPush).toHaveBeenCalledWith('/work/submission-review');
    });
  });

  // =========================================================================
  // CASE 2: Review Screen Components & Initial Queue Hydration
  // =========================================================================
  describe('Case 2: Review Screen Components & Initial Queue Hydration', () => {
    it('renders top progress bar, counter text, candidate title, location, and 4-way diamond buttons', async () => {
      const { getByText, getByLabelText } = await render(
        <ReviewWorkflowProvider>
          <SubmissionReviewScreen />
        </ReviewWorkflowProvider>
      );

      await waitFor(() => {
        expect(getByText('REVIEWING 1 OF 3')).toBeTruthy();
        expect(getByText('Speed Limit 50 (P.127)')).toBeTruthy();
        expect(getByText(/May 10, 2:30 PM/)).toBeTruthy();
      });

      expect(getByLabelText('Go back')).toBeTruthy();
      expect(getByLabelText('Skip submission (cannot identify)')).toBeTruthy();
      expect(getByLabelText('Decline submission')).toBeTruthy();
      expect(getByLabelText('Approve submission')).toBeTruthy();
      expect(getByLabelText('Report submission')).toBeTruthy();
    });

    it('renders loading skeleton when state is loading or queue is fetching with no items', async () => {
      const { getByLabelText } = await render(
        <ReviewWorkflowProvider>
          <SubmissionReviewScreen state="loading" />
        </ReviewWorkflowProvider>
      );

      expect(getByLabelText('Loading submissions')).toBeTruthy();
    });
  });

  // =========================================================================
  // CASE 3: Approve Review Action
  // =========================================================================
  describe('Case 3: Approve Review Action', () => {
    it('approves active sign candidate, calls castVote with vote 1, displays toast, and advances deck', async () => {
      const { getByLabelText, getByText } = await render(
        <ReviewWorkflowProvider>
          <SubmissionReviewScreen />
        </ReviewWorkflowProvider>
      );

      await waitFor(() => {
        expect(getByText('Speed Limit 50 (P.127)')).toBeTruthy();
      });

      const approveButton = getByLabelText('Approve submission');
      await fireEvent.press(approveButton);

      await waitFor(() => {
        expect(mockCastVote).toHaveBeenCalledWith(
          expect.objectContaining({
            params: { candidateId: 'cand-1' },
            request: { vote: 1 },
          })
        );
        expect(getByText('Sign approved')).toBeTruthy();
        // Deck advances to candidate 2
        expect(getByText('No Parking (P.130)')).toBeTruthy();
        expect(getByText('REVIEWING 2 OF 3')).toBeTruthy();
      });
    });
  });

  // =========================================================================
  // CASE 4: Decline Review Action with Decline Reason Modal
  // =========================================================================
  describe('Case 4: Decline Review Action with Decline Reason Modal', () => {
    it('opens decline modal, selects reason, confirms decline, and dispatches vote with decline details', async () => {
      const { getByLabelText, getByText } = await render(
        <ReviewWorkflowProvider>
          <SubmissionReviewScreen />
        </ReviewWorkflowProvider>
      );

      await waitFor(() => {
        expect(getByText('Speed Limit 50 (P.127)')).toBeTruthy();
      });

      await fireEvent.press(getByLabelText('Decline submission'));

      await waitFor(() => {
        expect(getByText('Decline Reason')).toBeTruthy();
        expect(getByText('Sign Not Found')).toBeTruthy();
      });

      // Select standard reason
      await fireEvent.press(getByText('Sign Not Found'));

      // Confirm decline
      await fireEvent.press(getByText('Confirm Decline'));

      await waitFor(() => {
        expect(mockCastVote).toHaveBeenCalledWith(
          expect.objectContaining({
            params: { candidateId: 'cand-1' },
            request: {
              vote: -1,
              declineReason: 'Sign Not Found',
            },
          })
        );
        expect(getByText('Sign declined')).toBeTruthy();
        expect(getByText('No Parking (P.130)')).toBeTruthy();
      });
    });

    it('requires text input when "Other" decline reason is chosen before allowing confirmation', async () => {
      const { getByLabelText, getByText, getByPlaceholderText } = await render(
        <ReviewWorkflowProvider>
          <SubmissionReviewScreen />
        </ReviewWorkflowProvider>
      );

      await waitFor(() => {
        expect(getByText('Speed Limit 50 (P.127)')).toBeTruthy();
      });

      await fireEvent.press(getByLabelText('Decline submission'));

      await waitFor(() => {
        expect(getByText('Other')).toBeTruthy();
      });

      await fireEvent.press(getByText('Other'));

      const input = getByPlaceholderText('Please specify the reason');
      expect(input).toBeTruthy();

      // Type detail reason
      await fireEvent.changeText(input, 'Sign is obscured by tree branches');
      await fireEvent.press(getByText('Confirm Decline'));

      await waitFor(() => {
        expect(mockCastVote).toHaveBeenCalledWith(
          expect.objectContaining({
            params: { candidateId: 'cand-1' },
            request: {
              vote: -1,
              declineReason: 'Other',
              declineNote: 'Sign is obscured by tree branches',
            },
          })
        );
      });
    });
  });

  // =========================================================================
  // CASE 5: Report Review Action with Reason Note Modal
  // =========================================================================
  describe('Case 5: Report Review Action with Reason Note Modal', () => {
    it('opens report modal, validates report note, and dispatches reportSignCandidate API', async () => {
      const { getByLabelText, getByText, getByPlaceholderText } = await render(
        <ReviewWorkflowProvider>
          <SubmissionReviewScreen />
        </ReviewWorkflowProvider>
      );

      await waitFor(() => {
        expect(getByText('Speed Limit 50 (P.127)')).toBeTruthy();
      });

      await fireEvent.press(getByLabelText('Report submission'));

      await waitFor(() => {
        expect(getByText('Report Submission')).toBeTruthy();
      });

      const noteInput = getByPlaceholderText('Describe the issue with this submission');
      await fireEvent.changeText(noteInput, 'Vandalized sign candidate requiring supervisor check');

      await fireEvent.press(getByText('Submit Report'));

      await waitFor(() => {
        expect(mockReportCandidate).toHaveBeenCalledWith(
          expect.objectContaining({
            params: { candidateId: 'cand-1' },
            request: { reason: 'Vandalized sign candidate requiring supervisor check' },
          })
        );
        expect(getByText('Sign reported')).toBeTruthy();
        expect(getByText('No Parking (P.130)')).toBeTruthy();
      });
    });
  });

  // =========================================================================
  // CASE 6: Skip Review Action (Cannot Identify)
  // =========================================================================
  describe('Case 6: Skip Review Action (Cannot Identify)', () => {
    it('dispatches skipSign, displays toast, and advances deck', async () => {
      const { getByLabelText, getByText } = await render(
        <ReviewWorkflowProvider>
          <SubmissionReviewScreen />
        </ReviewWorkflowProvider>
      );

      await waitFor(() => {
        expect(getByText('Speed Limit 50 (P.127)')).toBeTruthy();
      });

      const skipButton = getByLabelText('Skip submission (cannot identify)');
      await fireEvent.press(skipButton);

      await waitFor(() => {
        expect(mockSkipSign).toHaveBeenCalledWith(
          expect.objectContaining({
            params: { candidateId: 'cand-1' },
          })
        );
        expect(getByText('Sign skipped (cannot identify)')).toBeTruthy();
        expect(getByText('No Parking (P.130)')).toBeTruthy();
      });
    });
  });

  // =========================================================================
  // CASE 7: Undo Last Review Action
  // =========================================================================
  describe('Case 7: Undo Last Review Action', () => {
    it('shows undo button after an action, restores previous card, and calls undoVoteOnCandidate', async () => {
      const { getByLabelText, getByText, queryByLabelText } = await render(
        <ReviewWorkflowProvider>
          <SubmissionReviewScreen />
        </ReviewWorkflowProvider>
      );

      await waitFor(() => {
        expect(getByText('Speed Limit 50 (P.127)')).toBeTruthy();
      });

      // Initially no undo button
      expect(queryByLabelText('Undo last review action')).toBeNull();

      // Approve candidate 1
      await fireEvent.press(getByLabelText('Approve submission'));

      await waitFor(() => {
        expect(getByText('No Parking (P.130)')).toBeTruthy();
        expect(getByLabelText('Undo last review action')).toBeTruthy();
      });

      // Click undo
      await fireEvent.press(getByLabelText('Undo last review action'));

      await waitFor(() => {
        expect(mockUndoVote).toHaveBeenCalledWith(
          expect.objectContaining({
            params: { candidateId: 'cand-1' },
          })
        );
        // Restored candidate 1 to active card
        expect(getByText('Speed Limit 50 (P.127)')).toBeTruthy();
        expect(getByText('REVIEWING 1 OF 3')).toBeTruthy();
      });
    });
  });

  // =========================================================================
  // CASE 8: Image Zoom Modal Interaction
  // =========================================================================
  describe('Case 8: Image Zoom Modal Interaction', () => {
    it('opens full-screen image zoom modal when candidate image is pressed, and closes on close button', async () => {
      const { getByLabelText, getByText, getAllByLabelText, queryAllByLabelText } = await render(
        <ReviewWorkflowProvider>
          <SubmissionReviewScreen />
        </ReviewWorkflowProvider>
      );

      await waitFor(() => {
        expect(getByText('Speed Limit 50 (P.127)')).toBeTruthy();
      });

      const imageButton = getByLabelText('Sign submission image. Tap to enlarge.');
      await fireEvent.press(imageButton);

      await waitFor(() => {
        expect(getAllByLabelText('Close enlarged view').length).toBeGreaterThanOrEqual(1);
      });

      const closeButtons = getAllByLabelText('Close enlarged view');
      await fireEvent.press(closeButtons[0]);

      await waitFor(() => {
        expect(queryAllByLabelText('Close enlarged view')).toHaveLength(0);
      });
    });
  });

  // =========================================================================
  // CASE 9: Queue Completion & Navigation to Summary
  // =========================================================================
  describe('Case 9: Queue Completion & Navigation to Summary', () => {
    it('automatically transitions to /work/submission-summary when reviewing the final card in queue', async () => {
      mockQueueSubmissions = [defaultCandidate1];
      mockQueueTotal = 1;

      const { getByLabelText, getByText } = await render(
        <ReviewWorkflowProvider>
          <SubmissionReviewScreen />
        </ReviewWorkflowProvider>
      );

      await waitFor(() => {
        expect(getByText('Speed Limit 50 (P.127)')).toBeTruthy();
      });

      await fireEvent.press(getByLabelText('Approve submission'));

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/work/submission-summary');
      });
    });

    it('renders "All reviews completed" with a "View Summary" button when queue is finished', async () => {
      mockQueueSubmissions = [];
      mockQueueTotal = 0;

      const { getByText } = await render(
        <ReviewWorkflowProvider>
          <SubmissionReviewScreen />
        </ReviewWorkflowProvider>
      );

      await waitFor(() => {
        expect(getByText('All reviews completed')).toBeTruthy();
        expect(getByText('You have reviewed all available sign submissions.')).toBeTruthy();
      });
    });
  });

  // =========================================================================
  // CASE 10: Submission Summary Screen & Metrics Breakdown
  // =========================================================================
  describe('Case 10: Submission Summary Screen & Metrics Breakdown', () => {
    it('displays metrics breakdown for approved, declined, reported, and skipped reviews and lists reviewed cards', async () => {
      const mockHistory = [
        { action: 'approved' as const, submission: defaultCandidate1 },
        { action: 'approved' as const, submission: defaultCandidate2 },
        { action: 'declined' as const, submission: defaultCandidate3 },
      ];

      const mockWorkflowValue: ReviewWorkflowContextValue = {
        beginSubmissionCheck: jest.fn(),
        checkedReviewIndex: 0,
        checkingSubmission: false,
        isCheckingSubmission: false,
        completeCurrentReview: jest.fn().mockResolvedValue(true),
        error: undefined,
        finishSubmissionCheck: jest.fn(),
        goToNextCheckedReview: jest.fn(),
        goToPreviousCheckedReview: jest.fn(),
        isLoading: false,
        pendingSubmissions: [],
        refresh: jest.fn().mockResolvedValue(undefined),
        recheckingPreviousAction: undefined,
        recheckingReviewIndex: undefined,
        recheckingSubmission: false,
        isRecheckingSubmission: false,
        resetReviewWorkflow: jest.fn().mockResolvedValue(undefined),
        reviewCheckedSubmissionAgain: jest.fn().mockResolvedValue(false),
        reviewHistory: mockHistory,
        sessionReviewCount: 3,
        skipCurrentReview: jest.fn().mockResolvedValue(true),
        totalSubmissions: 3,
        undoLastReview: jest.fn().mockResolvedValue(true),
      };

      const { getByText } = await render(
        <ReviewWorkflowContext.Provider value={mockWorkflowValue}>
          <SubmissionSummaryScreen />
        </ReviewWorkflowContext.Provider>
      );

      expect(getByText('Submission Summary')).toBeTruthy();
      expect(getByText(/3 signs reviewed/)).toBeTruthy();

      // Metric counts
      expect(getByText('APPROVED')).toBeTruthy();
      expect(getByText('DECLINED')).toBeTruthy();
      expect(getByText('REPORTED')).toBeTruthy();
      expect(getByText('SKIPPED')).toBeTruthy();

      // Reviewed sign rows
      expect(getByText('Speed Limit 50 (P.127)')).toBeTruthy();
      expect(getByText('No Parking (P.130)')).toBeTruthy();
      expect(getByText('Stop (P.122)')).toBeTruthy();
    });
  });

  // =========================================================================
  // CASE 11: Recheck Flow from Summary (beginSubmissionCheck)
  // =========================================================================
  describe('Case 11: Recheck Flow from Summary (beginSubmissionCheck)', () => {
    it('clicking "Check submission" resets history into pending queue and navigates to submission review', async () => {
      const mockBeginCheck = jest.fn();
      const mockWorkflowValue: ReviewWorkflowContextValue = {
        beginSubmissionCheck: mockBeginCheck,
        checkedReviewIndex: 0,
        checkingSubmission: false,
        isCheckingSubmission: false,
        completeCurrentReview: jest.fn().mockResolvedValue(true),
        error: undefined,
        finishSubmissionCheck: jest.fn(),
        goToNextCheckedReview: jest.fn(),
        goToPreviousCheckedReview: jest.fn(),
        isLoading: false,
        pendingSubmissions: [],
        refresh: jest.fn().mockResolvedValue(undefined),
        recheckingPreviousAction: undefined,
        recheckingReviewIndex: undefined,
        recheckingSubmission: false,
        isRecheckingSubmission: false,
        resetReviewWorkflow: jest.fn().mockResolvedValue(undefined),
        reviewCheckedSubmissionAgain: jest.fn().mockResolvedValue(false),
        reviewHistory: [{ action: 'approved', submission: defaultCandidate1 }],
        sessionReviewCount: 1,
        skipCurrentReview: jest.fn().mockResolvedValue(true),
        totalSubmissions: 1,
        undoLastReview: jest.fn().mockResolvedValue(true),
      };

      const { getByText } = await render(
        <ReviewWorkflowContext.Provider value={mockWorkflowValue}>
          <SubmissionSummaryScreen />
        </ReviewWorkflowContext.Provider>
      );

      const checkButton = getByText('Check submission');
      await fireEvent.press(checkButton);

      expect(mockBeginCheck).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/work/submission-review');
    });
  });

  // =========================================================================
  // CASE 12: Final Submission & Route Transition (SubmissionFinishedScreen)
  // =========================================================================
  describe('Case 12: Final Submission & Route Transition (SubmissionFinishedScreen)', () => {
    it('clicking Submit on summary resets workflow, invalidates stats, and navigates to submission-finish', async () => {
      const mockReset = jest.fn().mockResolvedValue(undefined);
      const mockWorkflowValue: ReviewWorkflowContextValue = {
        beginSubmissionCheck: jest.fn(),
        checkedReviewIndex: 0,
        checkingSubmission: false,
        isCheckingSubmission: false,
        completeCurrentReview: jest.fn().mockResolvedValue(true),
        error: undefined,
        finishSubmissionCheck: jest.fn(),
        goToNextCheckedReview: jest.fn(),
        goToPreviousCheckedReview: jest.fn(),
        isLoading: false,
        pendingSubmissions: [],
        refresh: jest.fn().mockResolvedValue(undefined),
        recheckingPreviousAction: undefined,
        recheckingReviewIndex: undefined,
        recheckingSubmission: false,
        isRecheckingSubmission: false,
        resetReviewWorkflow: mockReset,
        reviewCheckedSubmissionAgain: jest.fn().mockResolvedValue(false),
        reviewHistory: [
          { action: 'approved', submission: defaultCandidate1 },
          { action: 'declined', submission: defaultCandidate2 },
        ],
        sessionReviewCount: 2,
        skipCurrentReview: jest.fn().mockResolvedValue(true),
        totalSubmissions: 2,
        undoLastReview: jest.fn().mockResolvedValue(true),
      };

      const { getByText } = await render(
        <ReviewWorkflowContext.Provider value={mockWorkflowValue}>
          <SubmissionSummaryScreen />
        </ReviewWorkflowContext.Provider>
      );

      const submitButton = getByText('Submit');
      await fireEvent.press(submitButton);

      expect(mockReset).toHaveBeenCalled();
      expect(mockInvalidateWalletAndStats).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/work/submission-finish',
        params: { count: '2' },
      });
    });

    it('renders SubmissionFinishedScreen with review count and navigation buttons', async () => {
      const { getByText } = await render(<SubmissionFinishedScreen reviewedCount={3} />);

      expect(getByText('Submission complete')).toBeTruthy();
      expect(getByText(/3 sign reviews have been submitted successfully/)).toBeTruthy();

      await fireEvent.press(getByText('Return to home'));
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/work',
        params: { currentRole: 'reviewer' },
      });

      await fireEvent.press(getByText('Review more signs'));
      expect(mockReplace).toHaveBeenCalledWith('/work/submission-review');
    });
  });

  // =========================================================================
  // CASE 13: Sign Catalog Screen & Category Filtering
  // =========================================================================
  describe('Case 13: Sign Catalog Screen & Category Filtering', () => {
    it('renders category chips and filters sign list by category when pressed', async () => {
      const { getByText, queryByText } = await render(<SignCatalogScreen />);

      expect(getByText('Sign Catalog')).toBeTruthy();
      expect(getByText('All Signs')).toBeTruthy();
      expect(getByText('Warning Signs')).toBeTruthy();
      expect(getByText('Prohibitory Signs')).toBeTruthy();
      expect(getByText('Guide Signs')).toBeTruthy();

      // Initially displays all signs
      expect(getByText('Dangerous Curve Ahead')).toBeTruthy();
      expect(getByText('No Left Turn')).toBeTruthy();
      expect(getByText('Parking Area')).toBeTruthy();

      // Filter by Warning Signs (Category 1)
      await fireEvent.press(getByText('Warning Signs'));

      await waitFor(() => {
        expect(getByText('Dangerous Curve Ahead')).toBeTruthy();
        expect(queryByText('No Left Turn')).toBeNull();
        expect(queryByText('Parking Area')).toBeNull();
      });

      // Filter by Prohibitory Signs (Category 2)
      await fireEvent.press(getByText('Prohibitory Signs'));
      await waitFor(() => {
        expect(queryByText('Dangerous Curve Ahead')).toBeNull();
        expect(getByText('No Left Turn')).toBeTruthy();
        expect(queryByText('Parking Area')).toBeNull();
      });

      // Reset to All Signs
      await fireEvent.press(getByText('All Signs'));
      await waitFor(() => {
        expect(getByText('Dangerous Curve Ahead')).toBeTruthy();
        expect(getByText('No Left Turn')).toBeTruthy();
        expect(getByText('Parking Area')).toBeTruthy();
      });
    });
  });

  // =========================================================================
  // CASE 14: Sign Catalog Search Filtering & Empty State
  // =========================================================================
  describe('Case 14: Sign Catalog Search Filtering & Empty State', () => {
    it('filters sign cards in real-time by search query across name and code', async () => {
      const { getByPlaceholderText, getByText, queryByText } = await render(<SignCatalogScreen />);

      const searchInput = getByPlaceholderText('Search signs...');

      // Search by partial English name
      await fireEvent.changeText(searchInput, 'Curve');
      await waitFor(() => {
        expect(getByText('Dangerous Curve Ahead')).toBeTruthy();
        expect(queryByText('No Left Turn')).toBeNull();
      });

      // Search by sign code
      await fireEvent.changeText(searchInput, 'P.123');
      await waitFor(() => {
        expect(queryByText('Dangerous Curve Ahead')).toBeNull();
        expect(getByText('No Left Turn')).toBeTruthy();
      });

      // Search with non-matching query -> Empty state
      await fireEvent.changeText(searchInput, 'xyz123random');
      await waitFor(() => {
        expect(getByText('No signs found')).toBeTruthy();
        expect(getByText('Try another English name, description, or category.')).toBeTruthy();
      });
    });
  });

  // =========================================================================
  // CASE 15: Review Bottom Tabs Navigation
  // =========================================================================
  describe('Case 15: Review Bottom Tabs Navigation', () => {
    it('renders Review and Catalog tabs and handles route transitions', async () => {
      const { getByText } = await render(<ReviewBottomTabs activeTab="review" />);

      expect(getByText('Review')).toBeTruthy();
      expect(getByText('Catalog')).toBeTruthy();

      await fireEvent.press(getByText('Catalog'));
      expect(mockReplace).toHaveBeenCalledWith('/work/sign-catalog');
    });

    it('navigates to /work/submission-review when Review tab is clicked from catalog', async () => {
      const { getByText } = await render(<ReviewBottomTabs activeTab="catalog" />);

      await fireEvent.press(getByText('Review'));
      expect(mockReplace).toHaveBeenCalledWith('/work/submission-review');
    });
  });

  // =========================================================================
  // CASE 16: Resilience & URL Normalization
  // =========================================================================
  describe('Case 16: Resilience & URL Normalization', () => {
    it('resolves S3 and CDN URLs properly with bucket prefixes and handles edge cases', () => {
      // CDN with existing bucket
      expect(resolveS3Url('https://cdn.signmap.site/stm-sign-crops/crop.jpg')).toBe(
        'https://s3.signmap.site/stm-sign-crops/crop.jpg'
      );

      // CDN without bucket prefix adds stm-sign-crops
      expect(resolveS3Url('https://cdn.signmap.site/crop.jpg')).toBe(
        'https://s3.signmap.site/stm-sign-crops/crop.jpg'
      );

      // Relative path without bucket adds stm-sign-crops
      expect(resolveS3Url('crop.jpg')).toBe(
        'https://s3.signmap.site/stm-sign-crops/crop.jpg'
      );

      // Empty or null
      expect(resolveS3Url(null)).toBe('');
      expect(resolveS3Url(undefined)).toBe('');

      // Alias
      expect(resolveCdnUrl('crop.jpg')).toBe('https://s3.signmap.site/stm-sign-crops/crop.jpg');
    });

    it('handles queue loading network error gracefully without crashing provider', async () => {
      mockRefetchQueue.mockRejectedValueOnce(new Error('Network unavailable'));

      const { getByText } = await render(
        <ReviewWorkflowProvider>
          <SubmissionReviewScreen />
        </ReviewWorkflowProvider>
      );

      await waitFor(() => {
        // Displays empty or complete state gracefully
        expect(getByText('All reviews completed')).toBeTruthy();
      });
    });
  });
});
