import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ReviewerHistoryScreen } from '@/feature/review/pages/reviewer-history-screen';
import {
  ReviewWorkflowContext,
  type ReviewWorkflowContextValue,
} from '@/feature/review/context/review-workflow-provider';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
    replace: mockReplace,
  }),
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    backgroundElement: '#F8FAFC',
    border: '#E2E8F0',
    text: '#0F172A',
    textSecondary: '#64748B',
    placeholder: '#94A3B8',
    primary: '#007B8B',
  }),
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children, ...props }: any) => {
    const { View } = require('react-native');
    return <View {...props}>{children}</View>;
  },
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: (props: any) => {
    const { View } = require('react-native');
    return <View testID={`icon-${props.name}`} {...props} />;
  },
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

const mockRefetch = jest.fn();
const mockHistoryData = {
  items: [
    {
      candidateId: 'cand-today-1',
      candidate: {
        id: 'cand-today-1',
        createdAt: new Date().toISOString(),
        submissionId: 'sub-1',
        status: 'PENDING',
        predictedSignType: {
          id: 101,
          nameVi: 'Cấm đi ngược chiều',
          signCode: 'P.102',
        },
      },
      reviewedAt: new Date().toISOString(),
      vote: 1,
    },
  ],
  total: 1,
};

jest.mock('@/feature/review/hooks/use-review', () => ({
  useGetMyRawReviewHistory: () => ({
    data: mockHistoryData,
    isLoading: false,
    refetch: mockRefetch,
  }),
}));

describe('ReviewerHistoryScreen', () => {
  const mockLoadSubmissionForEdit = jest.fn();
  const mockWorkflowValue: Partial<ReviewWorkflowContextValue> = {
    loadSubmissionForEdit: mockLoadSubmissionForEdit,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders header, date filter, and historical item card', async () => {
    const { getByText, getByTestId } = await render(
      <ReviewWorkflowContext.Provider value={mockWorkflowValue as any}>
        <ReviewerHistoryScreen />
      </ReviewWorkflowContext.Provider>,
    );

    expect(getByText('Lịch sử thẩm định')).toBeTruthy();
    expect(getByText('Cấm đi ngược chiều')).toBeTruthy();
    const backBtn = getByTestId('btn-back-reviewer-history');
    const refreshBtn = getByTestId('btn-refresh-reviewer-history');
    expect(backBtn).toBeTruthy();
    expect(refreshBtn).toBeTruthy();
    expect(getByTestId('icon-arrow-left').props.color).toBe('#0F172A');
    expect(getByTestId('icon-reload').props.color).toBe('#0F172A');
  });

  it('allows clicking edit on eligible record and routes to submission review', async () => {
    const { getByTestId } = await render(
      <ReviewWorkflowContext.Provider value={mockWorkflowValue as any}>
        <ReviewerHistoryScreen />
      </ReviewWorkflowContext.Provider>,
    );

    const editBtn = getByTestId('btn-edit-vote-cand-today-1');
    fireEvent.press(editBtn);

    expect(mockLoadSubmissionForEdit).toHaveBeenCalledWith(
      expect.objectContaining({ candidateId: 'cand-today-1' }),
    );
    expect(mockPush).toHaveBeenCalledWith('/work/submission-review');
  });

  it('handles back button press', async () => {
    const { getByTestId } = await render(
      <ReviewWorkflowContext.Provider value={mockWorkflowValue as any}>
        <ReviewerHistoryScreen />
      </ReviewWorkflowContext.Provider>,
    );

    fireEvent.press(getByTestId('btn-back-reviewer-history'));
    expect(mockReplace).toHaveBeenCalledWith({
      pathname: '/work',
      params: { currentRole: 'reviewer' },
    });
  });
});
