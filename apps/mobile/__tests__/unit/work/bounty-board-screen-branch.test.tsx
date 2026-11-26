import React from 'react';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react-native';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn() }),
}));

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: (p: any) => <View {...p}>{p.children}</View>,
  };
});

jest.mock('@expo/vector-icons', () => {
  const { View } = require('react-native');
  return {
    MaterialCommunityIcons: (p: any) => <View testID={`mc-${p.name}`} {...p} />,
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
  }),
}));

const mockFetchFreshGpsLocation = jest.fn();
jest.mock('@/feature/navigation/utils/gps', () => ({
  fetchFreshGpsLocation: (...args: any[]) => mockFetchFreshGpsLocation(...args),
}));

const mockRefetchAvailable = jest.fn();
const mockRefetchClaims = jest.fn();
const mockClaimMutate = jest.fn();
const mockAbandonMutate = jest.fn();

let mockAvailableData: any = [];
let mockIsLoadingAvailable = false;
let mockIsRefetchingAvailable = false;
let mockClaimsData: any = [];
let mockIsLoadingClaims = false;
let mockIsRefetchingClaims = false;
let mockModalProps: any = null;

jest.mock('@/feature/work/hooks/use-bounty-board', () => ({
  useAvailableBountyQuests: () => ({
    data: mockAvailableData,
    isLoading: mockIsLoadingAvailable,
    isRefetching: mockIsRefetchingAvailable,
    refetch: mockRefetchAvailable,
  }),
  useMyBountyClaims: () => ({
    data: mockClaimsData,
    isLoading: mockIsLoadingClaims,
    isRefetching: mockIsRefetchingClaims,
    refetch: mockRefetchClaims,
  }),
  useClaimBountyQuest: () => ({
    mutateAsync: mockClaimMutate,
    isPending: false,
  }),
  useAbandonBountyQuest: () => ({
    mutateAsync: mockAbandonMutate,
    isPending: false,
  }),
}));

jest.mock('@/feature/work/components/bounty-quest-card', () => {
  const { Pressable, Text } = require('react-native');
  return {
    BountyQuestCard: (p: any) => (
      <Pressable testID={`quest-card-${p.quest.targetId}`} onPress={() => p.onClaim(p.quest)}>
        <Text>{p.quest.signName || p.quest.targetId}</Text>
      </Pressable>
    ),
  };
});

jest.mock('@/feature/work/components/active-quest-item-card', () => {
  const { Pressable, Text } = require('react-native');
  return {
    ActiveQuestItemCard: (p: any) => (
      <Pressable testID={`claim-card-${p.claim.id}`} onPress={() => p.onAbandon(p.claim)}>
        <Text>{p.claim.targetId}</Text>
      </Pressable>
    ),
  };
});

jest.mock('@/feature/work/components/quest-claim-confirm-modal', () => {
  const { View, Pressable, Text } = require('react-native');
  return {
    QuestClaimConfirmModal: (p: any) => {
      mockModalProps = p;
      return p.visible ? (
        <View testID="claim-confirm-modal">
          <Pressable testID="modal-confirm" onPress={p.onConfirm}>
            <Text>Confirm</Text>
          </Pressable>
          <Pressable testID="modal-close" onPress={p.onClose}>
            <Text>Close</Text>
          </Pressable>
        </View>
      ) : null;
    },
  };
});

jest.mock('@/components/toast', () => {
  const { Pressable, Text } = require('react-native');
  return {
    AppToast: (p: any) => (
      <Pressable testID="bounty-toast" onPress={p.onDismiss}>
        <Text>{p.message}</Text>
      </Pressable>
    ),
  };
});

import { BountyBoardScreen } from '@/feature/work/pages/bounty-board-screen';

describe('BountyBoardScreen branch coverage', () => {
  const sampleQuests = [
    { targetType: 'CANDIDATE_VALIDATION', targetId: 'q1', signName: 'Cấm đỗ' },
  ];
  const sampleClaims = [
    { id: 'cl1', targetType: 'CANDIDATE_VALIDATION', targetId: 'c1', status: 'CLAIMED' },
    { id: 'cl2', targetType: 'REVALIDATION_TASK', targetId: 'c2', status: 'EXPIRED' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchFreshGpsLocation.mockResolvedValue({ latitude: 10.77, longitude: 106.7 });
    mockAvailableData = sampleQuests;
    mockIsLoadingAvailable = false;
    mockIsRefetchingAvailable = false;
    mockClaimsData = sampleClaims;
    mockIsLoadingClaims = false;
    mockIsRefetchingClaims = false;
    mockClaimMutate.mockResolvedValue({});
    mockAbandonMutate.mockResolvedValue({});
  });

  afterEach(async () => {
    await act(async () => {
      cleanup();
    });
  });

  it('covers loading spinners and empty lists across available and my-claims tabs', async () => {
    mockFetchFreshGpsLocation.mockRejectedValueOnce(new Error('gps err'));
    mockAvailableData = undefined;
    mockIsLoadingAvailable = true;
    mockClaimsData = undefined;
    mockIsLoadingClaims = true;

    const screen = await render(<BountyBoardScreen />);
    expect(screen.getByText('Đang tìm nhiệm vụ gần bạn...')).toBeTruthy();

    await fireEvent.press(screen.getByText('Đang thực hiện'));
    expect(screen.getByText('Đang tải nhiệm vụ của bạn...')).toBeTruthy();

    // Empty lists
    mockAvailableData = [];
    mockIsLoadingAvailable = false;
    mockClaimsData = [];
    mockIsLoadingClaims = false;
    await screen.rerender(<BountyBoardScreen />);
    expect(screen.getByText('Chưa có nhiệm vụ đang làm')).toBeTruthy();

    await fireEvent.press(screen.getByText('Có thể nhận'));
    expect(screen.getByText('Không có nhiệm vụ nào gần đây')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Quay lại'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('covers filter chips, GPS refresh, claim confirmation error/success, tab badge, abandon error/success, and toast dismiss', async () => {
    const screen = await render(<BountyBoardScreen />);

    await waitFor(() => expect(screen.getByTestId('quest-card-q1')).toBeTruthy());

    // Switch filter chips
    await fireEvent.press(screen.getByText('Biển báo mới'));
    await fireEvent.press(screen.getByText('Biển cần kiểm tra lại'));
    await fireEvent.press(screen.getByText('Tất cả'));

    // Refresh on available tab
    await fireEvent.press(screen.getByLabelText('Làm mới vị trí'));
    expect(mockRefetchAvailable).toHaveBeenCalled();

    // Open modal & close
    await fireEvent.press(screen.getByTestId('quest-card-q1'));
    expect(screen.getByTestId('claim-confirm-modal')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('modal-close'));
    expect(screen.queryByTestId('claim-confirm-modal')).toBeNull();

    // Open modal & fail claim
    await fireEvent.press(screen.getByTestId('quest-card-q1'));
    mockClaimMutate.mockRejectedValueOnce(new Error('Đã hết lượt'));
    await fireEvent.press(screen.getByTestId('modal-confirm'));
    expect(screen.getByText('Đã hết lượt')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('bounty-toast'));

    // Confirm claim success -> switches to my-claims tab & displays active count badge '1'
    await fireEvent.press(screen.getByTestId('modal-confirm'));
    expect(screen.getByText('Đã nhận nhiệm vụ thành công')).toBeTruthy();
    expect(screen.getByTestId('claim-card-cl1')).toBeTruthy();
    expect(screen.queryByTestId('claim-card-cl2')).toBeNull();

    // Refresh on my-claims tab
    await fireEvent.press(screen.getByLabelText('Làm mới vị trí'));
    expect(mockRefetchClaims).toHaveBeenCalled();

    // Abandon failure then success
    mockAbandonMutate.mockRejectedValueOnce(new Error('Không hủy được'));
    await fireEvent.press(screen.getByTestId('claim-card-cl1'));
    expect(screen.getByText('Không hủy được')).toBeTruthy();

    mockAbandonMutate.mockResolvedValueOnce({});
    await fireEvent.press(screen.getByTestId('claim-card-cl1'));
    expect(screen.getByText('Đã hủy nhiệm vụ')).toBeTruthy();
  });
});
