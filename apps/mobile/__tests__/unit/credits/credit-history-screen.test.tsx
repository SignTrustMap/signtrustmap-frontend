import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CreditHistoryScreen } from '@/feature/credits/pages/credit-history-screen';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockBack,
  }),
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    backgroundElement: '#F8FAFC',
    backgroundSelected: '#EFF6FF',
    text: '#0F172A',
    textSecondary: '#007B8B',
    placeholder: '#94A3B8',
    border: '#E2E8F0',
    primary: '#007B8B',
    onPrimary: '#FFFFFF',
    secondary: '#E8F4F6',
    danger: '#EF4444',
    grey: '#888888',
    surface: '#FFFFFF',
  }),
}));

jest.mock('@/feature/credits/hooks/use-wallet', () => ({
  useGetWallet: () => ({
    data: {
      wallet: { id: 'w1', userId: 'u1', balance: 500, updatedAt: '2026-08-01' },
      recentTransactions: [
        {
          id: 'tx-1',
          amount: -129000,
          transactionType: 'SUBSCRIPTION',
          referenceType: 'Pro',
          referenceId: null,
          description: 'Gia hạn gói Pro',
          createdAt: '2026-08-01T10:30:00.000Z',
        },
        {
          id: 'tx-2',
          amount: 100000,
          transactionType: 'TOPUP',
          referenceType: null,
          referenceId: null,
          description: 'Nạp tiền lần 1',
          createdAt: '2026-07-01T09:00:00.000Z',
        },
      ],
    },
    isLoading: false,
  }),
}));

jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: () => React.createElement(View, { testID: 'mock-date-picker' }),
  };
});

describe('CreditHistoryScreen Component Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders credit history screen with transactions and filter toolbar', async () => {
    const { getByText, getByLabelText } = await render(<CreditHistoryScreen />);

    // Header title
    expect(getByText('Lịch sử Credits')).toBeTruthy();
    // Filter controls
    expect(getByText('Lọc theo ngày')).toBeTruthy();
    expect(getByLabelText('Chọn Từ ngày')).toBeTruthy();
    expect(getByLabelText('Chọn Đến ngày')).toBeTruthy();
    // Transactions from walletData
    expect(getByText('Gia hạn gói Pro')).toBeTruthy();
    expect(getByText('Nạp tiền lần 1')).toBeTruthy();
  });

  it('triggers router.back when back button in header is pressed', async () => {
    const { getByLabelText } = await render(<CreditHistoryScreen />);

    const backButton = getByLabelText('Quay lại');
    fireEvent.press(backButton);

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('allows toggling date sort order on transactions', async () => {
    const { getByLabelText, getByText } = await render(<CreditHistoryScreen />);

    // Starts at "Mới nhất" (desc)
    expect(getByText('Mới nhất')).toBeTruthy();

    const sortButton = getByLabelText('Sắp xếp ngày: Mới nhất');
    fireEvent.press(sortButton);

    await waitFor(() => {
      expect(getByText('Cũ nhất')).toBeTruthy();
    });
  });

  it('allows applying quick preset chips like 7 ngày', async () => {
    const { getByText } = await render(<CreditHistoryScreen />);

    const sevenDaysChip = getByText('7 ngày');
    fireEvent.press(sevenDaysChip);

    await waitFor(() => {
      expect(getByText('Đặt lại')).toBeTruthy();
    });
  });
});
