import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import * as WebBrowser from 'expo-web-browser';
import { TopUpScreen } from '@/feature/credits/pages/top-up-screen';
import * as walletHooks from '@/feature/credits/hooks/use-wallet';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
let mockSearchParams: { amount?: string } = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
  }),
  useLocalSearchParams: () => mockSearchParams,
}));

jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(),
  WebBrowserPresentationStyle: { FULL_SCREEN: 'fullScreen' },
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

describe('TopUpScreen', () => {
  const mockMutateTopUp = jest.fn();
  const mockMutateTopUpCustom = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = {};

    jest.spyOn(walletHooks, 'useGetWallet').mockReturnValue({
      data: {
        wallet: { id: 'w-1', userId: 'u-1', balance: 250, updatedAt: '2026-10-26T00:00:00Z' },
        recentTransactions: [],
      },
      isLoading: false,
    } as any);

    jest.spyOn(walletHooks, 'useGetTopUpPackages').mockReturnValue({
      data: [
        { id: 101, packageName: 'Gói Cơ bản', creditAmount: 300, priceVnd: '30000.00', isActive: true },
        { id: 102, packageName: 'Gói Tiêu chuẩn', creditAmount: 1000, priceVnd: '100000.00', isActive: true },
        { id: 103, packageName: 'Gói VIP', creditAmount: 3000, priceVnd: '280000.00', isActive: true },
      ],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as any);

    jest.spyOn(walletHooks, 'useTopUp').mockReturnValue({
      mutateAsync: mockMutateTopUp.mockResolvedValue({
        paymentOrder: { id: 'ord-1', orderCode: 'STM-123', status: 'COMPLETED' },
        payUrl: 'https://test-payment.momo.vn/v2/gateway/pay',
        message: 'Topup success',
      }),
      isPending: false,
    } as any);

    jest.spyOn(walletHooks, 'useTopUpCustom').mockReturnValue({
      mutateAsync: mockMutateTopUpCustom.mockResolvedValue({
        paymentOrder: { id: 'ord-custom-1', orderCode: 'STM-CUSTOM', status: 'COMPLETED' },
        message: 'Custom topup success',
      }),
      isPending: false,
    } as any);
  });

  it('renders balance, package list, default preselected package, and available payment gateways', async () => {
    const { findByText, findAllByText } = await render(<TopUpScreen />);

    // Balance
    expect(await findByText(/250/)).toBeTruthy();
    expect(await findByText('Số điểm hiện tại')).toBeTruthy();

    // Packages from mock
    expect(await findByText('Gói Cơ bản')).toBeTruthy();
    expect(await findByText('Gói Tiêu chuẩn')).toBeTruthy();
    expect(await findByText('Gói VIP')).toBeTruthy();

    // 1000 Credits is popular/preselected
    expect(await findByText('PHỔ BIẾN')).toBeTruthy();
    const prices = await findAllByText('100.000 ₫');
    expect(prices.length).toBeGreaterThanOrEqual(1);

    // Available gateways from backend
    expect(await findByText('Ví điện tử MoMo')).toBeTruthy();
    expect(await findByText('Khuyên dùng')).toBeTruthy();
    expect(await findByText('Chuyển khoản VietQR')).toBeTruthy();
    expect(await findByText('Thanh toán Sandbox (Thử nghiệm)')).toBeTruthy();
  });

  it('allows selecting a different package and updates confirm button', async () => {
    const { findByLabelText, findByText } = await render(<TopUpScreen />);

    // Click on VIP package button
    const vipBtn = await findByLabelText(/Gói VIP/);
    fireEvent.press(vipBtn);

    // VIP price is 280.000 ₫
    expect(await findByText('Xác nhận thanh toán 280.000 ₫')).toBeTruthy();
  });

  it('calls topUp with selected packageId and gateway, opening payUrl if returned', async () => {
    const { findByText } = await render(<TopUpScreen />);

    // Default preselected is Gói Tiêu chuẩn (id: 102) and MoMo gateway
    const payBtn = await findByText('Xác nhận thanh toán 100.000 ₫');
    fireEvent.press(payBtn);

    await waitFor(() => {
      expect(mockMutateTopUp).toHaveBeenCalledWith({ packageId: 102, gateway: 'MOMO' });
    });

    await waitFor(() => {
      expect(WebBrowser.openBrowserAsync).toHaveBeenCalledWith(
        'https://test-payment.momo.vn/v2/gateway/pay',
        expect.anything(),
      );
    });
  });

  it('allows selecting VietQR or Sandbox gateway and passes gateway to topUp', async () => {
    const { findByLabelText, findByText } = await render(<TopUpScreen />);

    // Select Sandbox gateway
    const sandboxBtn = await findByLabelText(/Thanh toán bằng Thanh toán Sandbox/);
    fireEvent.press(sandboxBtn);

    const payBtn = await findByText('Xác nhận thanh toán 100.000 ₫');
    fireEvent.press(payBtn);

    await waitFor(() => {
      expect(mockMutateTopUp).toHaveBeenCalledWith({ packageId: 102, gateway: 'MOCK' });
    });
  });

  it('supports custom credit amount passed in params and calls topUpCustom on confirm', async () => {
    mockSearchParams = { amount: '750' };

    const { findByText } = await render(<TopUpScreen />);

    // Should show custom credit selection
    expect(await findByText('Đã chọn: 750 Credits')).toBeTruthy();
    // 750 * 100 = 75.000 ₫
    const payBtn = await findByText('Xác nhận thanh toán 75.000 ₫');
    expect(payBtn).toBeTruthy();

    fireEvent.press(payBtn);

    await waitFor(() => {
      expect(mockMutateTopUpCustom).toHaveBeenCalledWith({ amount: 750, gateway: 'MOMO' });
    });
  });

  it('shows error message if top up fails', async () => {
    mockMutateTopUp.mockRejectedValueOnce(new Error('Thanh toán bị từ chối bởi cổng MoMo'));

    const { findByText } = await render(<TopUpScreen />);

    const payBtn = await findByText('Xác nhận thanh toán 100.000 ₫');
    fireEvent.press(payBtn);

    const errorMsg = await findByText('Thanh toán bị từ chối bởi cổng MoMo');
    expect(errorMsg).toBeTruthy();
  });
});
