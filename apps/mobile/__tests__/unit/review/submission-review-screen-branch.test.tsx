import React from 'react';
import { Animated, PanResponder } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';

const mockNavigate = jest.fn();
const mockReplace = jest.fn();
const mockSetParams = jest.fn();
let mockParams: any = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: mockNavigate, replace: mockReplace, setParams: mockSetParams }),
  useLocalSearchParams: () => mockParams,
}));

jest.mock('expo-image', () => {
  const ReactActual = require('react');
  const { View } = require('react-native');
  return {
    Image: (props: any) => ReactActual.createElement(View, { testID: 'review-img', ...props }),
  };
});

jest.mock('react-native-safe-area-context', () => {
  const ReactActual = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: any) => ReactActual.createElement(View, props, children),
    useSafeAreaInsets: () => ({ top: 0, bottom: 16, left: 0, right: 0 }),
  };
});

jest.mock('@/hooks/use-back-button', () => ({ useBackButton: jest.fn() }));
jest.mock('@/utils/responsive', () => ({ useResponsive: () => ({ isSmallDevice: true, height: 640 }) }));
jest.mock('@/services/location-permission', () => ({
  checkAndRequireLocationPermission: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/context/session-provider', () => ({
  useOptionalSession: () => ({ session: { accessToken: 'tok-rev', account: { id: 'r1' } } }),
}));

const mockNavigateToSign = jest.fn();
jest.mock('@/feature/review/hooks/use-reviewer-sign-navigation', () => ({
  useReviewerSignNavigation: () => ({ isNavigatingToSign: false, navigateToSign: mockNavigateToSign }),
}));

jest.mock('@/api/spatial/spatial', () => ({
  resolveLocation: jest.fn().mockResolvedValue({ displayAddress: '123 Lê Lợi, Q1' }),
  formatResolvedLocationTitle: (r: any) => r?.displayAddress ?? null,
}));

const mockGetCandidateDetails = jest.fn();
jest.mock('@/api/reviews/review', () => ({
  getCandidateSignDetails: (...args: any[]) => mockGetCandidateDetails(...args),
}));

jest.mock('@/api/reviews/review-workflow', () => ({
  extractCoordinateFromCandidate: (c: any) =>
    c?.latitude != null ? { latitude: c.latitude, longitude: c.longitude } : { latitude: null, longitude: null },
  resolveS3Url: (k?: string) => (k ? `https://s3.mock/${k}` : ''),
}));

jest.mock('@/feature/review/hooks/use-review', () => ({
  useGetCatalog: () => ({
    data: {
      categories: [{ id: 1, code: 'PROHIB', nameVi: 'Cấm' }],
      signs: [
        { id: 10, categoryId: 1, signCode: 'P.102', nameVi: 'Cấm đi ngược', category: { id: 1, code: 'PROHIB', nameVi: 'Cấm' } },
        { id: 11, categoryId: 1, signCode: 'P.103', nameVi: 'Cấm ô tô', category: { id: 1, code: 'PROHIB', nameVi: 'Cấm' } },
        { id: 12, categoryId: 1, signCode: 'P.104', nameVi: 'Cấm xe máy', category: { id: 1, code: 'PROHIB', nameVi: 'Cấm' } },
        { id: 13, categoryId: 1, signCode: 'P.123', nameVi: 'Cấm rẽ', category: { id: 1, code: 'PROHIB', nameVi: 'Cấm' } },
        { id: 14, categoryId: 1, signCode: 'P.130', nameVi: 'Cấm đỗ', category: { id: 1, code: 'PROHIB', nameVi: 'Cấm' } },
      ],
    },
    isPending: false,
  }),
  useGetCandidateSignDetails: () => ({ data: { latitude: 10.77, longitude: 106.7, locationContext: { displayLocation: '• Q1, TP.HCM' } } }),
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
    onPrimary: '#FFFFFF',
  }),
}));

jest.mock('@/feature/review/components/report-new-sign-type-modal', () => ({
  ReportNewSignTypeModal: () => null,
}));

jest.mock('@/feature/review/components/review-instruction-modal', () => ({
  ReviewInstructionModal: ({ isHelpModalVisible, setIsHelpModalVisible }: any) => {
    const ReactActual = require('react');
    const { Pressable, Text } = require('react-native');
    return isHelpModalVisible
      ? ReactActual.createElement(Pressable, { testID: 'close-help', onPress: () => setIsHelpModalVisible(false) }, ReactActual.createElement(Text, null, 'Close Help'))
      : null;
  },
}));

let mockWorkflow: any;
jest.mock('@/feature/review/context/review-workflow-provider', () => ({
  useReviewWorkflow: () => mockWorkflow,
}));

import { SubmissionReviewScreen } from '@/feature/review/pages/submission-review-screen';

describe('SubmissionReviewScreen Branch Coverage', () => {
  const sub1: any = {
    id: 'sub-1',
    title: 'Cấm đi ngược chiều (P.102)',
    location: 'Estimated GPS coordinates available',
    captured: '10:00',
    image: { uri: 'https://s3.mock/sub1.jpg' },
    remedySigns: [{ id: 10, signCode: 'P.102', nameVi: 'Cấm đi ngược' }],
  };
  const sub2: any = {
    id: 'sub-2',
    title: 'Đường cong (W.201)',
    location: '• Q3, TP.HCM',
    image: { uri: 'https://s3.mock/sub2.jpg' },
  };

  let capturedPanCfg: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = {};
    jest.spyOn(Animated, 'timing').mockImplementation(() => ({ start: (cb?: any) => cb?.() }) as any);
    jest.spyOn(Animated, 'spring').mockImplementation(() => ({ start: (cb?: any) => cb?.() }) as any);
    jest.spyOn(Animated, 'event').mockImplementation(() => jest.fn() as any);
    jest.spyOn(PanResponder, 'create').mockImplementation((cfg: any) => {
      capturedPanCfg = cfg;
      return { panHandlers: {} } as any;
    });

    mockWorkflow = {
      cancelSubmissionCheck: jest.fn(),
      completeCurrentReview: jest.fn().mockResolvedValue(true),
      isLoading: false,
      isSubmittingReview: false,
      jumpToSubmissionIndex: jest.fn(),
      jumpToSubmissionById: jest.fn(),
      keepCurrentReviewAndNext: jest.fn().mockReturnValue(true),
      pendingSubmissions: [sub1, sub2],
      recheckingPreviousAction: undefined,
      recheckingSubmission: false,
      reviewHistory: [{ action: 'approved', submission: sub2 }],
      totalSubmissions: 2,
      undoLastReview: jest.fn(),
    };
  });

  it('covers loading, complete empty state routes, params (resumeIndex/targetSubmissionId), recheck keep/fix/cancel, zoom, focus, sheets, and swipes', async () => {
    const loadingScreen = await render(<SubmissionReviewScreen state="loading" />);
    expect(loadingScreen).toBeTruthy();

    mockParams = { resumeIndex: '1', targetSubmissionId: 'sub-1' };
    mockWorkflow = {
      ...mockWorkflow,
      pendingSubmissions: [sub1, sub2],
      recheckingSubmission: true,
      recheckingPreviousAction: 'declined',
    };
    const screen = await render(<SubmissionReviewScreen />);
    expect(mockWorkflow.jumpToSubmissionIndex).toHaveBeenCalledWith(1);
    expect(mockWorkflow.jumpToSubmissionById).toHaveBeenCalledWith('sub-1');

    // Toggle focus & open zoom modal + fullscreen focus toggle + close zoom
    await fireEvent.press(screen.getByLabelText('Toggle sign focus'));
    await fireEvent.press(screen.getByLabelText('Ảnh biển báo. Chạm để phóng to.'));
    await fireEvent.press(screen.getByLabelText('Toggle sign focus in fullscreen'));
    await fireEvent.press(screen.getAllByLabelText('Đóng xem phóng to')[0]);

    // Location navigation button & back button in recheck mode
    await fireEvent.press(screen.getByTestId('move-to-sign-location-button'));
    expect(mockNavigateToSign).toHaveBeenCalled();

    // Keep voted result -> routes to reviewer-history
    await fireEvent.press(screen.getByText(/Giữ nguyên|Xác nhận|Tiếp tục/i));
    await fireEvent.press(screen.getByTestId('submission-review-back-button'));
    expect(mockWorkflow.cancelSubmissionCheck).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalled();

    // Normal review mode: Undo, Help modal, Approve fail toast, Skip, Decline + catalog picker, Report missing_type & regular
    mockWorkflow = { ...mockWorkflow, recheckingSubmission: false, recheckingPreviousAction: undefined };
    await screen.rerender(<SubmissionReviewScreen />);

    await fireEvent.press(screen.getByLabelText('Undo last review action'));
    expect(mockWorkflow.undoLastReview).toHaveBeenCalled();

    await fireEvent.press(screen.getByLabelText('Hướng dẫn thao tác thẩm định'));
    await fireEvent.press(screen.getByTestId('close-help'));

    mockWorkflow.completeCurrentReview.mockResolvedValueOnce(false);
    await fireEvent.press(screen.getByLabelText('Approve submission'));
    await fireEvent.press(screen.getByLabelText('Skip submission (cannot identify)'));

    await fireEvent.press(screen.getByLabelText('Decline submission'));
    await fireEvent.press(screen.getByLabelText('Chọn biển báo từ danh mục'));
    await fireEvent.press(screen.getAllByLabelText('Chọn biển báo P.103 - Cấm ô tô')[0]);
    await fireEvent.press(screen.getByText('Xác nhận chọn'));

    await fireEvent.press(screen.getByLabelText('Report submission'));
    await fireEvent.changeText(screen.getByLabelText('Report Note, required'), 'Ảnh bị mờ');
    await fireEvent.press(screen.getByText('Gửi báo cáo'));

    await fireEvent.press(screen.getByLabelText('Report submission'));
    await fireEvent.press(screen.getByText('Biển chưa có trong danh mục'));
    await fireEvent.press(screen.getByText('Gửi báo cáo'));

    // 4-way swipes + spring-back
    await act(async () => {
      capturedPanCfg.onMoveShouldSetPanResponder({}, { dx: 15, dy: 0 });
      capturedPanCfg.onPanResponderRelease({}, { dx: 120, dy: 0, vx: 0.5, vy: 0 });
      capturedPanCfg.onPanResponderRelease({}, { dx: -120, dy: 0, vx: -0.5, vy: 0 });
      capturedPanCfg.onPanResponderRelease({}, { dx: 0, dy: -120, vx: 0, vy: -0.5 });
      capturedPanCfg.onPanResponderRelease({}, { dx: 0, dy: 120, vx: 0, vy: 0.5 });
      capturedPanCfg.onPanResponderRelease({}, { dx: 5, dy: 5, vx: 0, vy: 0 });
    });

    // Empty complete queue CTA buttons
    mockWorkflow = { ...mockWorkflow, pendingSubmissions: [] };
    await screen.rerender(<SubmissionReviewScreen />);
    await fireEvent.press(screen.getByText('Lịch sử thẩm định'));
    await fireEvent.press(screen.getByText('Trang làm việc'));
    expect(mockReplace).toHaveBeenCalled();
  });
});
