import React from 'react';
import { Animated, PanResponder } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockSetParams = jest.fn();
let mockParams: any = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, setParams: mockSetParams }),
  useLocalSearchParams: () => mockParams,
}));

jest.mock('expo-image', () => {
  const ReactActual = require('react');
  const { View } = require('react-native');
  return {
    Image: (props: any) => ReactActual.createElement(View, { testID: 'reval-img', ...props }),
  };
});

jest.mock('react-native-safe-area-context', () => {
  const ReactActual = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: any) => ReactActual.createElement(View, props, children),
    useSafeAreaInsets: () => ({ top: 10, bottom: 20, left: 0, right: 0 }),
  };
});

jest.mock('@/hooks/use-back-button', () => ({ useBackButton: jest.fn() }));
jest.mock('@/hooks/use-work-route', () => ({ useWorkRoute: () => '/work' }));
jest.mock('@/utils/responsive', () => ({ useResponsive: () => ({ isSmallDevice: true, height: 640 }) }));
jest.mock('@/services/location-permission', () => ({
  checkAndRequireLocationPermission: jest.fn().mockResolvedValue(true),
}));

let mockSessionData: any = { session: { accessToken: 'tok-r', account: { id: 'rev-1', roles: ['reviewer'] } } };
jest.mock('@/context/session-provider', () => ({
  useSession: () => mockSessionData,
}));

const mockNavigateToSign = jest.fn();
jest.mock('@/feature/review/hooks/use-reviewer-sign-navigation', () => ({
  useReviewerSignNavigation: () => ({ isNavigatingToSign: false, navigateToSign: mockNavigateToSign }),
}));

const mockRecaptureMutate = jest.fn();
jest.mock('@/feature/revalidation/hooks/use-revalidation', () => ({
  useGetRevalidationEvidenceQueue: () => ({ data: { items: [], total: 0 }, isLoading: false }),
  useVoteOnRevalidationEvidence: () => ({ mutateAsync: jest.fn() }),
  useRequestEvidenceRecapture: () => ({ mutateAsync: mockRecaptureMutate }),
}));

jest.mock('@/feature/review/hooks/use-review', () => ({
  useGetCatalog: () => ({
    data: {
      categories: [{ id: 1, code: 'WARN', nameVi: 'Cảnh báo' }],
      signs: [{ id: 77, categoryId: 1, signCode: 'W.201', nameVi: 'Chỗ ngoặt', category: { id: 1, code: 'WARN', nameVi: 'Cảnh báo' } }],
    },
    isPending: false,
  }),
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    text: '#0F172A',
    textSecondary: '#475569',
    placeholder: '#94A3B8',
    background: '#F8FAFC',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#EFF6FF',
    surface: '#FFFFFF',
    neutral: '#F1F5F9',
    border: '#CBD5E1',
    primary: '#0671EB',
  }),
}));

let mockWorkflowValue: any;
jest.mock('@/feature/revalidation/context/revalidation-workflow-provider', () => ({
  useRevalidationWorkflow: () => mockWorkflowValue,
}));

jest.mock('@/api/reviews/review-workflow', () => ({
  extractCoordinateFromCandidate: jest.fn(),
  resolveS3Url: (u?: string) => (u ? `https://s3.mock/${u}` : ''),
}));

jest.mock('@/feature/credits/hooks/use-wallet', () => ({
  useInvalidateWalletAndStats: () => jest.fn(),
}));

import { RevalidationReviewScreen } from '@/feature/revalidation/pages/revalidation-review-screen';

describe('RevalidationReviewScreen Branch Coverage', () => {
  const baseItem1: any = {
    evidenceId: 'ev-1',
    taskId: 'task-1',
    evidence: {
      mediaUrl: 'ev1.jpg',
      evidenceType: 'REMOVED',
      submittedAt: '2026-01-01T10:00:00Z',
      userId: 'surv-1',
      location: { latitude: 10.77, longitude: 106.7 },
    },
    verifiedSign: {
      signCode: 'P.102',
      nameVi: 'Cấm đi ngược',
      signCropUrl: 'crop1.jpg',
      freshnessScore: 0.9,
      lastVerifiedAt: '2025-12-01T10:00:00Z',
    },
  };
  const baseItem2: any = {
    evidenceId: 'ev-2',
    taskId: 'task-2',
    evidence: {
      mediaUrl: 'ev2.jpg',
      evidenceType: 'CHANGED',
      suggestedSignTypeId: 42,
      submittedAt: '2026-01-02T10:00:00Z',
      surveyorId: 'surv-2',
    },
    verifiedSign: {
      signCode: 'W.201',
      nameEn: 'Curve',
      signCropUrl: 'crop2.jpg',
    },
  };

  let capturedPanConfig: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = {};
    mockSessionData = { session: { accessToken: 'tok-r', account: { id: 'rev-1', roles: ['reviewer'] } } };
    jest.spyOn(Animated, 'timing').mockImplementation(() => ({ start: (cb?: any) => cb?.() }) as any);
    jest.spyOn(Animated, 'spring').mockImplementation(() => ({ start: (cb?: any) => cb?.() }) as any);
    jest.spyOn(PanResponder, 'create').mockImplementation((cfg: any) => {
      capturedPanConfig = cfg;
      return { panHandlers: {} } as any;
    });

    mockWorkflowValue = {
      queueItems: [baseItem1, baseItem2],
      reviewHistory: [],
      currentItem: baseItem1,
      nextItem: baseItem2,
      totalCount: 2,
      reviewPosition: 1,
      progressPercent: 50,
      counts: { STILL_ACTIVE: 0, REMOVED: 0, CHANGED: 0, UNCLEAR: 0, INVALID: 0 },
      handleVote: jest.fn().mockResolvedValue(false),
      handleSkip: jest.fn().mockReturnValue(false),
      finishReviews: jest.fn().mockReturnValue(1),
      isLoading: false,
      isCheckingEvidence: false,
      isSubmittingVote: false,
      jumpToEvidenceById: jest.fn(),
      keepCurrentEvidenceAndNext: jest.fn(),
      recheckingPreviousReview: undefined,
      cancelEvidenceCheck: jest.fn(),
    };
  });

  it('covers loading skeleton, complete empty state, targetSubmissionId param, self-evidence block, and recheck mode', async () => {
    mockWorkflowValue = { ...mockWorkflowValue, queueItems: [], currentItem: undefined, isLoading: true };
    const screen = await render(<RevalidationReviewScreen />);

    mockWorkflowValue = { ...mockWorkflowValue, isLoading: false };
    await screen.rerender(<RevalidationReviewScreen />);
    expect(screen.getByText('Đã đánh giá tất cả minh chứng')).toBeTruthy();
    await fireEvent.press(screen.getByText('Quay lại công việc'));
    expect(mockReplace).toHaveBeenCalledWith('/work');

    // Self-evidence blocks voting & recapture
    mockParams = { targetSubmissionId: 'ev-1' };
    mockSessionData = { session: { accessToken: 'tok-r', account: { id: 'surv-1', roles: ['reviewer'] } } };
    mockWorkflowValue = { ...mockWorkflowValue, queueItems: [baseItem1, baseItem2], currentItem: baseItem1 };
    await screen.rerender(<RevalidationReviewScreen />);
    expect(mockWorkflowValue.jumpToEvidenceById).toHaveBeenCalledWith('ev-1');
    expect(screen.getByText('Tự thẩm định bị chặn')).toBeTruthy();
    await fireEvent.press(screen.getByText('Bỏ qua minh chứng này'));
    expect(mockWorkflowValue.handleSkip).toHaveBeenCalled();

    // Recheck mode shows voted card -> fix -> cancel edit -> keep
    mockSessionData = { session: { accessToken: 'tok-r', account: { id: 'rev-1', roles: ['reviewer'] } } };
    mockWorkflowValue = {
      ...mockWorkflowValue,
      isCheckingEvidence: true,
      recheckingPreviousReview: { action: 'STILL_ACTIVE', item: baseItem1 },
    };
    await screen.rerender(<RevalidationReviewScreen />);
    await fireEvent.press(screen.getByLabelText('Quay lại'));
    expect(mockWorkflowValue.cancelEvidenceCheck).toHaveBeenCalled();
  });

  it('covers view mode tabs, zoom modal, help modal, map navigation, recapture sheet, decline/report sheets, and 4-way swipes', async () => {
    const screen = await render(<RevalidationReviewScreen />);

    // Toggle baseline vs evidence, zoom modal
    await fireEvent.press(screen.getByLabelText('Xem ảnh gốc'));
    await fireEvent.press(screen.getByLabelText('Xem ảnh mới'));
    await fireEvent.press(screen.getByLabelText('Ảnh minh chứng. Nhấn để phóng to.'));
    await fireEvent.press(screen.getAllByLabelText('Đóng xem phóng to')[0]);

    // Navigate to sign location
    await fireEvent.press(screen.getByTestId('reval-move-to-sign-location-button'));
    expect(mockNavigateToSign).toHaveBeenCalledWith(expect.objectContaining({ latitude: 10.77, longitude: 106.7 }));

    // Help modal & catalog modal via decision badge
    await fireEvent.press(screen.getByLabelText('Hướng dẫn thao tác quẹt'));
    expect(screen.getByText('Hướng dẫn quẹt thẻ')).toBeTruthy();
    await fireEvent.press(screen.getByText('Đã hiểu'));

    await fireEvent.press(screen.getByLabelText('Xem danh mục biển báo'));
    await fireEvent.press(screen.getByLabelText('Chọn biển báo W.201 - Chỗ ngoặt'));

    // Recapture success & error
    mockRecaptureMutate.mockResolvedValueOnce({ ok: true });
    await fireEvent.press(screen.getByLabelText('Yêu cầu chụp lại ảnh'));
    await fireEvent.press(screen.getByText('Gửi yêu cầu chụp lại'));
    await waitFor(() => expect(mockRecaptureMutate).toHaveBeenCalled());

    mockRecaptureMutate.mockRejectedValueOnce(new Error('Recapture failed'));
    await fireEvent.press(screen.getByLabelText('Yêu cầu chụp lại ảnh'));
    await fireEvent.press(screen.getByText('Gửi yêu cầu chụp lại'));

    // Agree error branch + Decline sheet + Report sheet
    mockWorkflowValue.handleVote.mockRejectedValueOnce(new Error('Vote fail'));
    await fireEvent.press(screen.getByLabelText(/Đồng ý/i));

    await fireEvent.press(screen.getByLabelText(/Từ chối/i));
    await fireEvent.press(screen.getByText('Xác nhận từ chối'));

    await fireEvent.press(screen.getByLabelText(/Báo cáo/i));
    await fireEvent.press(screen.getByText('Gửi báo cáo'));

    // PanResponder 4 directions + snap-back + terminate
    mockWorkflowValue.handleVote.mockResolvedValue(false);
    await act(async () => {
      capturedPanConfig.onPanResponderGrant();
      capturedPanConfig.onMoveShouldSetPanResponder({}, { dx: 20, dy: 0 });
      capturedPanConfig.onPanResponderMove({}, { dx: 120, dy: 0 });
      capturedPanConfig.onPanResponderRelease({}, { dx: 120, dy: 0, vx: 0.5, vy: 0 });

      capturedPanConfig.onPanResponderGrant();
      capturedPanConfig.onPanResponderMove({}, { dx: -120, dy: 0 });
      capturedPanConfig.onPanResponderRelease({}, { dx: -120, dy: 0, vx: -0.5, vy: 0 });

      capturedPanConfig.onPanResponderGrant();
      capturedPanConfig.onPanResponderMove({}, { dx: 0, dy: -120 });
      capturedPanConfig.onPanResponderRelease({}, { dx: 0, dy: -120, vx: 0, vy: -0.5 });

      capturedPanConfig.onPanResponderGrant();
      capturedPanConfig.onPanResponderMove({}, { dx: 0, dy: 120 });
      capturedPanConfig.onPanResponderRelease({}, { dx: 0, dy: 120, vx: 0, vy: 0.5 });

      capturedPanConfig.onPanResponderGrant();
      capturedPanConfig.onPanResponderRelease({}, { dx: 5, dy: 5, vx: 0, vy: 0 });
      capturedPanConfig.onPanResponderTerminate();
    });
    expect(mockWorkflowValue.handleVote).toHaveBeenCalled();
  });
});
