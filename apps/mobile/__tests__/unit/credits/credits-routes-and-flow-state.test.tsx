import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
jest.mock('@/feature/credits/pages/custom-amount-screen', () => {
  const { View, Text } = require('react-native');
  return {
    CustomAmountScreen: () => (
      <View testID="custom-amount-screen">
        <Text>Custom Amount Screen</Text>
      </View>
    ),
  };
});

jest.mock('@/feature/credits/pages/credit-history-screen', () => {
  const { View, Text } = require('react-native');
  return {
    CreditHistoryScreen: () => (
      <View testID="credit-history-screen">
        <Text>Credit History Screen</Text>
      </View>
    ),
  };
});

jest.mock('@/feature/credits/pages/credits-overview-screen', () => {
  const { View, Text } = require('react-native');
  return {
    CreditsOverviewScreen: () => (
      <View testID="credits-overview-screen">
        <Text>Credits Overview Screen</Text>
      </View>
    ),
  };
});

jest.mock('@/feature/credits/pages/top-up-screen', () => {
  const { View, Text } = require('react-native');
  return {
    TopUpScreen: () => (
      <View testID="top-up-screen">
        <Text>Top Up Screen</Text>
      </View>
    ),
  };
});

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children, ...props }: any) => <View {...props}>{children}</View>,
  };
});

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    background: '#FFFFFF',
    backgroundElement: '#F8FAFC',
    backgroundSelected: '#EFF6FF',
    primary: '#2563EB',
    text: '#0F172A',
    textSecondary: '#475569',
  }),
}));

import CustomCreditAmountRoute from '@/app/(authenticated)/(tabs)/credits/custom-amount';
import CreditHistoryRoute from '@/app/(authenticated)/(tabs)/credits/history';
import CreditsRoute from '@/app/(authenticated)/(tabs)/credits/index';
import CreditTopUpRoute from '@/app/(authenticated)/(tabs)/credits/top-up';
import { CreditFlowState } from '@/feature/credits/components/credit-flow-state';

describe('Credit Routes and CreditFlowState Component', () => {
  describe('Credit Tab Routes', () => {
    it('renders custom-amount.tsx', async () => {
      const { getByTestId, getByText } = await render(<CustomCreditAmountRoute />);
      expect(getByTestId('custom-amount-screen')).toBeTruthy();
      expect(getByText('Custom Amount Screen')).toBeTruthy();
    });

    it('renders history.tsx', async () => {
      const { getByTestId, getByText } = await render(<CreditHistoryRoute />);
      expect(getByTestId('credit-history-screen')).toBeTruthy();
      expect(getByText('Credit History Screen')).toBeTruthy();
    });

    it('renders index.tsx', async () => {
      const { getByTestId, getByText } = await render(<CreditsRoute />);
      expect(getByTestId('top-up-screen')).toBeTruthy();
      expect(getByText('Top Up Screen')).toBeTruthy();
    });

    it('renders top-up.tsx', async () => {
      const { getByTestId, getByText } = await render(<CreditTopUpRoute />);
      expect(getByTestId('top-up-screen')).toBeTruthy();
      expect(getByText('Top Up Screen')).toBeTruthy();
    });
  });

  describe('CreditFlowState Component', () => {
    it('renders loading state as page presentation', async () => {
      const { getByText } = await render(
        <CreditFlowState
          title="Đang khởi tạo giao dịch"
          message="Vui lòng chờ trong giây lát"
          variant="loading"
        />
      );

      expect(getByText('Đang khởi tạo giao dịch')).toBeTruthy();
      expect(getByText('Vui lòng chờ trong giây lát')).toBeTruthy();
    });

    it('renders success state as overlay presentation with action button', async () => {
      const mockAction = jest.fn();
      const { getByText } = await render(
        <CreditFlowState
          title="Nạp tiền thành công"
          message="Số dư ví đã được cộng thêm"
          variant="success"
          presentation="overlay"
          actionLabel="Hoàn tất"
          onAction={mockAction}
          successSymbol="✓"
        />
      );

      expect(getByText('Nạp tiền thành công')).toBeTruthy();
      expect(getByText('Số dư ví đã được cộng thêm')).toBeTruthy();
      expect(getByText('✓')).toBeTruthy();

      const btn = getByText('Hoàn tất');
      fireEvent.press(btn);
      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('renders with custom detail element', async () => {
      const { Text } = require('react-native');
      const { getByText } = await render(
        <CreditFlowState
          title="Chi tiết giao dịch"
          variant="success"
          detail={<Text>Mã GD: #123456</Text>}
        />
      );
      expect(getByText('Mã GD: #123456')).toBeTruthy();
    });
  });
});
