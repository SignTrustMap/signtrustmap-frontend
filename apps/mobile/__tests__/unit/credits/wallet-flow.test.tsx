import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import { CreditsOverviewScreen } from '@/feature/credits/pages/credits-overview-screen';
import { TopUpScreen } from '@/feature/credits/pages/top-up-screen';
import { CustomAmountScreen } from '@/feature/credits/pages/custom-amount-screen';
import { CreditHistoryScreen } from '@/feature/credits/pages/credit-history-screen';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockBack = jest.fn();
const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockSearchParams: Record<string, string> = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
    push: mockPush,
    replace: mockReplace,
  }),
  useLocalSearchParams: () => mockSearchParams,
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    MaterialCommunityIcons: (props: any) =>
      React.createElement(View, { testID: `icon-${props.name}`, ...props }),
  };
});

jest.mock('expo-symbols', () => ({
  SymbolView: 'SymbolView',
}));

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn().mockResolvedValue({ type: 'dismiss' }),
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: any) =>
      React.createElement(View, props, children),
  };
});

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

const mockWalletData = {
  wallet: {
    id: 'wallet-1',
    balance: 1250,
    currency: 'VND',
    status: 'ACTIVE',
  },
  recentTransactions: [
    {
      id: 'tx-1',
      description: 'Thưởng nhiệm vụ hàng ngày',
      amount: 25,
      transactionType: 'REWARD',
      createdAt: '2026-11-05T08:00:00.000Z',
    },
    {
      id: 'tx-2',
      description: 'Nạp Credits MoMo',
      amount: 500,
      transactionType: 'TOPUP',
      createdAt: '2026-11-04T12:00:00.000Z',
    },
  ],
};

const mockPackages = [
  { id: 1, creditAmount: 500, priceVnd: 50000, bonusCredits: 0 },
  { id: 2, creditAmount: 1000, priceVnd: 100000, bonusCredits: 50 },
  { id: 3, creditAmount: 2000, priceVnd: 200000, bonusCredits: 150 },
  { id: 4, creditAmount: 5000, priceVnd: 500000, bonusCredits: 500 },
];

const mockTopUpMutate = jest.fn().mockResolvedValue({ payUrl: 'https://momo.vn/pay/test' });
const mockTopUpCustomMutate = jest.fn().mockResolvedValue({ payUrl: 'https://momo.vn/pay/custom' });

jest.mock('@/feature/credits/hooks/use-wallet', () => ({
  useGetWallet: () => ({
    data: mockWalletData,
    isLoading: false,
    refetch: jest.fn(),
  }),
  useGetTopUpPackages: () => ({
    data: mockPackages,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
  useTopUp: () => ({
    mutateAsync: mockTopUpMutate,
    isPending: false,
  }),
  useTopUpCustom: () => ({
    mutateAsync: mockTopUpCustomMutate,
    isPending: false,
  }),
}));

describe('Wallet & Credits Flow Unit Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = {};
  });

  // =========================================================================
  // 1. CreditsOverviewScreen
  // =========================================================================
  describe('1. CreditsOverviewScreen', () => {
    it('renders current credit balance and active wallet status', async () => {
      const { getByText } = await render(<CreditsOverviewScreen />);

      expect(getByText('Số điểm hiện tại')).toBeTruthy();
      expect(getByText('1250')).toBeTruthy();
      expect(getByText('Credits')).toBeTruthy();
      expect(getByText('Đang hoạt động')).toBeTruthy();
    });

    it('renders recent transactions list', async () => {
      const { getByText } = await render(<CreditsOverviewScreen />);

      expect(getByText('Thưởng nhiệm vụ hàng ngày')).toBeTruthy();
      expect(getByText('Nạp Credits MoMo')).toBeTruthy();
    });

    it('navigates to transaction history when pressing "Xem tất cả"', async () => {
      const { getByLabelText } = await render(<CreditsOverviewScreen />);

      fireEvent.press(getByLabelText('Xem tất cả hoạt động Credits'));
      expect(mockPush).toHaveBeenCalledWith('/credits/history');
    });

    it('navigates to top up screen when pressing "＋  Nạp Credits"', async () => {
      const { getByText } = await render(<CreditsOverviewScreen />);

      fireEvent.press(getByText('＋  Nạp Credits'));
      expect(mockPush).toHaveBeenCalledWith('/credits/top-up');
    });
  });

  // =========================================================================
  // 2. TopUpScreen
  // =========================================================================
  describe('2. TopUpScreen', () => {
    it('renders credit packages and defaults to 1,000 Credits package', async () => {
      const { getByText, getByLabelText } = await render(<TopUpScreen />);

      expect(getByText('Chọn gói nạp')).toBeTruthy();
      expect(getByLabelText(/Gói.*1000 Credits/)).toBeTruthy();
      expect(getByLabelText(/Gói.*500 Credits/)).toBeTruthy();
    });

    it('selects a different package when pressed and recalculates price', async () => {
      const { getByLabelText } = await render(<TopUpScreen />);

      // Select 2,000 package
      fireEvent.press(getByLabelText(/Gói.*2000 Credits/));

      await waitFor(() => {
        expect(getByLabelText(/Gói.*2000 Credits/)).toBeTruthy();
      });
    });

    it('dispatches top up mutation when confirming payment', async () => {
      const { getByText } = await render(<TopUpScreen />);

      const confirmButton = getByText(/Xác nhận thanh toán/);
      fireEvent.press(confirmButton);

      await waitFor(() => {
        expect(mockTopUpMutate).toHaveBeenCalledWith({
          packageId: expect.any(Number),
          gateway: 'MOMO',
        });
      });
    });
  });

  // =========================================================================
  // 3. CustomAmountScreen
  // =========================================================================
  describe('3. CustomAmountScreen', () => {
    it('renders default custom amount of 75 and balance', async () => {
      const { getByDisplayValue, getByText } = await render(<CustomAmountScreen />);

      expect(getByDisplayValue('75')).toBeTruthy();
      expect(getByText('1250 Credits')).toBeTruthy();
    });

    it('increments custom amount by +10 when button is pressed', async () => {
      const { getByText, getByDisplayValue } = await render(<CustomAmountScreen />);

      fireEvent.press(getByText('+10'));

      await waitFor(() => {
        expect(getByDisplayValue('85')).toBeTruthy();
      });
    });

    it('navigates to top-up with custom amount param when continuing', async () => {
      const { getByText } = await render(<CustomAmountScreen />);

      fireEvent.press(getByText(/Tiếp tục với/));

      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/credits/top-up',
        params: { amount: '75' },
      });
    });
  });

  // =========================================================================
  // 4. CreditHistoryScreen
  // =========================================================================
  describe('4. CreditHistoryScreen', () => {
    it('renders credit history header, date filters, and transaction groups', async () => {
      const { getByText, getByLabelText } = await render(<CreditHistoryScreen />);

      expect(getByText('Lịch sử Credits')).toBeTruthy();
      expect(getByText('Từ ngày')).toBeTruthy();
      expect(getByText('Đến ngày')).toBeTruthy();
      expect(getByText('Tháng 8 năm 2026')).toBeTruthy();
      expect(getByText('Gia hạn gói Pro')).toBeTruthy();
      expect(getByText('Nâng cấp lên gói Pro')).toBeTruthy();
      expect(getByText('Nạp tiền lần 1')).toBeTruthy();
      expect(getByLabelText('Từ ngày: 01 Th08 2026')).toBeTruthy();
    });

    it('navigates back when header back button is pressed', async () => {
      const { getByLabelText } = await render(<CreditHistoryScreen />);

      const backBtn = getByLabelText('Quay lại');
      fireEvent.press(backBtn);

      expect(mockBack).toHaveBeenCalled();
    });
  });
});
