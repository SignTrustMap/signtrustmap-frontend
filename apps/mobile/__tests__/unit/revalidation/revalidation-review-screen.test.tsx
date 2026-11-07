import React from 'react';
import { render, fireEvent, act, cleanup } from '@testing-library/react-native';
import { RevalidationReviewScreen } from '@/feature/revalidation/pages/revalidation-review-screen';
import * as workflowContext from '@/feature/revalidation/context/revalidation-workflow-provider';
import { useRouter } from 'expo-router';

// Mocks
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(() => ({})),
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

jest.mock('expo-image', () => ({
  Image: 'Image',
}));

jest.mock('expo-symbols', () => ({
  SymbolView: 'SymbolView',
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children, ...props }: any) => {
    const R = require('react');
    return R.createElement('SafeAreaView', props, children);
  },
  useSafeAreaInsets: () => ({ top: 0, left: 0, right: 0, bottom: 0 }),
}));

jest.mock('@/feature/review/hooks/use-review', () => ({
  useGetCatalog: () => ({ data: { categories: [], signs: [] }, isLoading: false }),
}));

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: jest.fn(),
    }),
    useQuery: jest.fn(() => ({
      data: { categories: [], signs: [] },
      isLoading: false,
    })),
  };
});

jest.mock('@/context/session-provider', () => ({
  useSession: () => ({
    session: {
      accessToken: 'test-token',
      account: { id: 'reviewer-1', displayName: 'Reviewer Test', roles: ['reviewer'] },
    },
  }),
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    surface: '#F8FAFC',
    backgroundElement: '#F1F5F9',
    backgroundSelected: '#E0F2FE',
    text: '#0F172A',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    placeholder: '#94A3B8',
    primary: '#0671EB',
    colors: {
      background: '#FFFFFF',
      surface: '#F8FAFC',
      text: '#0F172A',
      textSecondary: '#64748B',
      border: '#E2E8F0',
      primary: '#0671EB',
    },
  }),
}));

jest.mock('@/feature/revalidation/context/revalidation-workflow-provider', () => ({
  useRevalidationWorkflow: jest.fn(),
}));

jest.mock('@/feature/credits/hooks/use-wallet', () => ({
  useInvalidateWalletAndStats: () => jest.fn(),
}));

describe('RevalidationReviewScreen', () => {
  const mockRouter = {
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
  };

  const mockEvidenceItem = {
    evidenceId: 'ev-101',
    taskId: 'task-1',
    evidence: {
      id: 'ev-101',
      evidenceType: 'STILL_ACTIVE',
      mediaUrl: 'https://cdn.signmap.site/crops/p102.jpg',
      distanceMeters: 12,
      submittedAt: '2026-11-07T08:00:00Z',
    },
    verifiedSign: {
      id: 'sign-1',
      signCode: 'P.102',
      nameVi: 'Cấm đi ngược chiều',
      nameEn: 'No Entry',
      signCropUrl: 'https://cdn.signmap.site/crops/orig.jpg',
      lastVerifiedAt: '2026-10-01T00:00:00Z',
    },
    currentVoteCount: 3,
    rewardCredits: 10,
  };

  const createMockWorkflow = (overrides?: any) => ({
    queueItems: [mockEvidenceItem],
    reviewHistory: [],
    currentItem: mockEvidenceItem,
    nextItem: undefined,
    totalCount: 5,
    reviewPosition: 1,
    progressPercent: 20,
    counts: {
      STILL_ACTIVE: 0,
      REMOVED: 0,
      CHANGED: 0,
      UNCLEAR: 0,
      INVALID: 0,
    },
    handleVote: jest.fn().mockResolvedValue(true),
    handleSkip: jest.fn().mockReturnValue(true),
    finishReviews: jest.fn().mockReturnValue(1),
    refetchQueue: jest.fn(),
    resetWorkflow: jest.fn(),
    isLoading: false,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (workflowContext.useRevalidationWorkflow as jest.Mock).mockReturnValue(createMockWorkflow());
  });

  afterEach(async () => {
    cleanup();
  });

  it('renders loading skeleton when workflow is loading with empty queue', async () => {
    (workflowContext.useRevalidationWorkflow as jest.Mock).mockReturnValue(
      createMockWorkflow({ isLoading: true, queueItems: [], currentItem: undefined }),
    );

    const { getByLabelText } = await render(<RevalidationReviewScreen />);

    expect(getByLabelText('Đang tải các lượt tái thẩm định')).toBeTruthy();
  });

  it('renders empty queue state when there are no items and no review history', async () => {
    (workflowContext.useRevalidationWorkflow as jest.Mock).mockReturnValue(
      createMockWorkflow({ queueItems: [], currentItem: undefined, reviewHistory: [] }),
    );

    const { getByText } = await render(<RevalidationReviewScreen />);

    expect(getByText('Đã đánh giá tất cả minh chứng')).toBeTruthy();
    expect(getByText('Bạn đã xem xét tất cả các minh chứng tái thẩm định thực địa trong hàng đợi.')).toBeTruthy();

    const returnBtn = getByText('Quay lại công việc');
    await act(async () => {
      fireEvent.press(returnBtn);
    });

    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('renders active evidence item details with sign name, comparison telemetry, and reward credits', async () => {
    const { getByText } = await render(<RevalidationReviewScreen />);

    expect(getByText('Cấm đi ngược chiều')).toBeTruthy();
    expect(getByText('Cách vị trí cũ 12m')).toBeTruthy();
    expect(getByText('+10 Credits thưởng')).toBeTruthy();
    expect(getByText('KẾT LUẬN: BÁO CÁO VẪN CÒN')).toBeTruthy();
  });

  it('triggers handleAgree when pressing Agree button', async () => {
    const mockWorkflow = createMockWorkflow();
    (workflowContext.useRevalidationWorkflow as jest.Mock).mockReturnValue(mockWorkflow);

    const { getByLabelText } = await render(<RevalidationReviewScreen />);

    const agreeBtn = getByLabelText('Đồng ý với kết luận của điều tra viên');
    await act(async () => {
      fireEvent.press(agreeBtn);
    });

    expect(mockWorkflow.handleVote).toHaveBeenCalledWith('STILL_ACTIVE', undefined, undefined, 'AGREE');
  });

  it('triggers handleSkip when pressing Skip button', async () => {
    const mockWorkflow = createMockWorkflow();
    (workflowContext.useRevalidationWorkflow as jest.Mock).mockReturnValue(mockWorkflow);

    const { getByLabelText } = await render(<RevalidationReviewScreen />);

    const skipBtn = getByLabelText('Bỏ qua minh chứng này');
    await act(async () => {
      fireEvent.press(skipBtn);
    });

    expect(mockWorkflow.handleSkip).toHaveBeenCalled();
  });

  it('opens decline modal when pressing Decline button and confirms vote', async () => {
    const mockWorkflow = createMockWorkflow();
    (workflowContext.useRevalidationWorkflow as jest.Mock).mockReturnValue(mockWorkflow);

    const { getByLabelText, getByText } = await render(<RevalidationReviewScreen />);

    const declineBtn = getByLabelText('Từ chối kết luận của điều tra viên');
    await act(async () => {
      fireEvent.press(declineBtn);
    });

    expect(getByText('Xác nhận từ chối')).toBeTruthy();

    const confirmBtn = getByText('Xác nhận từ chối');
    await act(async () => {
      fireEvent.press(confirmBtn);
    });

    expect(mockWorkflow.handleVote).toHaveBeenCalledWith('STILL_ACTIVE', undefined, undefined, 'DECLINE');
  });

  it('renders summary review screen when review history is present', async () => {
    const mockHistory = [
      {
        action: 'STILL_ACTIVE' as const,
        item: mockEvidenceItem,
        userVerdict: 'AGREE' as const,
      },
    ];

    (workflowContext.useRevalidationWorkflow as jest.Mock).mockReturnValue(
      createMockWorkflow({
        currentItem: undefined,
        queueItems: [],
        reviewHistory: mockHistory,
        counts: { STILL_ACTIVE: 1, REMOVED: 0, CHANGED: 0, UNCLEAR: 0, INVALID: 0 },
      }),
    );

    const { getByText } = await render(<RevalidationReviewScreen />);

    expect(getByText('Tổng kết tái thẩm định')).toBeTruthy();
    expect(getByText(/Đã đánh giá 1 biển báo/)).toBeTruthy();

    const finishBtn = getByText('Hoàn tất');
    await act(async () => {
      fireEvent.press(finishBtn);
    });

    expect(mockRouter.replace).toHaveBeenCalledWith({
      pathname: '/work/submission-complete',
      params: { type: 'review_revalidation', count: '1' },
    });
  });
});
