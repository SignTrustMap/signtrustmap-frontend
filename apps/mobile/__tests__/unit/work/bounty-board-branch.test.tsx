jest.unmock('@/feature/work/hooks/use-bounty-board');
let mockBannerClaims: any = undefined;
const mockInvalidateQueries = jest.fn();

jest.mock('@tanstack/react-query', () => ({
  skipToken: Symbol('skipToken'),
  QueryClient: class MockQueryClient {},
  QueryClientProvider: ({ children }: any) => children,
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
  useQuery: (opts: any) => {
    if (typeof opts?.queryFn === 'function' && opts.enabled !== false) {
      void opts.queryFn({ signal: {} });
    }
    if (Array.isArray(opts?.queryKey) && opts.queryKey.includes('my-claims')) {
      return { data: mockBannerClaims, isLoading: false, isSuccess: true };
    }
    return { data: [], isLoading: false, isSuccess: true };
  },
  useMutation: (opts: any) => ({
    mutateAsync: async (vars: any) => {
      const res = await opts.mutationFn(vars);
      opts.onSuccess?.(res, vars, undefined);
      return res;
    },
    isPending: false,
  }),
}));

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, renderHook, waitFor } from '@testing-library/react-native';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  return {
    MaterialCommunityIcons: (p: any) => <View testID={`mc-${p.name}`} {...p} />,
  };
});

jest.mock('expo-image', () => {
  const { View } = require('react-native');
  return {
    Image: (p: any) => <View testID="expo-image" {...p} />,
  };
});

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    backgroundElement: '#F8FAFC',
    surface: '#FFFFFF',
    border: '#E2E8F0',
    text: '#0F172A',
    textSecondary: '#475569',
    placeholder: '#94A3B8',
    primary: '#2563EB',
    onPrimary: '#FFFFFF',
    danger: '#DC2626',
  }),
}));

const mockApiRequest = jest.fn();
const mockJsonApiRequest = jest.fn();
jest.mock('@/api/api-client', () => ({
  apiRequest: (...args: any[]) => mockApiRequest(...args),
  jsonApiRequest: (...args: any[]) => mockJsonApiRequest(...args),
}));

let mockSession: any = { accessToken: 'tok-bounty', account: { id: 'rev-1' } };
jest.mock('@/context/session-provider', () => ({
  useSession: () => ({ session: mockSession }),
}));

let mockMapLibre: any = null;
jest.mock('@/services/maplibre', () => ({
  getMapLibre: () => mockMapLibre,
}));

jest.mock('@/api/reviews/review-workflow', () => ({
  resolveS3Url: (url?: string | null) => (url ? (url.startsWith('http') ? url : `https://cdn/${url}`) : undefined),
}));

import {
  abandonQuest,
  checkInCandidate,
  claimQuest,
  getAvailableQuests,
  getMyClaims,
} from '@/api/reviews/bounty-board';
import {
  bountyKeys,
  useAbandonBountyQuest,
  useAvailableBountyQuests,
  useCheckInCandidate,
  useClaimBountyQuest,
  useMyBountyClaims,
} from '@/feature/work/hooks/use-bounty-board';
import { BountyQuestCard } from '@/feature/work/components/bounty-quest-card';
import { ActiveQuestItemCard } from '@/feature/work/components/active-quest-item-card';
import { ActiveQuestBanner } from '@/feature/work/components/active-quest-banner';
import { QuestClaimConfirmModal } from '@/feature/work/components/quest-claim-confirm-modal';
import type { BountyQuestItem, ReviewerQuestClaim } from '@/types/bountyBoardType';

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe('Bounty Board API, hooks, cards, banner, and modal branch coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSession = { accessToken: 'tok-bounty', account: { id: 'rev-1' } };
    mockMapLibre = null;
    mockBannerClaims = undefined;
    mockApiRequest.mockResolvedValue([]);
    mockJsonApiRequest.mockResolvedValue({ id: 'claim-1' });
  });

  afterEach(async () => {
    await act(async () => {
      cleanup();
    });
  });

  it('covers all bounty-board API functions with full and empty params', async () => {
    await getAvailableQuests({}, 'tok');
    expect(mockApiRequest).toHaveBeenCalledWith(
      expect.stringMatching(/bounty-board\/available$/),
      expect.any(Object),
      'tok',
    );

    await getAvailableQuests(
      { latitude: 10.7, longitude: 106.7, radiusKm: 10, targetType: 'CANDIDATE_VALIDATION' },
      'tok',
    );
    expect(mockApiRequest).toHaveBeenLastCalledWith(
      expect.stringContaining('targetType=CANDIDATE_VALIDATION'),
      expect.any(Object),
      'tok',
    );

    await getMyClaims('tok');
    await claimQuest({ targetType: 'REVALIDATION_TASK', targetId: 't1' }, 'tok');
    await abandonQuest('c 1', 'busy', 'tok');
    await checkInCandidate('cand 1', { lat: 10.7, lon: 106.7 }, 'tok');
    await checkInCandidate('cand 1', { lat: 10.7, lon: 106.7, accuracyMeters: 12 }, 'tok');
    expect(mockApiRequest).toHaveBeenLastCalledWith(
      expect.stringContaining('accuracyMeters=12'),
      expect.any(Object),
      'tok',
    );
  });

  it('covers use-bounty-board hooks with and without session', async () => {
    const wrapper = makeWrapper();
    mockApiRequest.mockResolvedValue([
      {
        id: 'cl-1',
        reviewerId: 'rev-1',
        targetType: 'CANDIDATE_VALIDATION',
        targetId: 't1',
        status: 'CLAIMED',
        timeLimitMinutes: 120,
        claimedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        completedAt: null,
        baseRewardCredits: 5,
        escalatedBonusCredits: 2,
        penaltyApplied: false,
        penaltyNotes: null,
      },
    ]);

    expect(bountyKeys.all()).toEqual(['bounty-board', undefined]);
    await renderHook(() => useAvailableBountyQuests({ radiusKm: 15 }), { wrapper });
    await renderHook(() => useMyBountyClaims(), { wrapper });
    const mClaim = await renderHook(() => useClaimBountyQuest(), { wrapper });
    const mAbandon = await renderHook(() => useAbandonBountyQuest(), { wrapper });
    const mCheckIn = await renderHook(() => useCheckInCandidate(), { wrapper });

    await waitFor(() => expect(mockApiRequest).toHaveBeenCalledTimes(2));
    await act(async () => {
      await mClaim.result.current.mutateAsync({ targetType: 'CANDIDATE_VALIDATION', targetId: 'x' });
      await mAbandon.result.current.mutateAsync({ claimId: 'cl-1', reason: 'done' });
      await mCheckIn.result.current.mutateAsync({ candidateId: 'x', coords: { lat: 10, lon: 106 } });
    });

    // No session branches
    mockSession = null;
    await renderHook(() => useAvailableBountyQuests({}), { wrapper });
    await renderHook(() => useMyBountyClaims(false), { wrapper });
    const mClaimNo = await renderHook(() => useClaimBountyQuest(), { wrapper });
    const mAbandonNo = await renderHook(() => useAbandonBountyQuest(), { wrapper });
    const mCheckNo = await renderHook(() => useCheckInCandidate(), { wrapper });

    await expect(
      mClaimNo.result.current.mutateAsync({ targetType: 'CANDIDATE_VALIDATION', targetId: 'x' }),
    ).rejects.toThrow();
    await expect(
      mAbandonNo.result.current.mutateAsync({ claimId: 'cl-1' }),
    ).rejects.toThrow();
    await expect(
      mCheckNo.result.current.mutateAsync({ candidateId: 'x', coords: { lat: 1, lon: 2 } }),
    ).rejects.toThrow();
  });

  it('covers BountyQuestCard variants (image/placeholder, <1km/>=1km/null distance, promoted, claiming)', async () => {
    const onClaim = jest.fn();
    const fullQuest: BountyQuestItem = {
      targetType: 'CANDIDATE_VALIDATION',
      targetId: 'q-1',
      title: 'T1',
      signCode: 'P.102',
      signName: 'Cấm đi ngược chiều',
      signCropUrl: 'crop.jpg',
      bestFrameUrl: null,
      latitude: 10.7,
      longitude: 106.7,
      distanceMeters: 1450,
      votesCount: 1,
      isPromoted: true,
      baseRewardCredits: 5,
      escalatedBonusCredits: 3,
      totalRewardCredits: 8,
    };

    const s1 = await render(<BountyQuestCard quest={fullQuest} onClaim={onClaim} />);
    expect(s1.getByText('Cách 1.4 km')).toBeTruthy();
    expect(s1.getByText('Thưởng thêm')).toBeTruthy();
    expect(s1.getByText('Biển báo mới')).toBeTruthy();

    await s1.rerender(
      <BountyQuestCard
        isClaiming
        onClaim={onClaim}
        quest={{
          ...fullQuest,
          targetType: 'REVALIDATION_TASK',
          signCropUrl: null,
          bestFrameUrl: null,
          signName: null,
          signCode: null,
          distanceMeters: 350,
          isPromoted: false,
        }}
      />,
    );
    expect(s1.getByText('Cách 350 m')).toBeTruthy();
    expect(s1.getByText('Đang nhận...')).toBeTruthy();
    expect(s1.getByText('Biển cần kiểm tra lại')).toBeTruthy();

    await s1.rerender(
      <BountyQuestCard
        onClaim={onClaim}
        quest={{ ...fullQuest, distanceMeters: null, signCropUrl: null, bestFrameUrl: 'f.jpg' }}
      />,
    );
    expect(s1.getByText('Chưa rõ khoảng cách')).toBeTruthy();
    await fireEvent.press(s1.getByLabelText('Nhận nhiệm vụ'));
    expect(onClaim).toHaveBeenCalled();
  });

  it('covers ActiveQuestItemCard and ActiveQuestBanner normal, urgent (<15m), expired, and navigation branches', async () => {
    jest.useFakeTimers();
    const onAbandon = jest.fn();

    const urgentClaim: ReviewerQuestClaim = {
      id: 'c-urg',
      reviewerId: 'rev-1',
      targetType: 'CANDIDATE_VALIDATION',
      targetId: 'cand-5',
      status: 'CLAIMED',
      timeLimitMinutes: 120,
      claimedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      completedAt: null,
      baseRewardCredits: 5,
      escalatedBonusCredits: 2,
      penaltyApplied: false,
      penaltyNotes: null,
    };

    const sCard = await render(
      <ActiveQuestItemCard claim={urgentClaim} onAbandon={onAbandon} />,
    );
    await act(async () => {
      jest.advanceTimersByTime(1100);
    });
    await fireEvent.press(sCard.getByLabelText('Đến vị trí xác thực'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/work/submission-review',
      params: { candidateId: 'cand-5', questClaimId: 'c-urg' },
    });

    await fireEvent.press(sCard.getByText('Hủy nhiệm vụ'));
    expect(onAbandon).toHaveBeenCalledWith(urgentClaim);

    await sCard.rerender(
      <ActiveQuestItemCard
        claim={{
          ...urgentClaim,
          targetType: 'REVALIDATION_TASK',
          targetId: 'task-8',
          expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          escalatedBonusCredits: 0,
        }}
        isAbandoning
        onAbandon={onAbandon}
      />,
    );
    await fireEvent.press(sCard.getByLabelText('Đến vị trí xác thực'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/work/revalidation-review',
      params: { taskId: 'task-8', questClaimId: 'c-urg' },
    });

    await sCard.rerender(
      <ActiveQuestItemCard
        claim={{ ...urgentClaim, expiresAt: new Date(Date.now() - 1000).toISOString() }}
        onAbandon={onAbandon}
      />,
    );
    await act(async () => {
      jest.advanceTimersByTime(1100);
    });
    expect(sCard.getByText('Đã quá hạn')).toBeTruthy();

    jest.useRealTimers();
  });

  it('covers ActiveQuestBanner claim display and navigation', async () => {
    const wrapper = makeWrapper();
    const bannerClaim: ReviewerQuestClaim = {
      id: 'c-urg',
      reviewerId: 'rev-1',
      targetType: 'REVALIDATION_TASK',
      targetId: 'task-9',
      status: 'CLAIMED',
      timeLimitMinutes: 120,
      claimedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      completedAt: null,
      baseRewardCredits: 5,
      escalatedBonusCredits: 2,
      penaltyApplied: false,
      penaltyNotes: null,
    };
    mockBannerClaims = [bannerClaim];
    const sBanner = await render(<ActiveQuestBanner />, { wrapper });
    await waitFor(() => expect(sBanner.getByLabelText('Nhiệm vụ đang thực hiện')).toBeTruthy());
    await fireEvent.press(sBanner.getByLabelText('Nhiệm vụ đang thực hiện'));
    expect(mockPush).toHaveBeenLastCalledWith({
      pathname: '/work/revalidation-review',
      params: { taskId: 'task-9', questClaimId: 'c-urg' },
    });

    // Candidate validation target branch & null render when empty
    mockBannerClaims = [{ ...bannerClaim, targetType: 'CANDIDATE_VALIDATION', targetId: 'cand-99', escalatedBonusCredits: 0 }];
    await sBanner.rerender(<ActiveQuestBanner />);
    await fireEvent.press(sBanner.getByLabelText('Nhiệm vụ đang thực hiện'));
    expect(mockPush).toHaveBeenLastCalledWith({
      pathname: '/work/submission-review',
      params: { candidateId: 'cand-99', questClaimId: 'c-urg' },
    });

    mockBannerClaims = [];
    await sBanner.rerender(<ActiveQuestBanner />);
    expect(sBanner.queryByLabelText('Nhiệm vụ đang thực hiện')).toBeNull();
  });

  it('covers QuestClaimConfirmModal null, fallback map, MapLibre map, and loading states', async () => {
    const onConfirm = jest.fn();
    const onClose = jest.fn();
    const quest: BountyQuestItem = {
      targetType: 'CANDIDATE_VALIDATION',
      targetId: 'qm-1',
      title: 'Title',
      signCode: 'W.201',
      signName: 'Chỗ ngoặt',
      signCropUrl: null,
      bestFrameUrl: 'best.jpg',
      displayAddress: 'Q1 HCM',
      latitude: 10.77,
      longitude: 106.7,
      distanceMeters: 2500,
      votesCount: 0,
      isPromoted: false,
      baseRewardCredits: 5,
      escalatedBonusCredits: 0,
      totalRewardCredits: 5,
    };

    const sNull = await render(
      <QuestClaimConfirmModal visible quest={null} onClose={onClose} onConfirm={onConfirm} />,
    );
    expect(sNull.queryByText('Xác nhận nhận nhiệm vụ')).toBeNull();

    // Fallback map (no MapLibre)
    await sNull.rerender(
      <QuestClaimConfirmModal visible quest={quest} onClose={onClose} onConfirm={onConfirm} />,
    );
    expect(sNull.getByText('Q1 HCM')).toBeTruthy();
    expect(sNull.getByText('Cách vị trí hiện tại: 2.5 km')).toBeTruthy();

    await fireEvent.press(sNull.getByText('Đồng ý nhận'));
    expect(onConfirm).toHaveBeenCalled();

    // With MapLibre available
    const { View } = require('react-native');
    mockMapLibre = {
      Map: (p: any) => <View testID="qm-map">{p.children}</View>,
      Camera: (p: any) => <View testID="qm-cam" {...p} />,
      Marker: (p: any) => <View testID="qm-marker">{p.children}</View>,
    };
    await sNull.rerender(
      <QuestClaimConfirmModal
        visible
        loading
        quest={{ ...quest, distanceMeters: 420, signCropUrl: 'crop.jpg', latitude: 10.77, longitude: 106.7 }}
        onClose={onClose}
        onConfirm={onConfirm}
      />,
    );
    expect(sNull.getByTestId('qm-map')).toBeTruthy();
    expect(sNull.getByText('Đang nhận...')).toBeTruthy();
    expect(sNull.getByText('Cách vị trí hiện tại: 420 mét')).toBeTruthy();

    // No coordinates
    await sNull.rerender(
      <QuestClaimConfirmModal
        visible
        quest={{ ...quest, latitude: null, longitude: null, distanceMeters: null, signName: null, signCode: null }}
        onClose={onClose}
        onConfirm={onConfirm}
      />,
    );
    expect(sNull.getByText('Biển báo giao thông')).toBeTruthy();
  });
});
