import React from 'react';
import { fireEvent, render, cleanup } from '@testing-library/react-native';

import { ActiveQuestBanner } from '@/feature/work/components/active-quest-banner';
import { ActiveQuestItemCard } from '@/feature/work/components/active-quest-item-card';
import { BountyQuestCard } from '@/feature/work/components/bounty-quest-card';
import type { BountyQuestItem, ReviewerQuestClaim } from '@/types/bountyBoardType';

const mockPush = jest.fn();
let mockMyClaims: ReviewerQuestClaim[] = [];

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

jest.mock('expo-image', () => ({
  Image: 'Image',
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    surface: '#F8FAFC',
    backgroundElement: '#F1F5F9',
    text: '#0F172A',
    textSecondary: '#64748B',
    placeholder: '#94A3B8',
    border: '#E2E8F0',
    primary: '#007B8B',
    danger: '#EF4444',
  }),
}));

jest.mock('@/feature/work/hooks/use-bounty-board', () => ({
  useMyBountyClaims: () => ({
    data: mockMyClaims,
    isLoading: false,
  }),
}));

function buildClaim(overrides: Partial<ReviewerQuestClaim> = {}): ReviewerQuestClaim {
  return {
    id: 'claim-1',
    reviewerId: 'reviewer-1',
    targetType: 'REVALIDATION_TASK',
    targetId: 'task-123',
    status: 'CLAIMED',
    timeLimitMinutes: 120,
    claimedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    completedAt: null,
    baseRewardCredits: 25,
    escalatedBonusCredits: 5,
    penaltyApplied: false,
    penaltyNotes: null,
    ...overrides,
  };
}

describe('Bounty quest navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMyClaims = [];
  });

  afterEach(() => {
    cleanup();
  });

  it('navigates REVALIDATION_TASK from ActiveQuestItemCard to /work/revalidation-review', async () => {
    const claim = buildClaim({
      id: 'claim-reval-1',
      targetType: 'REVALIDATION_TASK',
      targetId: 'task-999',
    });

    const { getByLabelText } = await render(
      <ActiveQuestItemCard claim={claim} onAbandon={jest.fn()} />,
    );

    fireEvent.press(getByLabelText('Đến vị trí xác thực'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/work/revalidation-review',
      params: {
        taskId: 'task-999',
        questClaimId: 'claim-reval-1',
      },
    });
  });

  it('navigates CANDIDATE_VALIDATION from ActiveQuestItemCard to /work/submission-review', async () => {
    const claim = buildClaim({
      id: 'claim-cand-1',
      targetType: 'CANDIDATE_VALIDATION',
      targetId: 'cand-555',
    });

    const { getByLabelText } = await render(
      <ActiveQuestItemCard claim={claim} onAbandon={jest.fn()} />,
    );

    fireEvent.press(getByLabelText('Đến vị trí xác thực'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/work/submission-review',
      params: {
        candidateId: 'cand-555',
        questClaimId: 'claim-cand-1',
      },
    });
  });

  it('navigates REVALIDATION_TASK from ActiveQuestBanner to /work/revalidation-review', async () => {
    mockMyClaims = [
      buildClaim({
        id: 'claim-banner-reval',
        targetType: 'REVALIDATION_TASK',
        targetId: 'task-888',
      }),
    ];

    const { getByLabelText } = await render(<ActiveQuestBanner />);

    fireEvent.press(getByLabelText('Nhiệm vụ đang thực hiện'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/work/revalidation-review',
      params: {
        taskId: 'task-888',
        questClaimId: 'claim-banner-reval',
      },
    });
  });

  it('renders enriched sign name, code, address, and distance without parentheses on ActiveQuestItemCard', async () => {
    const claim = buildClaim({
      id: 'claim-enriched-1',
      targetType: 'REVALIDATION_TASK',
      targetId: 'task-777',
      signCode: 'P.102',
      signName: 'Đường cấm đi ngược chiều',
      displayAddress: 'Đường Nguyễn Huệ, Quận 1',
      distanceMeters: 340,
      totalRewardCredits: 120,
    });

    const { getByText } = await render(
      <ActiveQuestItemCard claim={claim} onAbandon={jest.fn()} />,
    );

    expect(getByText('Biển cần kiểm tra lại')).toBeTruthy();
    expect(getByText('P.102')).toBeTruthy();
    expect(getByText('Đường cấm đi ngược chiều')).toBeTruthy();
    expect(getByText('Đường Nguyễn Huệ, Quận 1')).toBeTruthy();
    expect(getByText('Cách 340 m')).toBeTruthy();
    expect(getByText('+120 điểm')).toBeTruthy();
  });

  it('renders available BountyQuestCard with clean layout, address, distance, and no parentheses', async () => {
    const quest: BountyQuestItem = {
      targetType: 'CANDIDATE_VALIDATION',
      targetId: 'cand-101',
      title: 'Verify Cấm rẽ trái (P.123a)',
      signCode: 'P.123a',
      signName: 'Cấm rẽ trái',
      signCropUrl: null,
      bestFrameUrl: null,
      displayAddress: 'Đường Lê Lợi, Quận 1',
      latitude: 10.775,
      longitude: 106.7,
      distanceMeters: 1250,
      votesCount: 1,
      isPromoted: true,
      baseRewardCredits: 10,
      escalatedBonusCredits: 5,
      totalRewardCredits: 15,
    };

    const onClaim = jest.fn();
    const { getByLabelText, getByText } = await render(
      <BountyQuestCard quest={quest} onClaim={onClaim} />,
    );

    expect(getByText('Biển báo mới')).toBeTruthy();
    expect(getByText('P.123a')).toBeTruthy();
    expect(getByText('Thưởng thêm')).toBeTruthy();
    expect(getByText('Cấm rẽ trái')).toBeTruthy();
    expect(getByText('Đường Lê Lợi, Quận 1')).toBeTruthy();
    expect(getByText('Cách 1.3 km')).toBeTruthy();
    expect(getByText('+15 điểm')).toBeTruthy();
    expect(getByText('Thời gian làm 120 phút')).toBeTruthy();

    fireEvent.press(getByLabelText('Nhận nhiệm vụ'));
    expect(onClaim).toHaveBeenCalledWith(quest);
  });
});
