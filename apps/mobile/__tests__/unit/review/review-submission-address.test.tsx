import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { SubmissionReviewScreen } from '@/feature/review/pages/submission-review-screen';
import { ReviewWorkflowContext, type ReviewWorkflowContextValue } from '@/feature/review/context/review-workflow-provider';
import * as spatialModule from '@/api/spatial/spatial';

// ---------------------------------------------------------------------------
// 1. Mocks
// ---------------------------------------------------------------------------
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useSegments: () => ['(authenticated)', 'work', 'submission-review'],
  useLocalSearchParams: () => ({}),
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

jest.mock('expo-symbols', () => ({
  SymbolView: (props: any) => {
    const { View } = require('react-native');
    return <View testID="symbol-view" {...props} />;
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
  }),
}));

jest.mock('@/context/session-provider', () => ({
  ACCOUNT_ROLES: ['driver', 'surveyor', 'reviewer'],
  useSession: () => ({
    session: { accessToken: 'test-token' },
    currentRole: 'reviewer',
    switchRole: jest.fn(),
  }),
  useOptionalSession: () => ({
    session: { accessToken: 'test-token' },
    currentRole: 'reviewer',
    switchRole: jest.fn(),
  }),
}));

jest.mock('@/feature/review/hooks/use-review', () => ({
  useGetCatalog: () => ({
    data: { signs: [] },
    isPending: false,
    error: null,
  }),
}));

import type { ReviewSubmission } from '@/api/reviews/review-workflow';

describe('SubmissionReviewScreen - Address & Dot Removal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockWorkflowContext = (
    submissionOverrides: Partial<ReviewSubmission> = {},
  ): ReviewWorkflowContextValue => {
    const submission: ReviewSubmission = {
      id: 'sub-1',
      title: 'Biển báo nguy hiểm W.201a',
      captured: '12 thg 10 14:30',
      location: '',
      latitude: 10.7769,
      longitude: 106.7009,
      image: { uri: 'https://example.com/test.jpg' },
      surveyorId: 'surveyor-1',
      ...submissionOverrides,
    };

    return {
      beginSubmissionCheck: jest.fn(),
      checkedReviewIndex: 0,
      checkingSubmission: false,
      isCheckingSubmission: false,
      completeCurrentReview: jest.fn().mockResolvedValue(true),
      finishSubmissionCheck: jest.fn(),
      goToNextCheckedReview: jest.fn(),
      goToPreviousCheckedReview: jest.fn(),
      isLoading: false,
      pendingSubmissions: [submission],
      refresh: jest.fn().mockResolvedValue(undefined),
      recheckingPreviousAction: undefined,
      recheckingReviewIndex: undefined,
      recheckingSubmission: false,
      isRecheckingSubmission: false,
      resetReviewWorkflow: jest.fn().mockResolvedValue(undefined),
      reviewCheckedSubmissionAgain: jest.fn().mockResolvedValue(true),
      reviewHistory: [],
      sessionReviewCount: 0,
      skipCurrentReview: jest.fn().mockResolvedValue(true),
      totalSubmissions: 1,
      undoLastReview: jest.fn().mockResolvedValue(true),
    };
  };

  it('renders displayAddress cleanly separated by comma without any bullet dot (•) in front of address', async () => {
    jest.spyOn(spatialModule, 'resolveLocation').mockResolvedValue({
      latitude: 10.7769,
      longitude: 106.7009,
      roadName: 'Đường Nguyễn Huệ',
      displayAddress: 'Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1',
    });

    const mockContext = createMockWorkflowContext();

    const { getByText, queryByText } = await render(
      <ReviewWorkflowContext.Provider value={mockContext}>
        <SubmissionReviewScreen state="ready" />
      </ReviewWorkflowContext.Provider>,
    );

    // Wait for resolveLocation to populate resolvedAddress
    await waitFor(() => {
      // Subtitle should be joined by comma, with NO dot (•)
      expect(getByText('12 thg 10 14:30, Đường Nguyễn Huệ, Phường Bến Nghé, Quận 1')).toBeTruthy();
    });

    // Verify there is NO bullet dot '•' or ' • '
    expect(queryByText(/•/)).toBeNull();
    expect(queryByText(/Tọa độ GPS ước tính/)).toBeNull();
  });

  it('handles existing submission.location without leading bullet dot', async () => {
    const mockContext = createMockWorkflowContext({
      location: '123 Đường Lê Lợi, Quận 1',
    });

    const { getByText, queryByText } = await render(
      <ReviewWorkflowContext.Provider value={mockContext}>
        <SubmissionReviewScreen state="ready" />
      </ReviewWorkflowContext.Provider>,
    );

    await waitFor(() => {
      expect(getByText('12 thg 10 14:30, 123 Đường Lê Lợi, Quận 1')).toBeTruthy();
    });

    expect(queryByText(/•/)).toBeNull();
  });

  it('strips accidental leading bullet point dot if backend location string contained one', async () => {
    const mockContext = createMockWorkflowContext({
      location: ' • Đường Hàm Nghi, Quận 1',
    });

    const { getByText, queryByText } = await render(
      <ReviewWorkflowContext.Provider value={mockContext}>
        <SubmissionReviewScreen state="ready" />
      </ReviewWorkflowContext.Provider>,
    );

    await waitFor(() => {
      expect(getByText('12 thg 10 14:30, Đường Hàm Nghi, Quận 1')).toBeTruthy();
    });

    expect(queryByText(/•/)).toBeNull();
  });
});
