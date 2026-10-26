import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { RecheckEvidenceScreen } from '@/feature/revalidation/pages/recheck-evidence-screen';
import {
  RevalidationWorkflowContext,
  type RevalidationWorkflowContextValue,
} from '@/feature/revalidation/context/revalidation-workflow-provider';
import type { RevalidationQueueEvidenceItem } from '@/types/revalidationType';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
  }),
  useLocalSearchParams: () => ({}),
}));

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
    secondary: '#38BDF8',
    danger: '#EF4444',
  }),
}));

jest.mock('react-native-safe-area-context', () => {
  const R = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: any) =>
      R.createElement(View, props, children),
    useSafeAreaInsets: () => ({ top: 0, left: 0, right: 0, bottom: 0 }),
  };
});

describe('RecheckEvidenceScreen', () => {
  const mockSampleEvidence1: RevalidationQueueEvidenceItem = {
    evidenceId: 'ev-1',
    taskId: 'task-1',
    currentVoteCount: 3,
    rewardCredits: 10,
    taskStatus: 'PENDING',
    evidence: {
      mediaUrl: 'https://example.com/ev1.jpg',
      evidenceType: 'INSPECT_AND_REPLACE',
      submittedAt: '2026-10-26T00:00:00Z',
      latitude: 10.7769,
      longitude: 106.7009,
      distanceMeters: 5,
    },
    verifiedSign: {
      id: 'sign-1',
      signCode: 'P.102',
      nameVi: 'Cấm đi ngược chiều',
      nameEn: 'No Entry',
      signCropUrl: 'https://example.com/crop1.jpg',
      freshnessScore: 0.85,
    },
  };

  const mockSampleEvidence2: RevalidationQueueEvidenceItem = {
    evidenceId: 'ev-2',
    taskId: 'task-2',
    currentVoteCount: 1,
    rewardCredits: 10,
    taskStatus: 'PENDING',
    evidence: {
      mediaUrl: 'https://example.com/ev2.jpg',
      evidenceType: 'INSPECT_AND_REPLACE',
      submittedAt: '2026-10-26T00:00:00Z',
      latitude: 10.7765,
      longitude: 106.7015,
      distanceMeters: 12,
    },
    verifiedSign: {
      id: 'sign-2',
      signCode: 'W.201',
      nameVi: 'Đường cong nguy hiểm',
      nameEn: 'Dangerous Curve',
      signCropUrl: 'https://example.com/crop2.jpg',
      freshnessScore: 0.4,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders recheck evidence screen with metrics, review rows, and back button', async () => {
    const mockWorkflowValue: RevalidationWorkflowContextValue = {
      beginEvidenceCheck: jest.fn(),
      counts: { STILL_ACTIVE: 1, REMOVED: 1, CHANGED: 0, UNCLEAR: 0 },
      currentItem: undefined,
      finishReviews: jest.fn().mockReturnValue(2),
      handleVote: jest.fn().mockResolvedValue(true),
      isCheckingEvidence: false,
      isLoading: false,
      nextItem: undefined,
      progressPercent: 100,
      queueItems: [],
      recheckingIndex: undefined,
      refetchQueue: jest.fn().mockResolvedValue(undefined),
      resetWorkflow: jest.fn(),
      reviewHistory: [
        { action: 'STILL_ACTIVE', item: mockSampleEvidence1, note: 'Biển còn rất rõ' },
        { action: 'REMOVED', item: mockSampleEvidence2 },
      ],
      reviewPosition: 2,
      totalCount: 2,
    };

    const { getByText, getByTestId } = await render(
      <RevalidationWorkflowContext.Provider value={mockWorkflowValue}>
        <RecheckEvidenceScreen />
      </RevalidationWorkflowContext.Provider>,
    );

    expect(getByText('Tổng kết tái thẩm định')).toBeTruthy();
    expect(getByText(/Đã đánh giá 2 minh chứng/)).toBeTruthy();
    expect(getByText(/P.102 - Cấm đi ngược chiều/)).toBeTruthy();
    expect(getByText(/W.201 - Đường cong nguy hiểm/)).toBeTruthy();

    const backBtn = getByTestId('recheck-evidence-back-button');
    await fireEvent.press(backBtn);
    expect(mockReplace).toHaveBeenCalledWith('/work/revalidation-review');
  });

  it('clicking item row invokes beginEvidenceCheck(index) and navigates to review', async () => {
    const mockBeginCheck = jest.fn();
    const mockWorkflowValue: RevalidationWorkflowContextValue = {
      beginEvidenceCheck: mockBeginCheck,
      counts: { STILL_ACTIVE: 1, REMOVED: 0, CHANGED: 0, UNCLEAR: 0 },
      currentItem: undefined,
      finishReviews: jest.fn().mockReturnValue(1),
      handleVote: jest.fn().mockResolvedValue(true),
      isCheckingEvidence: false,
      isLoading: false,
      nextItem: undefined,
      progressPercent: 100,
      queueItems: [],
      recheckingIndex: undefined,
      refetchQueue: jest.fn().mockResolvedValue(undefined),
      resetWorkflow: jest.fn(),
      reviewHistory: [{ action: 'STILL_ACTIVE', item: mockSampleEvidence1 }],
      reviewPosition: 1,
      totalCount: 1,
    };

    const { getByText } = await render(
      <RevalidationWorkflowContext.Provider value={mockWorkflowValue}>
        <RecheckEvidenceScreen />
      </RevalidationWorkflowContext.Provider>,
    );

    const row = getByText(/P.102 - Cấm đi ngược chiều/);
    await fireEvent.press(row);

    expect(mockBeginCheck).toHaveBeenCalledWith(0);
    expect(mockReplace).toHaveBeenCalledWith('/work/revalidation-review');
  });

  it('clicking "Kiểm tra lại minh chứng" invokes beginEvidenceCheck() and navigates to review', async () => {
    const mockBeginCheck = jest.fn();
    const mockWorkflowValue: RevalidationWorkflowContextValue = {
      beginEvidenceCheck: mockBeginCheck,
      counts: { STILL_ACTIVE: 1, REMOVED: 0, CHANGED: 0, UNCLEAR: 0 },
      currentItem: undefined,
      finishReviews: jest.fn().mockReturnValue(1),
      handleVote: jest.fn().mockResolvedValue(true),
      isCheckingEvidence: false,
      isLoading: false,
      nextItem: undefined,
      progressPercent: 100,
      queueItems: [],
      recheckingIndex: undefined,
      refetchQueue: jest.fn().mockResolvedValue(undefined),
      resetWorkflow: jest.fn(),
      reviewHistory: [{ action: 'STILL_ACTIVE', item: mockSampleEvidence1 }],
      reviewPosition: 1,
      totalCount: 1,
    };

    const { getByText } = await render(
      <RevalidationWorkflowContext.Provider value={mockWorkflowValue}>
        <RecheckEvidenceScreen />
      </RevalidationWorkflowContext.Provider>,
    );

    const recheckBtn = getByText('Kiểm tra lại minh chứng');
    await fireEvent.press(recheckBtn);

    expect(mockBeginCheck).toHaveBeenCalledWith();
    expect(mockReplace).toHaveBeenCalledWith('/work/revalidation-review');
  });

  it('clicking "Hoàn tất" calls finishReviews and navigates to submission-complete', async () => {
    const mockFinish = jest.fn().mockReturnValue(3);
    const mockWorkflowValue: RevalidationWorkflowContextValue = {
      beginEvidenceCheck: jest.fn(),
      counts: { STILL_ACTIVE: 3, REMOVED: 0, CHANGED: 0, UNCLEAR: 0 },
      currentItem: undefined,
      finishReviews: mockFinish,
      handleVote: jest.fn().mockResolvedValue(true),
      isCheckingEvidence: false,
      isLoading: false,
      nextItem: undefined,
      progressPercent: 100,
      queueItems: [],
      recheckingIndex: undefined,
      refetchQueue: jest.fn().mockResolvedValue(undefined),
      resetWorkflow: jest.fn(),
      reviewHistory: [
        { action: 'STILL_ACTIVE', item: mockSampleEvidence1 },
        { action: 'STILL_ACTIVE', item: mockSampleEvidence2 },
        { action: 'STILL_ACTIVE', item: mockSampleEvidence1 },
      ],
      reviewPosition: 3,
      totalCount: 3,
    };

    const { getByText } = await render(
      <RevalidationWorkflowContext.Provider value={mockWorkflowValue}>
        <RecheckEvidenceScreen />
      </RevalidationWorkflowContext.Provider>,
    );

    const finishBtn = getByText('Hoàn tất');
    await fireEvent.press(finishBtn);

    expect(mockFinish).toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: '/work/submission-complete',
      params: {
        type: 'review_revalidation',
        count: '3',
      },
    });
  });
});
