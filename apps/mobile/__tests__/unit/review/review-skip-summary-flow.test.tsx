import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { SubmissionReviewScreen } from '@/feature/review/pages/submission-review-screen';
import { SubmissionSummaryScreen } from '@/feature/review/pages/submission-summary-screen';
import {
  ReviewWorkflowContext,
  ReviewWorkflowProvider,
  useReviewWorkflow,
  type ReviewWorkflowContextValue,
} from '@/feature/review/context/review-workflow-provider';
import type { ReviewSubmission } from '@/api/reviews/review-workflow';

// ---------------------------------------------------------------------------
// 1. Mocks
// ---------------------------------------------------------------------------
const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockBack = jest.fn();
let mockSearchParams: Record<string, string> = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
  }),
  useSegments: () => ['(authenticated)', 'work', 'submission-review'],
  useLocalSearchParams: () => mockSearchParams,
  useFocusEffect: (cb: any) => {
    cb();
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: (props: any) => {
    const { View } = require('react-native');
    return <View testID={`icon-${props.name}`} {...props} />;
  },
}));

jest.mock('expo-image', () => ({
  Image: (props: any) => {
    const { View } = require('react-native');
    return <View testID="expo-image" {...props} />;
  },
}));

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

const mockSession = {
  accessToken: 'test-reviewer-token',
  account: { id: 'reviewer-user-1', roles: ['reviewer'] },
};

jest.mock('@/context/session-provider', () => ({
  ACCOUNT_ROLES: ['driver', 'surveyor', 'reviewer'],
  useSession: () => ({
    session: mockSession,
    currentRole: 'reviewer',
    switchRole: jest.fn(),
  }),
  useOptionalSession: () => ({
    session: mockSession,
    currentRole: 'reviewer',
    switchRole: jest.fn(),
  }),
}));

const mockInvalidateWalletAndStats = jest.fn();
jest.mock('@/feature/credits/hooks/use-wallet', () => ({
  useInvalidateWalletAndStats: () => mockInvalidateWalletAndStats,
}));

let mockQueueSubmissions: ReviewSubmission[] = [];
let mockQueueTotal = 0;
const mockRefetchQueue = jest.fn();
const mockRefetchHistory = jest.fn();
const mockCastVote = jest.fn().mockResolvedValue({ success: true });
const mockReportCandidate = jest.fn().mockResolvedValue({ success: true });
const mockReportMissingType = jest.fn().mockResolvedValue({ success: true });
const mockSkipSign = jest.fn().mockResolvedValue({ success: true });
const mockUndoVote = jest.fn().mockResolvedValue({ success: true });

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
    data: [],
    refetch: mockRefetchHistory,
    isLoading: false,
  }),
  useCastVoteOnSignCandidate: () => ({
    mutateAsync: mockCastVote,
  }),
  useReportSignCandidate: () => ({
    mutateAsync: mockReportCandidate,
  }),
  useReportMissingType: () => ({
    mutateAsync: mockReportMissingType,
  }),
  useSkipSign: () => ({
    mutateAsync: mockSkipSign,
  }),
  useUndoVoteOnCandidate: () => ({
    mutateAsync: mockUndoVote,
  }),
  useGetCatalog: () => ({
    data: { signs: [] },
    isPending: false,
    error: null,
  }),
}));

const sampleCandidate1: ReviewSubmission = {
  id: 'cand-1',
  title: 'Speed Limit 50 (P.127)',
  captured: '10:00 AM',
  location: '123 Le Loi',
  surveyorId: 'surveyor-1',
  image: { uri: 'https://s3.signmap.site/stm-sign-crops/crop-1.jpg' },
};

const sampleCandidate2: ReviewSubmission = {
  id: 'cand-2',
  title: 'No Entry (P.102)',
  captured: '10:05 AM',
  location: '456 Nguyen Hue',
  surveyorId: 'surveyor-2',
  image: { uri: 'https://s3.signmap.site/stm-sign-crops/crop-2.jpg' },
};

const sampleCandidate3: ReviewSubmission = {
  id: 'cand-3',
  title: 'Stop (P.122)',
  captured: '10:10 AM',
  location: '789 Tran Hung Dao',
  surveyorId: 'surveyor-3',
  image: { uri: 'https://s3.signmap.site/stm-sign-crops/crop-3.jpg' },
};

describe('Reviewer Screen: Skip to Summary & Re-vote Only Voted Submissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = {};
    mockQueueSubmissions = [sampleCandidate1, sampleCandidate2, sampleCandidate3];
    mockQueueTotal = 3;
    mockRefetchQueue.mockResolvedValue({
      data: { submissions: mockQueueSubmissions, total: mockQueueTotal },
    });
    mockRefetchHistory.mockResolvedValue({ data: [] });
  });

  // =========================================================================
  // Requirement 1 & 2: Button right below the name, enabled with >= 1 vote
  // =========================================================================
  describe('Requirement 1: Small AppButton below the name to right edge, enabled with >= 1 vote', () => {
    it('renders the skip-to-summary AppButton as disabled when reviewHistory is empty (0 votes)', async () => {
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
        jumpToSubmissionIndex: jest.fn(),
        pendingSubmissions: [sampleCandidate1, sampleCandidate2],
        refresh: jest.fn().mockResolvedValue(undefined),
        recheckingPreviousAction: undefined,
        recheckingReviewIndex: undefined,
        recheckingSubmission: false,
        isRecheckingSubmission: false,
        resetReviewWorkflow: jest.fn().mockResolvedValue(undefined),
        reviewCheckedSubmissionAgain: jest.fn().mockResolvedValue(false),
        reviewHistory: [], // 0 votes
        sessionReviewCount: 0,
        skipCurrentReview: jest.fn().mockResolvedValue(true),
        totalSubmissions: 2,
        undoLastReview: jest.fn().mockResolvedValue(true),
      };

      const { getByTestId, getByText } = await render(
        <ReviewWorkflowContext.Provider value={mockWorkflowValue}>
          <SubmissionReviewScreen />
        </ReviewWorkflowContext.Provider>
      );

      const skipButton = getByTestId('skip-to-summary-button');
      expect(skipButton).toBeTruthy();
      expect(getByText('Tổng kết')).toBeTruthy();
      expect(skipButton.props.accessibilityState?.disabled).toBe(true);

      // Pressing it while disabled does not navigate
      fireEvent.press(skipButton);
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('enables the skip-to-summary button when >= 1 vote has been cast and navigates with resumeIndex param', async () => {
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
        jumpToSubmissionIndex: jest.fn(),
        pendingSubmissions: [sampleCandidate2],
        refresh: jest.fn().mockResolvedValue(undefined),
        recheckingPreviousAction: undefined,
        recheckingReviewIndex: undefined,
        recheckingSubmission: false,
        isRecheckingSubmission: false,
        resetReviewWorkflow: jest.fn().mockResolvedValue(undefined),
        reviewCheckedSubmissionAgain: jest.fn().mockResolvedValue(false),
        reviewHistory: [{ action: 'approved', submission: sampleCandidate1 }], // 1 vote cast -> current index is 1
        sessionReviewCount: 1,
        skipCurrentReview: jest.fn().mockResolvedValue(true),
        totalSubmissions: 2,
        undoLastReview: jest.fn().mockResolvedValue(true),
      };

      const { getByTestId } = await render(
        <ReviewWorkflowContext.Provider value={mockWorkflowValue}>
          <SubmissionReviewScreen />
        </ReviewWorkflowContext.Provider>
      );

      const skipButton = getByTestId('skip-to-summary-button');
      expect(skipButton).toBeTruthy();
      expect(skipButton.props.accessibilityState?.disabled).toBe(false);

      // Pressing it navigates to summary screen with resumeIndex = '1'
      fireEvent.press(skipButton);
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/work/submission-summary',
        params: { resumeIndex: '1' },
      });
    });
  });

  // =========================================================================
  // Requirement 2: Summary Screen Back Button & Resuming Review Index
  // =========================================================================
  describe('Requirement 2: Summary screen back button & resumeIndex navigation', () => {
    it('navigates back to submission-review preserving resumeIndex param when navigated from skip button', async () => {
      mockSearchParams = { resumeIndex: '2' };

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
        jumpToSubmissionIndex: jest.fn(),
        pendingSubmissions: [sampleCandidate3],
        refresh: jest.fn().mockResolvedValue(undefined),
        recheckingPreviousAction: undefined,
        recheckingReviewIndex: undefined,
        recheckingSubmission: false,
        isRecheckingSubmission: false,
        resetReviewWorkflow: jest.fn().mockResolvedValue(undefined),
        reviewCheckedSubmissionAgain: jest.fn().mockResolvedValue(false),
        reviewHistory: [
          { action: 'approved', submission: sampleCandidate1 },
          { action: 'declined', submission: sampleCandidate2 },
        ],
        sessionReviewCount: 2,
        skipCurrentReview: jest.fn().mockResolvedValue(true),
        totalSubmissions: 3,
        undoLastReview: jest.fn().mockResolvedValue(true),
      };

      const { getByTestId } = await render(
        <ReviewWorkflowContext.Provider value={mockWorkflowValue}>
          <SubmissionSummaryScreen />
        </ReviewWorkflowContext.Provider>
      );

      const backButton = getByTestId('summary-back-button');
      expect(backButton).toBeTruthy();

      fireEvent.press(backButton);
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/work/submission-review',
        params: { resumeIndex: '2' },
      });
    });

    it('navigates back to submission-review without params when no resumeIndex was passed (all submissions reviewed)', async () => {
      mockSearchParams = {}; // No resumeIndex

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
        jumpToSubmissionIndex: jest.fn(),
        pendingSubmissions: [],
        refresh: jest.fn().mockResolvedValue(undefined),
        recheckingPreviousAction: undefined,
        recheckingReviewIndex: undefined,
        recheckingSubmission: false,
        isRecheckingSubmission: false,
        resetReviewWorkflow: jest.fn().mockResolvedValue(undefined),
        reviewCheckedSubmissionAgain: jest.fn().mockResolvedValue(false),
        reviewHistory: [
          { action: 'approved', submission: sampleCandidate1 },
          { action: 'declined', submission: sampleCandidate2 },
          { action: 'approved', submission: sampleCandidate3 },
        ],
        sessionReviewCount: 3,
        skipCurrentReview: jest.fn().mockResolvedValue(true),
        totalSubmissions: 3,
        undoLastReview: jest.fn().mockResolvedValue(true),
      };

      const { getByTestId } = await render(
        <ReviewWorkflowContext.Provider value={mockWorkflowValue}>
          <SubmissionSummaryScreen />
        </ReviewWorkflowContext.Provider>
      );

      const backButton = getByTestId('summary-back-button');
      fireEvent.press(backButton);

      // Navigates back without any params
      expect(mockReplace).toHaveBeenCalledWith('/work/submission-review');
    });

    it('jumps right back to index in SubmissionReviewScreen when resumeIndex is passed', async () => {
      mockSearchParams = { resumeIndex: '2' };
      const mockJumpToSubmissionIndex = jest.fn();

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
        jumpToSubmissionIndex: mockJumpToSubmissionIndex,
        pendingSubmissions: [sampleCandidate3],
        refresh: jest.fn().mockResolvedValue(undefined),
        recheckingPreviousAction: undefined,
        recheckingReviewIndex: undefined,
        recheckingSubmission: false,
        isRecheckingSubmission: false,
        resetReviewWorkflow: jest.fn().mockResolvedValue(undefined),
        reviewCheckedSubmissionAgain: jest.fn().mockResolvedValue(false),
        reviewHistory: [
          { action: 'approved', submission: sampleCandidate1 },
          { action: 'declined', submission: sampleCandidate2 },
        ],
        sessionReviewCount: 2,
        skipCurrentReview: jest.fn().mockResolvedValue(true),
        totalSubmissions: 3,
        undoLastReview: jest.fn().mockResolvedValue(true),
      };

      await render(
        <ReviewWorkflowContext.Provider value={mockWorkflowValue}>
          <SubmissionReviewScreen />
        </ReviewWorkflowContext.Provider>
      );

      expect(mockJumpToSubmissionIndex).toHaveBeenCalledWith(2);
    });
  });

  // =========================================================================
  // Requirement 3: Re-voting only includes voted submissions
  // =========================================================================
  describe('Requirement 3: Re-voting only includes voted submissions', () => {
    it('beginSubmissionCheck resets pending queue to ONLY voted submissions (excluding unvoted queue)', async () => {
      let workflowState: ReviewWorkflowContextValue | null = null;

      function TestConsumer() {
        workflowState = useReviewWorkflow();
        return null;
      }

      await render(
        <ReviewWorkflowProvider>
          <TestConsumer />
        </ReviewWorkflowProvider>
      );

      await waitFor(() => {
        expect(workflowState?.pendingSubmissions.length).toBe(3);
      });

      // Vote on first submission
      await act(async () => {
        await workflowState!.completeCurrentReview('approved');
      });

      expect(workflowState!.reviewHistory.length).toBe(1);
      expect(workflowState!.reviewHistory[0].submission.id).toBe('cand-1');
      expect(workflowState!.pendingSubmissions.length).toBe(2); // cand-2 and cand-3 still unvoted

      // User skips to summary screen and clicks "Kiểm tra lại hồ sơ" (beginSubmissionCheck)
      await act(async () => {
        workflowState!.beginSubmissionCheck();
      });

      // IMPORTANT: ONLY the voted submission (cand-1) is queued for re-voting!
      // cand-2 and cand-3 MUST NOT be included!
      expect(workflowState!.pendingSubmissions.length).toBe(1);
      expect(workflowState!.pendingSubmissions[0].id).toBe('cand-1');
      expect(workflowState!.totalSubmissions).toBe(1);
      expect(workflowState!.reviewHistory.length).toBe(0);
    });

    it('clicking "Kiểm tra lại hồ sơ" on summary screen invokes beginSubmissionCheck and navigates to review', async () => {
      const mockBeginSubmissionCheck = jest.fn();
      const mockWorkflowValue: ReviewWorkflowContextValue = {
        beginSubmissionCheck: mockBeginSubmissionCheck,
        checkedReviewIndex: 0,
        checkingSubmission: false,
        isCheckingSubmission: false,
        completeCurrentReview: jest.fn().mockResolvedValue(true),
        error: undefined,
        finishSubmissionCheck: jest.fn(),
        goToNextCheckedReview: jest.fn(),
        goToPreviousCheckedReview: jest.fn(),
        isLoading: false,
        jumpToSubmissionIndex: jest.fn(),
        pendingSubmissions: [sampleCandidate3], // 1 unvoted still pending
        refresh: jest.fn().mockResolvedValue(undefined),
        recheckingPreviousAction: undefined,
        recheckingReviewIndex: undefined,
        recheckingSubmission: false,
        isRecheckingSubmission: false,
        resetReviewWorkflow: jest.fn().mockResolvedValue(undefined),
        reviewCheckedSubmissionAgain: jest.fn().mockResolvedValue(false),
        reviewHistory: [
          { action: 'approved', submission: sampleCandidate1 },
          { action: 'declined', submission: sampleCandidate2 },
        ],
        sessionReviewCount: 2,
        skipCurrentReview: jest.fn().mockResolvedValue(true),
        totalSubmissions: 3,
        undoLastReview: jest.fn().mockResolvedValue(true),
      };

      const { getByText } = await render(
        <ReviewWorkflowContext.Provider value={mockWorkflowValue}>
          <SubmissionSummaryScreen />
        </ReviewWorkflowContext.Provider>
      );

      const checkButton = getByText('Kiểm tra lại hồ sơ');
      fireEvent.press(checkButton);

      expect(mockBeginSubmissionCheck).toHaveBeenCalledWith();
      expect(mockReplace).toHaveBeenCalledWith('/work/submission-review');
    });

    it('clicking a specific voted card in the summary list re-checks only that single voted submission', async () => {
      const mockBeginSubmissionCheck = jest.fn();
      const mockWorkflowValue: ReviewWorkflowContextValue = {
        beginSubmissionCheck: mockBeginSubmissionCheck,
        checkedReviewIndex: 0,
        checkingSubmission: false,
        isCheckingSubmission: false,
        completeCurrentReview: jest.fn().mockResolvedValue(true),
        error: undefined,
        finishSubmissionCheck: jest.fn(),
        goToNextCheckedReview: jest.fn(),
        goToPreviousCheckedReview: jest.fn(),
        isLoading: false,
        jumpToSubmissionIndex: jest.fn(),
        pendingSubmissions: [sampleCandidate3],
        refresh: jest.fn().mockResolvedValue(undefined),
        recheckingPreviousAction: undefined,
        recheckingReviewIndex: undefined,
        recheckingSubmission: false,
        isRecheckingSubmission: false,
        resetReviewWorkflow: jest.fn().mockResolvedValue(undefined),
        reviewCheckedSubmissionAgain: jest.fn().mockResolvedValue(false),
        reviewHistory: [
          { action: 'approved', submission: sampleCandidate1 },
          { action: 'declined', submission: sampleCandidate2 },
        ],
        sessionReviewCount: 2,
        skipCurrentReview: jest.fn().mockResolvedValue(true),
        totalSubmissions: 3,
        undoLastReview: jest.fn().mockResolvedValue(true),
      };

      const { getByText } = await render(
        <ReviewWorkflowContext.Provider value={mockWorkflowValue}>
          <SubmissionSummaryScreen />
        </ReviewWorkflowContext.Provider>
      );

      // Tap on the second reviewed sign card (cand-2)
      const cand2Card = getByText('No Entry (P.102)');
      fireEvent.press(cand2Card);

      // It triggers beginSubmissionCheck with index 1 to re-vote only that card
      expect(mockBeginSubmissionCheck).toHaveBeenCalledWith(1);
      expect(mockReplace).toHaveBeenCalledWith('/work/submission-review');
    });
  });
});
